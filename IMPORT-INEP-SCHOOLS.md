# IMPORT-INEP-SCHOOLS.md

> Como popular a tabela `inep_schools` (181k linhas) a partir do CSV `lista_escolas_com_cep.csv` que você subiu no bucket `listaescolasinep` do Lovable Cloud.

## Pré-requisitos

- [x] Bucket `listaescolasinep` criado no Lovable Cloud Storage.
- [x] Arquivo `lista_escolas_com_cep.csv` enviado para o bucket.
- [ ] `schema.sql` executado (cria a tabela `inep_schools` com as 16 colunas).

Se você ainda não rodou o `schema.sql`, faça isso primeiro. O arquivo está em `/mnt/user-data/outputs/schema.sql` — copie e cole no SQL Editor do Lovable Cloud.

---

## Opção A (recomendada) — Edge Function paginada

A função baixa o CSV do bucket, parseia, mapeia 21→16 colunas, e insere em batches. Como Edge Functions têm timeout (25s no plano free, 400s no pago), a função é **paginada**: você invoca com `offset` e ela retorna `next_offset` até processar tudo.

### Passo 1 — Criar a Edge Function

No painel do Lovable Cloud:

1. Vá em **Edge Functions → Create new function**.
2. Nome: `import-inep-schools`.
3. Cole o código abaixo:

```typescript
// supabase/functions/import-inep-schools/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { parse } from 'https://deno.land/std@0.224.0/csv/parse.ts';

const BUCKET = 'listaescolasinep';
const FILE_PATH = 'lista_escolas_com_cep.csv';
const BATCH_SIZE = 500;

const CSV_COLUMNS = [
  'restrição_de_atendimento',
  'escola',
  'código_inep',
  'uf',
  'município',
  'localização',
  'localidade_diferenciada',
  'categoria_administrativa',
  'endereço',
  'telefone',
  'dependência_administrativa',
  'categoria_escola_privada',
  'conveniada_poder_público',
  'regulamentação_pelo_conselho_de_educação',
  'porte_da_escola',
  'etapas_e_modalidade_de_ensino_oferecidas',
  'outras_ofertas_educacionais',
  'latitude',
  'longitude',
  'cep',
  'fonte_cep',
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

function parseNumeric(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const n = parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function clean(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function mapRow(row: CsvRow): InepSchoolInsert | null {
  const inepCode = clean(row['código_inep']);
  const tradeName = clean(row['escola']);
  const uf = clean(row['uf']);
  const city = clean(row['município']);

  if (!inepCode || !tradeName || !uf || !city) return null;

  return {
    inep_code: inepCode,
    trade_name: tradeName,
    uf,
    city,
    location: clean(row['localização']),
    admin_category: clean(row['categoria_administrativa']),
    admin_dependency: clean(row['dependência_administrativa']),
    address: clean(row['endereço']),
    phone: clean(row['telefone']),
    school_size: clean(row['porte_da_escola']),
    education_levels: clean(row['etapas_e_modalidade_de_ensino_oferecidas']),
    latitude: parseNumeric(row['latitude']),
    longitude: parseNumeric(row['longitude']),
    cep: clean(row['cep']),
    cep_source: clean(row['fonte_cep']),
    restrictions: clean(row['restrição_de_atendimento']),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const body = await req.json().catch(() => ({}));
    const offset = Math.max(0, parseInt(String(body.offset ?? '0'), 10) || 0);
    const limit = Math.min(20000, parseInt(String(body.limit ?? '5000'), 10) || 5000);

    // 1. Baixa o CSV do bucket
    const { data: blob, error: dlErr } = await supabase.storage
      .from(BUCKET)
      .download(FILE_PATH);

    if (dlErr || !blob) {
      return new Response(
        JSON.stringify({ error: 'download_failed', details: dlErr?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const text = await blob.text();

    // 2. Parseia CSV (colunas com acento)
    const rows = parse(text, {
      skipFirstRow: true,
      columns: CSV_COLUMNS,
    }) as CsvRow[];

    const total = rows.length;
    const slice = rows.slice(offset, offset + limit);

    // 3. Mapeia e filtra
    const mapped = slice.map(mapRow).filter(Boolean) as InepSchoolInsert[];
    const skipped = slice.length - mapped.length;

    // 4. Insere em batches com upsert (onConflict no inep_code)
    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
      const batch = mapped.slice(i, i + BATCH_SIZE);
      const { error: insErr } = await supabase
        .from('inep_schools')
        .upsert(batch, { onConflict: 'inep_code', ignoreDuplicates: false });

      if (insErr) {
        errors.push(`batch starting at ${offset + i}: ${insErr.message}`);
      } else {
        inserted += batch.length;
      }
    }

    const nextOffset = offset + slice.length;
    const done = nextOffset >= total;

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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'unexpected', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

4. Em **Settings → Edge Functions Secrets**, confirme que `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão presentes (são padrão do Supabase, devem aparecer automaticamente).

