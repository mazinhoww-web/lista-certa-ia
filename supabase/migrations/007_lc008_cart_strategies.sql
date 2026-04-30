-- supabase/migrations/007_lc008_cart_strategies.sql
-- LC-008: cart strategies via Mercado Livre + visual mocks Kalunga/Magalu.
--
-- This migration ships:
--   1. ml_search_cache  — shared ML search cache (no user RLS).
--   2. cart_strategies  — 3 strategies per (student, list).
--   3. analytics_events — generic event log (parent_id only, never student).
--   4. list_items.suggested_query  — pre-computed search terms.
--   5. students_access_log.metadata — JSONB for audit context.
--   6. CHECK constraint on students_access_log.action with the full enum.
--
-- ⚠️ LGPD note: cart_strategies, analytics_events and ml_search_cache do
-- NOT carry first_name or any student PII. The student_id is referenced
-- by foreign key but never decoded to a name in any of these tables.

-- ============================================================
-- 1. ml_search_cache
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ml_search_cache (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_normalized TEXT NOT NULL,
  source           TEXT NOT NULL DEFAULT 'mercadolibre'
                       CHECK (source IN ('mercadolibre')),
  results          JSONB NOT NULL,
  fetched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '6 hours'),
  UNIQUE(query_normalized, source)
);

CREATE INDEX IF NOT EXISTS idx_ml_cache_query_source
  ON public.ml_search_cache(query_normalized, source);
CREATE INDEX IF NOT EXISTS idx_ml_cache_expires
  ON public.ml_search_cache(expires_at);

ALTER TABLE public.ml_search_cache ENABLE ROW LEVEL SECURITY;
-- No user policies. Only service_role (Edge Function) reads/writes.

COMMENT ON TABLE public.ml_search_cache IS
  'LC-008: cached top-20 ML search results per normalized query. TTL 6h, stale fallback up to 7d.';

-- ============================================================
-- 2. cart_strategies
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cart_strategies (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id           UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  list_id              UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  strategy             TEXT NOT NULL
                          CHECK (strategy IN ('cheapest', 'fastest', 'recommended')),
  items                JSONB NOT NULL,
  total_cents          BIGINT NOT NULL DEFAULT 0,
  total_items          INT NOT NULL DEFAULT 0,
  unavailable_items    INT NOT NULL DEFAULT 0,
  has_partial_strategy BOOLEAN NOT NULL DEFAULT FALSE,
  retailers_summary    JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at           TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  UNIQUE(student_id, list_id, strategy)
);

CREATE INDEX IF NOT EXISTS idx_cart_strategies_student_list
  ON public.cart_strategies(student_id, list_id);
CREATE INDEX IF NOT EXISTS idx_cart_strategies_expires
  ON public.cart_strategies(expires_at);

ALTER TABLE public.cart_strategies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cart_strategies_parent_select ON public.cart_strategies;
CREATE POLICY cart_strategies_parent_select ON public.cart_strategies
  FOR SELECT TO authenticated USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE parent_id = auth.uid() AND deleted_at IS NULL
    )
  );
-- INSERT/UPDATE/DELETE only via service_role (build-cart Edge Function).

COMMENT ON COLUMN public.cart_strategies.items IS
  'JSONB array of CartStrategyItem. Each item has: list_item_id, list_item_name, source, is_mock, ml_item_id|null, title, price_cents, seller_name, shipping_type, is_full, permalink, thumbnail, status. Items with is_mock=true are synthetic for demo and MUST NOT be used for real purchase decisions.';

-- ============================================================
-- 3. list_items.suggested_query
-- ============================================================

ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS suggested_query TEXT;

COMMENT ON COLUMN public.list_items.suggested_query IS
  'Pre-computed query string for external catalog search. NULL → runtime concat name + specification.';

-- ============================================================
-- 4. students_access_log.metadata + CHECK on action
--    The metadata column is required by build-cart's audit insert.
--    The CHECK constraint is new (no prior constraint existed); the
--    enum covers values used in LC-007 + the new 'cart_generated'.
--    Pre-merge query verifies no rows exist outside the enum.
-- ============================================================

ALTER TABLE public.students_access_log
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.students_access_log
  DROP CONSTRAINT IF EXISTS students_access_log_action_check;
ALTER TABLE public.students_access_log
  ADD CONSTRAINT students_access_log_action_check
  CHECK (action IN (
    'read', 'create', 'update', 'soft_delete', 'list_change', 'cart_generated'
  ));

COMMENT ON COLUMN public.students_access_log.metadata IS
  'Audit context for the action. Must NOT contain PII (first_name, etc). Only IDs and counters.';

-- ============================================================
-- 5. analytics_events
-- ============================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name
  ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created
  ON public.analytics_events(user_id, created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analytics_events_insert_self ON public.analytics_events;
CREATE POLICY analytics_events_insert_self ON public.analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
-- No SELECT policy for users — only service_role/admin reads.

COMMENT ON TABLE public.analytics_events IS
  'LC-008: generic event log. user_id is the parent (auth.uid()) — never the student. metadata must not contain student PII.';
