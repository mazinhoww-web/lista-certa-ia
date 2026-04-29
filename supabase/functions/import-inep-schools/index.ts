// supabase/functions/import-inep-schools/index.ts
//
// One-shot admin function to import the INEP schools CSV (~181k rows) from
// the "listaescolasinep" Storage bucket into public.inep_schools.
//
// This is NOT a product function. It's invoked manually by the operator from
// the browser console with a custom-header secret. After the import is
// validated, this function and the CSV should be deleted. Operational steps
// in IMPORT-INEP-SCHOOLS.md (root of repo).
//
// Streaming architecture (revised after WORKER_RESOURCE_LIMIT OOM):
// The earlier implementation used supabase.storage.from(...).download(...)
// followed by blob.text() and csv parse(text). That buffered the entire
// ~50MB file as a UTF-16 string and a parsed-row array, blowing past the
// 150MB worker memory limit on Lovable Cloud free.
//
// The current implementation:
//   1. createSignedUrl (cheap REST call) → short-lived URL.
//   2. fetch(signedUrl) → Response whose body is a true ReadableStream.
//   3. pipeThrough(TextDecoderStream) → string chunks.
//   4. Hand-rolled quote-aware record splitter on a small running buffer.
//   5. mapRow + upsert in batches of BATCH_SIZE.
// Worker peak memory stays in the low-MB range regardless of file size
// because chunks are dropped after they're consumed.
//
// Bandwidth note: with offset-based pagination over a stream, each call
// re-reads bytes from byte 0 up to its own (offset+limit) line. Aggregate
// download across all 91 chunks is ~4.5GB. Acceptable for a one-shot.
//
// Auth model: Lovable Cloud does not expose service_role in its UI, so this
// function is gated by a custom header `x-import-secret` that the operator
// matches against IMPORT_INEP_SECRET (a Lovable Cloud secret created
// manually for this import). Internally the function still uses
// SUPABASE_SERVICE_ROLE_KEY (auto-injected by Supabase into Deno.env) to
// bypass RLS — that key is never exposed to the client.
//
// JWT verification is disabled for this function via supabase/config.toml
// ([functions.import-inep-schools] verify_jwt = false), so the Supabase
// gateway does not require an Authorization: Bearer header.
//
// Idempotent: uses upsert ON CONFLICT (inep_code), so reinvoking from any
// offset is safe — duplicate rows are not created.
//
// CORS uses "*" because this is a one-shot admin endpoint, not a public
// product function. CLAUDE.md §7 calls for restrictive CORS via a shared
// helper for production endpoints; that helper does not exist yet.
//
// TODO: when extracting _shared/cors.ts for production functions
// (LC-005, LC-006, LC-012), this one-shot can be deleted entirely.
// Don't refactor it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const BUCKET = "listaescolasinep";
const FILE_PATH = "lista_escolas_com_cep.csv";
const BATCH_SIZE = 500;       // upsert chunk size (internal to this function)
const DEFAULT_LIMIT = 2000;   // rows per HTTP invocation — conservative for Lovable Cloud free
const MAX_LIMIT = 20000;
const SIGNED_URL_TTL_SECONDS = 60;
const SKIP_LOG_INTERVAL = 10_000; // emit lines_skipped log every N skipped rows

const CSV_COLUMNS = [
  "restrição_de_atendimento",
  "escola",
  "código_inep",
  "uf",
  "município",
  "localização",
  "localidade_diferenciada",
  "categoria_administrativa",
  "endereço",
  "telefone",
  "dependência_administrativa",
  "categoria_escola_privada",
  "conveniada_poder_público",
  "regulamentação_pelo_conselho_de_educação",
  "porte_da_escola",
  "etapas_e_modalidade_de_ensino_oferecidas",
  "outras_ofertas_educacionais",
  "latitude",
  "longitude",
  "cep",
  "fonte_cep",
];

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-import-secret",
};

interface CsvRow {
  [key: string]: string;
}

interface InepSchoolInsert {
  inep_code: string;
  trade_name: string;
  uf: string;
  city: string;
  location: string | null;
  admin_category: string | null;
  admin_dependency: string | null;
  address: string | null;
  phone: string | null;
  school_size: string | null;
  education_levels: string | null;
  latitude: number | null;
  longitude: number | null;
  cep: string | null;
  cep_source: string | null;
  restrictions: string | null;
}

function log(event: string, fields: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
}