5. **Deploy a função.**

### Passo 2 — Invocar a função em loop

A função processa 5.000 linhas por chamada (configurável via `limit`). Para 181k linhas → ~37 chamadas. Vou fornecer dois modos: navegador ou terminal.

#### Modo A — Console do navegador (fácil)

Abra `https://app.supabase.com/project/[seu-projeto]` ou o painel do Lovable Cloud no navegador, abra o **DevTools (F12) → Console**, e cole:

```javascript
async function runImport() {
  const FUNCTION_URL = 'https://[seu-project-ref].supabase.co/functions/v1/import-inep-schools';
  const SERVICE_ROLE_KEY = 'COLE_AQUI_SUA_SERVICE_ROLE_KEY'; // Settings → API → service_role secret

  let offset = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let total = null;
  let chunk = 0;

  console.log('🚀 Iniciando import...');

  while (true) {
    chunk++;
    const start = performance.now();
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ offset, limit: 5000 }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error(`❌ Falha no chunk ${chunk} (offset ${offset}):`, txt);
      break;
    }

    const data = await res.json();
    const elapsed = ((performance.now() - start) / 1000).toFixed(1);

    if (total === null) total = data.total;
    totalInserted += data.inserted_in_this_call ?? 0;
    totalSkipped += data.skipped_invalid_rows_in_this_call ?? 0;

    console.log(
      `chunk ${chunk}  ${data.processed_until}/${total}  ` +
      `(+${data.inserted_in_this_call} ins, +${data.skipped_invalid_rows_in_this_call} skip)  ` +
      `${elapsed}s`
    );

    if (data.errors?.length) console.warn('⚠️  errors no chunk:', data.errors);

    if (data.done) break;
    offset = data.next_offset;
  }

  console.log(`✅ Import concluído. Inseridos: ${totalInserted}, ignorados: ${totalSkipped}, total: ${total}`);
}

runImport();
```

⚠️ **Service role key** vem do **Lovable Cloud → Settings → API → `service_role` (secret)**. Nunca cole essa chave em código de produção; isso é uso administrativo one-shot.

Tempo esperado: ~10-20 minutos (cada chunk leva 15-30s para baixar+parsear+inserir).

#### Modo B — Terminal local com curl (alternativa)

Se preferir terminal, salve em `import-loop.sh`:

```bash
#!/bin/bash
FUNCTION_URL="https://[seu-project-ref].supabase.co/functions/v1/import-inep-schools"
SERVICE_ROLE_KEY="COLE_SUA_KEY_AQUI"
OFFSET=0

while true; do
  echo "→ chamando offset=$OFFSET..."
  RESP=$(curl -s -X POST "$FUNCTION_URL" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"offset\":$OFFSET,\"limit\":5000}")

  echo "$RESP" | jq '{done, processed_until, inserted_in_this_call, total}'

  DONE=$(echo "$RESP" | jq -r '.done')
  NEXT=$(echo "$RESP" | jq -r '.next_offset')

  if [ "$DONE" = "true" ]; then
    echo "✅ pronto!"
    break
  fi

  OFFSET=$NEXT
  sleep 1
done
```

Rode: `chmod +x import-loop.sh && ./import-loop.sh` (precisa de `jq` instalado).

---

## Opção B (alternativa) — psql local com staging table

Se você tem `psql` instalado e o CSV localmente, é mais rápido. Pula o Edge Function e roda direto SQL.

### Passo 1 — String de conexão

No Lovable Cloud → **Settings → Database → Connection string** → modo **direct connection** (não pooler).

Formato:
```
postgresql://postgres:[SUA_SENHA]@db.[seu-project-ref].supabase.co:5432/postgres
```

### Passo 2 — Script SQL completo

Salve como `import-inep.sql`:

