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
import { parse } from "https://deno.land/std@0.224.0/csv/parse.ts";

const BUCKET = "listaescolasinep";
const FILE_PATH = "lista_escolas_com_cep.csv";
const BATCH_SIZE = 500;       // upsert chunk size (internal to this function)
const DEFAULT_LIMIT = 2000;   // rows per HTTP invocation — conservative for Lovable Cloud free
const MAX_LIMIT = 20000;

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
    // 1. Custom-header auth gate. The operator creates IMPORT_INEP_SECRET in
    //    Lovable Cloud Secrets; the script in IMPORT-INEP-SCHOOLS.md / PR
    //    description sends the same value via x-import-secret on each call.
    const expectedSecret = Deno.env.get("IMPORT_INEP_SECRET");
    if (!expectedSecret) {
      logError("auth_failed", { reason: "secret_not_configured" });
      return new Response(
        JSON.stringify({
          error: "secret_not_configured",
          details: "Set IMPORT_INEP_SECRET in Lovable Cloud → Edge Function Secrets",
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

    // 2. Supabase env validation — auto-injected by the runtime, never seen
    //    by the client. Validating early keeps error messages readable.
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      logError("env_missing", {
        has_url: !!SUPABASE_URL,
        has_key: !!SERVICE_ROLE_KEY,
      });
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

    // 1. Download CSV from bucket
    const { data: blob, error: dlErr } = await supabase.storage
      .from(BUCKET)
      .download(FILE_PATH);

    if (dlErr || !blob) {
      logError("download_failed", { details: dlErr?.message });
      return new Response(
        JSON.stringify({ error: "download_failed", details: dlErr?.message }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    const text = await blob.text();
    log("csv_downloaded", { bytes: text.length });

    // 2. Parse CSV (columns with accents)
    const rows = parse(text, {
      skipFirstRow: true,
      columns: CSV_COLUMNS,
    }) as CsvRow[];

    const total = rows.length;
    log("csv_parsed", { total_rows: total });

    const slice = rows.slice(offset, offset + limit);

    // 3. Map and filter
    const mapped = slice.map(mapRow).filter(Boolean) as InepSchoolInsert[];
    const skipped = slice.length - mapped.length;

    // 4. Upsert in batches (ON CONFLICT inep_code)
    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
      const batch = mapped.slice(i, i + BATCH_SIZE);
      const batchOffset = offset + i;

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
        log("batch_upserted", { batch_offset: batchOffset, batch_size: batch.length });
        inserted += batch.length;
      }
    }

    const nextOffset = offset + slice.length;
    const done = nextOffset >= total;

    log("chunk_done", {
      processed_until: nextOffset,
      total,
      inserted,
      skipped,
      done,
      errors: errors.length,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        done,
        total,
        processed_until: nextOffset,
        inserted_in_this_call: inserted,
        skipped_invalid_rows_in_this_call: skipped,
        next_offset: done ? null : nextOffset,
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