function logError(event: string, fields: Record<string, unknown> = {}): void {
  console.error(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
}

function parseNumeric(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function clean(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

// Quote-aware CSV record splitter operating on a running buffer.
// Returns the index of the record-terminating LF (outside quotes), or -1
// if no complete record is in the buffer yet. Multi-line quoted fields
// are handled by skipping LFs that fall inside a "..." segment.
//
// Inline behavior assertions (kept as comments — not executed in prod):
//   findRecordEnd('a,"b,c",d\nrest', 0) → returns 9   (the position of \n)
//   findRecordEnd('a,"b\nc",d\nx',   0) → returns 9   (LF inside quotes ignored)
//   findRecordEnd('a,"b""c",d\n',     0) → returns 10  (escaped quote handled)
//   findRecordEnd('a,b,c',           0) → returns -1  (incomplete)
function findRecordEnd(buf: string, startIdx: number): number {
  let i = startIdx;
  let inQuotes = false;
  while (i < buf.length) {
    const c = buf[i];
    if (c === '"') {
      if (inQuotes && buf[i + 1] === '"') {
        i += 2; // escaped double-quote
        continue;
      }
      inQuotes = !inQuotes;
      i++;
    } else if (!inQuotes && c === "\n") {
      return i;
    } else {
      i++;
    }
  }
  return -1;
}

// Quote-aware single-record field splitter.
//
// Inline behavior assertions (kept as comments — not executed in prod):
//   parseRecord('a,"b,c",d')      → ["a", "b,c", "d"]
//   parseRecord('a,"b""c",d')     → ["a", 'b"c', "d"]
//   parseRecord('a,b,')           → ["a", "b", ""]
//   parseRecord('"a\nb",c')       → ["a\nb", "c"]
function parseRecord(record: string): string[] {
  const out: string[] = [];
  let cur = "";
  let i = 0;
  while (i < record.length) {
    const c = record[i];
    if (c === '"') {
      // start (or continuation) of a quoted field
      i++;
      while (i < record.length) {
        if (record[i] === '"') {
          if (record[i + 1] === '"') {
            cur += '"';
            i += 2;
          } else {
            i++;
            break;
          }
        } else {
          cur += record[i];
          i++;
        }
      }
    } else if (c === ",") {
      out.push(cur);
      cur = "";
      i++;
    } else {
      cur += c;
      i++;
    }
  }
  out.push(cur);
  return out;
}

function rowFromFields(fields: string[]): CsvRow {
  const row: CsvRow = {};
  for (let i = 0; i < CSV_COLUMNS.length; i++) {
    const col = CSV_COLUMNS[i];
    if (col === undefined) continue;
    row[col] = fields[i] ?? "";
  }
  return row;
}

function mapRow(row: CsvRow): InepSchoolInsert | null {
  const inepCode = clean(row["código_inep"]);
  const tradeName = clean(row["escola"]);
  const uf = clean(row["uf"]);
  const city = clean(row["município"]);

  if (!inepCode || !tradeName || !uf || !city) return null;

  return {
    inep_code: inepCode,
    trade_name: tradeName,
    uf,
    city,
    location: clean(row["localização"]),
    admin_category: clean(row["categoria_administrativa"]),
    admin_dependency: clean(row["dependência_administrativa"]),
    address: clean(row["endereço"]),
    phone: clean(row["telefone"]),
    school_size: clean(row["porte_da_escola"]),
    education_levels: clean(row["etapas_e_modalidade_de_ensino_oferecidas"]),
    latitude: parseNumeric(row["latitude"]),
    longitude: parseNumeric(row["longitude"]),
    cep: clean(row["cep"]),
    cep_source: clean(row["fonte_cep"]),
    restrictions: clean(row["restrição_de_atendimento"]),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Custom-header auth gate.
    const expectedSecret = Deno.env.get("IMPORT_INEP_SECRET");
    if (!expectedSecret) {
      logError("auth_failed", { reason: "secret_not_configured" });
      return new Response(
        JSON.stringify({
          error: "secret_not_configured",
          hint: "Create IMPORT_INEP_SECRET in Lovable Cloud Secrets",
        }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    const importSecret = req.headers.get("x-import-secret");
    if (importSecret !== expectedSecret) {
      logError("auth_failed", { reason: "unauthorized" });
      return new Response(
        JSON.stringify({ error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    // 2. Supabase env validation — auto-injected by the runtime.
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      logError("env_missing", { has_url: !!SUPABASE_URL, has_key: !!SERVICE_ROLE_KEY });
      return new Response(
        JSON.stringify({
          error: "env_missing",
          details: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set",
        }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const offset = Math.max(0, parseInt(String(body.offset ?? "0"), 10) || 0);
    const limit = Math.min(
      MAX_LIMIT,
      parseInt(String(body.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
    );

    log("chunk_start", { offset, limit });

    // 3. Get a short-lived signed URL — cheap, no body downloaded yet.
    const { data: signed, error: urlErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(FILE_PATH, SIGNED_URL_TTL_SECONDS);
    if (urlErr || !signed?.signedUrl) {
      logError("signed_url_failed", { details: urlErr?.message });
      return new Response(
        JSON.stringify({ error: "signed_url_failed", details: urlErr?.message }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }
    log("signed_url_created", {});

    // 4. Open a streaming fetch of the CSV.
    const res = await fetch(signed.signedUrl);
    if (!res.ok || !res.body) {
      logError("fetch_failed", { status: res.status });
      return new Response(
        JSON.stringify({ error: "fetch_failed", status: res.status }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    log("stream_opened", {});

    // 5. Stream loop: skip until offset, then process up to limit lines.
    let buf = "";
    let header: string[] | null = null;
    let dataRowIdx = -1;          // 0-based index of data row (post-header)
    let processedInThisCall = 0;
    let skippedInvalid = 0;
    let inserted = 0;
    // Object wrapper so TS does not narrow exitReason after closures mutate it.
    const state: { exitReason: "limit" | "eof" } = { exitReason: "eof" };
    const errors: string[] = [];
    let pending: InepSchoolInsert[] = [];
    let lastSkipLogAt = 0;

    async function flushBatch(batch: InepSchoolInsert[], batchOffset: number): Promise<void> {
      if (batch.length === 0) return;
      const { error: insErr } = await supabase
        .from("inep_schools")
        .upsert(batch, { onConflict: "inep_code", ignoreDuplicates: false });
      if (insErr) {
        logError("batch_failed", {
          batch_offset: batchOffset,
          batch_size: batch.length,
          error: insErr.message,
        });
        errors.push(`batch starting at ${batchOffset}: ${insErr.message}`);
      } else {
        inserted += batch.length;
        log("upsert_batch", { batch_offset: batchOffset, inserted: batch.length });
      }
    }

    const processRecord = async (record: string): Promise<void> => {
      if (header === null) {
        header = parseRecord(record);
        log("header_parsed", { columns: header.length });
        return;
      }

      dataRowIdx++;

      if (dataRowIdx < offset) {
        if (dataRowIdx - lastSkipLogAt >= SKIP_LOG_INTERVAL) {
          log("lines_skipped", { skipped_until: dataRowIdx + 1 });
          lastSkipLogAt = dataRowIdx;
        }
        return;
      }

      if (processedInThisCall >= limit) {
        // Pre-empt: don't count this row, leave it for the next call.
        dataRowIdx--;
        state.exitReason = "limit";
        return;
      }

      if (processedInThisCall === 0) {
        log("chunk_processing", { from_row: dataRowIdx });
      }

      const fields = parseRecord(record);
      const mapped = mapRow(rowFromFields(fields));
      if (mapped) {
        pending.push(mapped);
      } else {
        skippedInvalid++;
      }
      processedInThisCall++;

      if (pending.length >= BATCH_SIZE) {
        const batchOffset = offset + processedInThisCall - pending.length;
        const batch = pending;
        pending = [];
        await flushBatch(batch, batchOffset);
      }
    };

    try {
      // Drive the stream until limit is hit or EOF reached.
      let eof = false;
      while (true) {
        let recEnd = findRecordEnd(buf, 0);
        while (recEnd === -1 && !eof) {
          const { value, done } = await reader.read();
          if (done) {
            eof = true;
            break;
          }
          buf += value;
          recEnd = findRecordEnd(buf, 0);
        }

        if (recEnd === -1) {
          // EOF and no terminating newline. Treat remaining buf as final
          // record if non-empty (CSV files without trailing newline).
          if (buf.trim().length > 0) {
            const record = buf.replace(/\r$/, "");
            buf = "";
            await processRecord(record);
          }
          break;
        }

        const record = buf.slice(0, recEnd).replace(/\r$/, "");
        buf = buf.slice(recEnd + 1);
        await processRecord(record);

        if (state.exitReason === "limit") break;
      }

      // Flush remaining partial batch.
      if (pending.length > 0) {
        const batchOffset = offset + processedInThisCall - pending.length;
        await flushBatch(pending, batchOffset);
        pending = [];
      }
    } finally {
      // Always release the underlying socket / drop pending buffers.
      try {
        await reader.cancel();
      } catch (_) {
        // reader may already be closed; ignore
      }
    }

    const done = state.exitReason === "eof";
    const nextOffset = done ? null : offset + processedInThisCall;

    log("chunk_done", {
      processed_until: offset + processedInThisCall,
      processed_in_this_call: processedInThisCall,
      inserted,
      skipped: skippedInvalid,
      done,
      errors: errors.length,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        done,
        total: null,
        processed_until: offset + processedInThisCall,
        inserted,
        skipped: skippedInvalid,
        next_offset: nextOffset,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  } catch (err) {
    logError("unexpected", { details: String(err) });
    return new Response(
      JSON.stringify({ error: "unexpected", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  }
});
