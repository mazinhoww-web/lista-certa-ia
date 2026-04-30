-- supabase/migrations/009_lc002_5_co_admin.sql
-- LC-002.5: co-admin de escola via link compartilhável + permissões flat.
--
-- Entrega:
--   1. school_admins.deleted_at  — soft delete (consistente com students)
--   2. school_admin_invites      — convites por token UUID, expira em 48h
--   3. school_admin_audit_log    — auditoria isolada de domínio admin
--                                  (NÃO reusa students_access_log porque
--                                  aquela exige student_id NOT NULL).
--   4. 3 RPCs SECURITY DEFINER   — create / redeem / remove
--   5. trigger auto_revoke       — invites pendentes de um admin removido
--                                  ficam revogados automaticamente (defesa
--                                  contra "admin sai mas link continua
--                                  ativo no WhatsApp da escola").
--
-- ⚠️ Hard limit: 5 admins por escola. Não configurável.
-- ⚠️ Auto-revoke é a janela mais sensível desta slice. Smoke test #8 valida.
-- LGPD: school_admin_audit_log NUNCA carrega email/nome. Só UUIDs e códigos.

-- ============================================================
-- 1. school_admins.deleted_at (soft delete)
-- ============================================================

ALTER TABLE public.school_admins
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_school_admins_active
  ON public.school_admins(school_id, user_id)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.school_admins.deleted_at IS
  'LC-002.5: soft delete. NULL = admin ativo. Definido via remove_school_admin RPC.';

-- ============================================================
-- 2. school_admin_invites
-- ============================================================

CREATE TABLE IF NOT EXISTS public.school_admin_invites (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id       UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  token           UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  created_by      UUID NOT NULL REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  redeemed_at     TIMESTAMPTZ NULL,
  redeemed_by     UUID NULL REFERENCES public.profiles(id),
  revoked_at      TIMESTAMPTZ NULL,
  revoked_reason  TEXT NULL CHECK (revoked_reason IN ('admin_removed', 'manual'))
);

CREATE INDEX IF NOT EXISTS idx_admin_invites_token
  ON public.school_admin_invites(token);
CREATE INDEX IF NOT EXISTS idx_admin_invites_school_pending
  ON public.school_admin_invites(school_id)
  WHERE redeemed_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.school_admin_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_invites_select_own_school ON public.school_admin_invites;
CREATE POLICY admin_invites_select_own_school ON public.school_admin_invites
  FOR SELECT TO authenticated USING (
    school_id IN (
      SELECT school_id FROM public.school_admins
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'platform_admin'
    )
  );
-- INSERT/UPDATE/DELETE: apenas via RPCs SECURITY DEFINER abaixo.

COMMENT ON TABLE public.school_admin_invites IS
  'LC-002.5: convites para virar co-admin de uma escola. Token UUID v4, expira em 48h.';

-- ============================================================
-- 3. school_admin_audit_log (domínio isolado, sem PII)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.school_admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL REFERENCES public.profiles(id),
  target_id   UUID REFERENCES public.profiles(id),
  invite_id   UUID REFERENCES public.school_admin_invites(id) ON DELETE SET NULL,
  action      TEXT NOT NULL CHECK (action IN (
                'school_admin_invited',
                'school_admin_redeemed',
                'school_admin_removed'
              )),
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_admin_audit_school
  ON public.school_admin_audit_log(school_id, created_at DESC);

ALTER TABLE public.school_admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS school_admin_audit_select ON public.school_admin_audit_log;
CREATE POLICY school_admin_audit_select ON public.school_admin_audit_log
  FOR SELECT TO authenticated USING (
    school_id IN (
      SELECT school_id FROM public.school_admins
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'platform_admin'
    )
  );

COMMENT ON TABLE public.school_admin_audit_log IS
  'LC-002.5: audit trail of school admin invites/redeems/removals. Zero PII (sem email, sem nome). Apenas UUIDs e códigos.';

-- ============================================================
-- 4. RPC create_admin_invite
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_admin_invite(p_school_id UUID)
RETURNS TABLE(invite_id UUID, token UUID, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller       UUID := auth.uid();
  v_active_count INT;
  v_invite_id    UUID;
  v_token        UUID;
  v_expires      TIMESTAMPTZ;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED: no authenticated user' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.school_admins
    WHERE school_id = p_school_id
      AND user_id = v_caller
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED: caller is not an active admin of this school' USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*) INTO v_active_count
  FROM public.school_admins
  WHERE school_id = p_school_id AND deleted_at IS NULL;

  IF v_active_count >= 5 THEN
    RAISE EXCEPTION 'ADMIN_LIMIT_REACHED: school already has 5 admins' USING ERRCODE = 'P0001';
  END IF;

  v_expires := NOW() + INTERVAL '48 hours';

  INSERT INTO public.school_admin_invites (school_id, created_by, expires_at)
  VALUES (p_school_id, v_caller, v_expires)
  RETURNING id, token INTO v_invite_id, v_token;

  INSERT INTO public.school_admin_audit_log
    (school_id, actor_id, invite_id, action, metadata)
  VALUES
    (p_school_id, v_caller, v_invite_id, 'school_admin_invited',
     jsonb_build_object('expires_at', v_expires));

  invite_id := v_invite_id;
  token := v_token;
  expires_at := v_expires;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_admin_invite(UUID) TO authenticated;

COMMENT ON FUNCTION public.create_admin_invite(UUID) IS
  'LC-002.5: gera convite de co-admin. Caller deve ser admin ativo da escola; rejeita se a escola já tem 5 admins.';

-- ============================================================
-- 5. RPC redeem_admin_invite
-- ============================================================

CREATE OR REPLACE FUNCTION public.redeem_admin_invite(p_token UUID)
RETURNS TABLE(school_id UUID, idempotent BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller       UUID := auth.uid();
  v_invite       RECORD;
  v_active_count INT;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED: no authenticated user' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_invite
  FROM public.school_admin_invites
  WHERE token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVITE_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF v_invite.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'INVITE_REVOKED' USING ERRCODE = 'P0001';
  END IF;

  IF v_invite.redeemed_at IS NOT NULL THEN
    RAISE EXCEPTION 'INVITE_ALREADY_REDEEMED' USING ERRCODE = 'P0001';
  END IF;

  IF v_invite.expires_at < NOW() THEN
    RAISE EXCEPTION 'INVITE_EXPIRED' USING ERRCODE = 'P0001';
  END IF;

  -- Já é admin ativo? idempotente, sem erro.
  IF EXISTS (
    SELECT 1 FROM public.school_admins
    WHERE school_id = v_invite.school_id
      AND user_id = v_caller
      AND deleted_at IS NULL
  ) THEN
    school_id := v_invite.school_id;
    idempotent := TRUE;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_active_count
  FROM public.school_admins
  WHERE school_id = v_invite.school_id AND deleted_at IS NULL;

  IF v_active_count >= 5 THEN
    RAISE EXCEPTION 'ADMIN_LIMIT_REACHED' USING ERRCODE = 'P0001';
  END IF;

  -- UPSERT lida com row soft-deleted antes (re-vinculo do mesmo user).
  INSERT INTO public.school_admins (school_id, user_id, role)
  VALUES (v_invite.school_id, v_caller, 'admin')
  ON CONFLICT (user_id, school_id)
    DO UPDATE SET deleted_at = NULL, role = 'admin';

  UPDATE public.school_admin_invites
  SET redeemed_at = NOW(), redeemed_by = v_caller
  WHERE id = v_invite.id;

  INSERT INTO public.school_admin_audit_log
    (school_id, actor_id, target_id, invite_id, action)
  VALUES
    (v_invite.school_id, v_caller, v_caller, v_invite.id, 'school_admin_redeemed');

  school_id := v_invite.school_id;
  idempotent := FALSE;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_admin_invite(UUID) TO authenticated;

COMMENT ON FUNCTION public.redeem_admin_invite(UUID) IS
  'LC-002.5: aceita convite de co-admin. Idempotente se caller já é admin. Hard block em 5 admins ativos.';

-- ============================================================
-- 6. RPC remove_school_admin
-- ============================================================

CREATE OR REPLACE FUNCTION public.remove_school_admin(
  p_school_id      UUID,
  p_target_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller       UUID := auth.uid();
  v_active_count INT;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED: no authenticated user' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.school_admins
    WHERE school_id = p_school_id
      AND user_id = v_caller
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED: caller is not an active admin of this school' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.school_admins
    WHERE school_id = p_school_id
      AND user_id = p_target_user_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED: target is not an active admin of this school' USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*) INTO v_active_count
  FROM public.school_admins
  WHERE school_id = p_school_id AND deleted_at IS NULL;

  IF v_active_count <= 1 THEN
    RAISE EXCEPTION 'CANNOT_REMOVE_LAST_ADMIN' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.school_admins
  SET deleted_at = NOW()
  WHERE school_id = p_school_id
    AND user_id = p_target_user_id
    AND deleted_at IS NULL;
  -- Trigger auto_revoke_pending_invites dispara aqui (item 7 abaixo).

  INSERT INTO public.school_admin_audit_log
    (school_id, actor_id, target_id, action)
  VALUES
    (p_school_id, v_caller, p_target_user_id, 'school_admin_removed');
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_school_admin(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.remove_school_admin(UUID, UUID) IS
  'LC-002.5: remove admin (soft delete). Bloqueia se for o último admin ativo. Self-removal permitido se há outros admins.';

-- ============================================================
-- 7. Trigger auto-revoke de invites pendentes do admin removido
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_revoke_pending_invites()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE public.school_admin_invites
    SET revoked_at = NOW(), revoked_reason = 'admin_removed'
    WHERE created_by = NEW.user_id
      AND school_id = NEW.school_id
      AND redeemed_at IS NULL
      AND revoked_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS school_admins_auto_revoke ON public.school_admins;
CREATE TRIGGER school_admins_auto_revoke
  AFTER UPDATE OF deleted_at ON public.school_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_revoke_pending_invites();

COMMENT ON FUNCTION public.auto_revoke_pending_invites() IS
  'LC-002.5: quando um admin é soft-deleted, todos os invites pendentes que ELE criou nessa escola são auto-revogados. Defesa contra link ativo no WhatsApp após remoção.';
