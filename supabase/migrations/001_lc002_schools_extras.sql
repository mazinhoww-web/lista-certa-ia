-- supabase/migrations/001_lc002_schools_extras.sql
-- LC-002: cadastro de escola.
--
-- Adds two flags consumed by the future admin triage screen (LC-004) and
-- updates the search_inep_schools RPC with a city filter so the cadastro UI
-- can scope results by CEP-derived city.
--
-- Slug generation is NOT touched: the existing trigger schools_auto_slug
-- (defined in schema.sql) already handles it via slugify() + UUID prefix.

-- 1. Defensive: ensure unaccent is available. schema.sql already uses it via
-- the slugify() function; this is idempotent and protects against fresh
-- environments where the extension was never enabled.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Two new columns on schools (LC-004 admin triage).
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS manually_added BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_likely_institutional BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.schools.manually_added IS
  'TRUE when the school was added by the operator outside the INEP base (no inep_code).';
COMMENT ON COLUMN public.schools.email_likely_institutional IS
  'Heuristic: TRUE when contact email is on a domain that looks institutional (not webmail).';

-- 3. Drop the existing 3-arg signature first so the new 4-arg one replaces it
-- cleanly. There are no production callers of the old signature yet.
DROP FUNCTION IF EXISTS public.search_inep_schools(TEXT, TEXT, INT);

CREATE OR REPLACE FUNCTION public.search_inep_schools(
    q TEXT,
    uf_filter TEXT DEFAULT NULL,
    city_filter TEXT DEFAULT NULL,
    limit_n INT DEFAULT 12
)
RETURNS TABLE (
    inep_code TEXT,
    trade_name TEXT,
    city TEXT,
    uf TEXT,
    address TEXT,
    cep TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    rank REAL
)
LANGUAGE SQL STABLE AS $$
    SELECT
        s.inep_code,
        s.trade_name,
        s.city,
        s.uf,
        s.address,
        s.cep,
        s.latitude,
        s.longitude,
        ts_rank(
            to_tsvector('portuguese', s.trade_name || ' ' || COALESCE(s.city, '')),
            plainto_tsquery('portuguese', q)
        ) AS rank
    FROM public.inep_schools s
    WHERE
        (uf_filter IS NULL OR s.uf = uf_filter)
        AND (city_filter IS NULL OR s.city ILIKE '%' || city_filter || '%')
        AND to_tsvector('portuguese', s.trade_name || ' ' || COALESCE(s.city, ''))
            @@ plainto_tsquery('portuguese', q)
    ORDER BY rank DESC, s.trade_name ASC
    LIMIT limit_n;
$$;