```sql
-- 1. Cria staging com 21 colunas exatamente na ordem do CSV
CREATE TABLE IF NOT EXISTS public._inep_staging (
  restricao_atendimento TEXT,
  escola TEXT,
  codigo_inep TEXT,
  uf TEXT,
  municipio TEXT,
  localizacao TEXT,
  localidade_diferenciada TEXT,
  categoria_administrativa TEXT,
  endereco TEXT,
  telefone TEXT,
  dependencia_administrativa TEXT,
  categoria_escola_privada TEXT,
  conveniada_poder_publico TEXT,
  regulamentacao_conselho TEXT,
  porte_da_escola TEXT,
  etapas_modalidade TEXT,
  outras_ofertas TEXT,
  latitude TEXT,
  longitude TEXT,
  cep TEXT,
  fonte_cep TEXT
);

-- 2. Copia o CSV (rodar com \copy do psql, não COPY do servidor)
-- IMPORTANTE: substitua o caminho pelo seu
\copy public._inep_staging FROM 'lista_escolas_com_cep.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');

-- 3. Insere na tabela final mapeando 21→16 colunas
INSERT INTO public.inep_schools (
  inep_code, trade_name, uf, city, location,
  admin_category, admin_dependency, address, phone,
  school_size, education_levels, latitude, longitude,
  cep, cep_source, restrictions
)
SELECT
  s.codigo_inep,
  s.escola,
  s.uf,
  s.municipio,
  NULLIF(s.localizacao, ''),
  NULLIF(s.categoria_administrativa, ''),
  NULLIF(s.dependencia_administrativa, ''),
  NULLIF(s.endereco, ''),
  NULLIF(s.telefone, ''),
  NULLIF(s.porte_da_escola, ''),
  NULLIF(s.etapas_modalidade, ''),
  NULLIF(s.latitude, '')::NUMERIC(9,6),
  NULLIF(s.longitude, '')::NUMERIC(9,6),
  NULLIF(s.cep, ''),
  NULLIF(s.fonte_cep, ''),
  NULLIF(s.restricao_atendimento, '')
FROM public._inep_staging s
WHERE s.codigo_inep IS NOT NULL
  AND s.codigo_inep != ''
  AND s.escola IS NOT NULL
  AND s.escola != ''
  AND s.uf IS NOT NULL
  AND s.uf != ''
ON CONFLICT (inep_code) DO NOTHING;

-- 4. Drop staging
DROP TABLE public._inep_staging;

-- 5. Valida
SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE uf = 'MT') AS mt FROM public.inep_schools;
```

### Passo 3 — Executar

```bash
psql "postgresql://postgres:[SUA_SENHA]@db.[project-ref].supabase.co:5432/postgres" -f import-inep.sql
```

Tempo: ~30-90 segundos (muito mais rápido que a Edge Function).

---

## Validação pós-import

Independente da opção escolhida, valide com estas queries no SQL Editor:

```sql
-- Total geral (esperado ~181000)
SELECT COUNT(*) FROM public.inep_schools;

-- Escolas em MT (esperado entre 4000 e 7000)
SELECT COUNT(*) FROM public.inep_schools WHERE uf = 'MT';

-- Escolas em Cuiabá especificamente
SELECT COUNT(*) FROM public.inep_schools WHERE uf = 'MT' AND city = 'Cuiabá';

-- Sanity check: lat/long preenchidos?
SELECT
  COUNT(*) AS total_mt,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL) AS com_lat,
  COUNT(*) FILTER (WHERE cep IS NOT NULL) AS com_cep
FROM public.inep_schools WHERE uf = 'MT';

-- Testa a RPC search_inep_schools (criada pelo schema.sql)
SELECT * FROM public.search_inep_schools('emef', 'MT', 5);
SELECT * FROM public.search_inep_schools('escola estadual', 'MT', 5);
```

---

## Limpeza

Após import bem-sucedido e validado:

- [ ] **Apagar o arquivo CSV do bucket** (não vai ser usado de novo). Lovable Cloud → Storage → bucket `listaescolasinep` → selecione `lista_escolas_com_cep.csv` → Delete.
- [ ] **(Opcional) Deletar o bucket inteiro** se não houver outro uso planejado.
- [ ] **(Opcional) Deletar a Edge Function `import-inep-schools`** — não vai rodar de novo no MVP.

---

## Quando algo der errado

| Sintoma | Causa | Solução |
|---|---|---|
| `download_failed` na função | Bucket name errado ou arquivo com nome diferente | Confirme o nome do bucket (`listaescolasinep`) e do arquivo (`lista_escolas_com_cep.csv`). Ajuste constantes no início da função. |
| Função retorna `total: 0` | CSV vazio ou parser falhou | Veja primeiras linhas do CSV: `head -3 arquivo.csv`. Confirme que tem cabeçalho e separador é vírgula. |
| Erro `invalid input syntax for type numeric` | Latitude/longitude com formato inesperado | A função já trata isso com `parseNumeric`. Se persistir, abra um chunk pequeno (`limit: 100`) e veja qual linha quebra. |
| Erro `duplicate key violates...` | Tentativa de import duplicado | A função já usa `upsert ON CONFLICT inep_code`. Se ver isso, é bug — me reporte. |
| Edge Function timeout | Plano free do Lovable Cloud (25s) | Reduza `limit` para 2000 por chamada. Mais chunks, cada um mais rápido. |
| `psql: could not connect to server` | String de conexão errada | Use a string em modo "direct" (não pooler). Confirme senha. |
| Encoding errado (caracteres como `ç` quebrados) | CSV em Latin-1 em vez de UTF-8 | Antes do import: `iconv -f LATIN1 -t UTF-8 entrada.csv > saida.csv` |

---

**Versão:** 1.0 — abril 2026
**Status:** documento operacional, executar uma vez antes da issue LC-002 do `BACKLOG.md`.
