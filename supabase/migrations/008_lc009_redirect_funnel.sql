-- supabase/migrations/008_lc009_redirect_funnel.sql
-- LC-009: indexes for funnel queries on analytics_events.
--
-- The existing idx_analytics_events_user_created (LC-008) covers
-- (user_id, created_at). LC-009 adds two more:
--
--   1. (user_id, event_name, created_at) — most common funnel query
--      shape: "all events of type X for user Y, newest first" used by
--      useSelfReportPurchase (last cart_strategy_clicked).
--
--   2. ((metadata->>'strategy_id')) WHERE metadata ? 'strategy_id' —
--      partial functional index for "all events touching strategy Z"
--      used by future analytics dashboards (TD-26).
--
-- No new tables. The self-report event reuses analytics_events with
-- metadata = { strategy_id, response, items_purchased_count? }.

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_event_created
  ON public.analytics_events(user_id, event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_strategy_id
  ON public.analytics_events((metadata->>'strategy_id'))
  WHERE metadata ? 'strategy_id';
