-- supabase/migrations/005_lc006_public_search.sql
-- LC-006: public search of approved schools.
--
-- Adds a SECURITY DEFINER full-text RPC that any role (including anon)
-- can call to discover schools eligible for the public surface. The
-- function only exposes columns appropriate for a public listing
-- (no email, no phone, no cnpj). Per-row data the parent eventually
-- sees on /escola/:slug comes from the existing schools SELECT policy.
--
-- Also (re)issues a public-readable schools SELECT policy so anon
-- carries the same approved-only visibility documented in schema.sql.
-- The policy is idempotent: drop-if-exists + create.

-- ============================================================
-- 1. RPC: search_approved_schools
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_approved_schools(
  q           TEXT,
  uf_filter   TEXT DEFAULT NULL,
  city_filter TEXT DEFAULT NULL,
  limit_n     INT  DEFAULT 12
)
RETURNS TABLE (
  id                    UUID,
  slug                  TEXT,
  trade_name            TEXT,
  city                  TEXT,
  state                 TEXT,
  neighborhood          TEXT,
  email_likely_institutional BOOLEAN,
  published_lists_count INT,
  rank                  REAL
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.slug,
    s.trade_name,
    s.city,
    s.state,
    s.neighborhood,
    s.email_likely_institutional,
    (
      SELECT COUNT(*)::INT
      FROM lists l
      WHERE l.school_id = s.id AND l.status = 'published'
    ) AS published_lists_count,
    ts_rank(
      to_tsvector(
        'portuguese',
        s.trade_name || ' '
        || COALESCE(s.city, '') || ' '
        || COALESCE(s.neighborhood, '')
      ),
      plainto_tsquery('portuguese', COALESCE(q, ''))
    ) AS rank
  FROM schools s
  WHERE s.status = 'approved'
    AND (uf_filter IS NULL OR s.state = uf_filter)
    AND (city_filter IS NULL OR s.city ILIKE '%' || city_filter || '%')
    AND (
      q IS NULL OR q = ''
      OR to_tsvector(
           'portuguese',
           s.trade_name || ' '
           || COALESCE(s.city, '') || ' '
           || COALESCE(s.neighborhood, '')
         ) @@ plainto_tsquery('portuguese', q)
    )
  ORDER BY rank DESC, published_lists_count DESC, s.trade_name ASC
  LIMIT limit_n;
$$;

GRANT EXECUTE ON FUNCTION public.search_approved_schools(TEXT, TEXT, TEXT, INT)
  TO authenticated, anon;

-- ============================================================
-- 2. Idempotent public read policy on schools.
--    schema.sql already permits status='approved' as a public branch
--    via schools_select_approved_or_own. This adds an explicit policy
--    isolating the public read so future churn on the OR-policy does
--    not accidentally close the door for anon visitors.
-- ============================================================

DROP POLICY IF EXISTS schools_select_approved_public ON public.schools;
CREATE POLICY schools_select_approved_public ON public.schools
  FOR SELECT USING (status = 'approved');
