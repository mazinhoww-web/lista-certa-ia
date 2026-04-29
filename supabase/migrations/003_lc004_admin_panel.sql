-- supabase/migrations/003_lc004_admin_panel.sql
-- LC-004: platform admin panel.
--
-- Adds an audit table + transactional RPC + helper view that together let
-- a platform_admin approve / reject / suspend / reactivate schools while
-- (a) leaving an immutable trail and (b) promoting the cadastrante's
-- profile.role from 'parent' to 'school_admin' on first approval.

-- ============================================================
-- 1. Audit table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.school_status_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    from_status school_status,
    to_status   school_status NOT NULL,
    changed_by  UUID NOT NULL REFERENCES public.profiles(id),
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason      TEXT
);

CREATE INDEX IF NOT EXISTS idx_status_log_school
  ON public.school_status_log(school_id);
CREATE INDEX IF NOT EXISTS idx_status_log_changed_at
  ON public.school_status_log(changed_at DESC);

ALTER TABLE public.school_status_log ENABLE ROW LEVEL SECURITY;

-- platform_admin reads everything
DROP POLICY IF EXISTS status_log_admin_all ON public.school_status_log;
CREATE POLICY status_log_admin_all ON public.school_status_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'platform_admin'
    )
  );

-- school_admin reads their own schools' history (for future LC-003+ feature)
DROP POLICY IF EXISTS status_log_school_admin_select ON public.school_status_log;
CREATE POLICY status_log_school_admin_select ON public.school_status_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.school_admins sa
      WHERE sa.school_id = school_status_log.school_id
      AND sa.user_id = auth.uid()
    )
  );

-- No INSERT policy: writes are funneled through admin_change_school_status
-- (SECURITY DEFINER) so the RPC can validate the actor is platform_admin
-- and atomize the update + insert.

-- ============================================================
-- 2. schools UPDATE policy already includes platform_admin (schema.sql).
--    Re-issuing as a defensive idempotent refresh.
-- ============================================================

DROP POLICY IF EXISTS schools_update_admin ON public.schools;
CREATE POLICY schools_update_admin ON public.schools
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.school_admins sa
      WHERE sa.school_id = schools.id AND sa.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'platform_admin'
    )
  );

-- ============================================================
-- 3. Transactional status mutation RPC
--    - Validates actor is platform_admin
--    - No-op guard (cannot transition to current status)
--    - Atomically: UPDATE schools, INSERT status log, optionally promote owner
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_change_school_status(
    p_school_id UUID,
    p_to_status school_status,
    p_reason    TEXT DEFAULT NULL
)
RETURNS TABLE (school_id UUID, status school_status, changed_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_status school_status;
  v_actor_id    UUID := auth.uid();
  v_is_admin    BOOLEAN;
  v_owner_id    UUID;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_actor_id AND role = 'platform_admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'forbidden: only platform_admin can change school status';
  END IF;

  SELECT s.status INTO v_from_status FROM schools s WHERE s.id = p_school_id;
  IF v_from_status IS NULL THEN
    RAISE EXCEPTION 'school not found: %', p_school_id;
  END IF;

  IF v_from_status = p_to_status THEN
    RAISE EXCEPTION 'school already in status %', p_to_status;
  END IF;

  UPDATE schools SET
    status          = p_to_status,
    rejected_reason = CASE WHEN p_to_status = 'rejected'  THEN p_reason ELSE NULL          END,
    approved_by     = CASE WHEN p_to_status = 'approved'  THEN v_actor_id ELSE approved_by END,
    approved_at     = CASE WHEN p_to_status = 'approved'  THEN NOW()      ELSE approved_at END,
    updated_at      = NOW()
  WHERE id = p_school_id;

  INSERT INTO school_status_log (school_id, from_status, to_status, changed_by, reason)
  VALUES (p_school_id, v_from_status, p_to_status, v_actor_id, p_reason);

  -- Promote first cadastrante (parent → school_admin) on first approval.
  -- WHERE role='parent' guard skips users already at higher role.
  IF p_to_status = 'approved' THEN
    SELECT user_id INTO v_owner_id
    FROM school_admins
    WHERE school_admins.school_id = p_school_id AND school_admins.role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_owner_id IS NOT NULL THEN
      UPDATE profiles
      SET role = 'school_admin', updated_at = NOW()
      WHERE id = v_owner_id AND role = 'parent';
    END IF;
  END IF;

  RETURN QUERY SELECT p_school_id, p_to_status, NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_change_school_status(UUID, school_status, TEXT)
  TO authenticated;

-- ============================================================
-- 4. Queue helper view with priority score + admin count
--    View inherits RLS from base schools; platform_admin already sees all.
-- ============================================================

CREATE OR REPLACE VIEW public.admin_schools_queue AS
SELECT
  s.*,
  (CASE WHEN s.manually_added                  THEN 2 ELSE 0 END)
  + (CASE WHEN NOT s.email_likely_institutional THEN 1 ELSE 0 END) AS priority_score,
  (SELECT COUNT(*) FROM school_admins sa WHERE sa.school_id = s.id) AS admins_count
FROM schools s;

COMMENT ON VIEW public.admin_schools_queue IS
  'LC-004: schools enriched with priority_score + admins_count for the admin triage UI.';
