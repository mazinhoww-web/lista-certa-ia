-- supabase/migrations/006_lc007_students_extras.sql
-- LC-007: cadastro de aluno + soft delete + "já tenho em casa"
--
-- This migration touches data subject to LGPD Art. 14 (regime reforçado
-- para menor de idade). Two backlog items gate external onboarding:
--   TD-10 — revisão jurídica do termo de consentimento parental.
--   TD-11 — validar retention de 90 dias com DPO/advogado.
-- Both BLOCKING for any user beyond internal circle.

-- ============================================================
-- 1. Soft delete + teacher_name on students
-- ============================================================

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS teacher_name TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_students_deleted_at
  ON public.students(deleted_at);
CREATE INDEX IF NOT EXISTS idx_students_parent_active
  ON public.students(parent_id)
  WHERE deleted_at IS NULL;

-- RLS: parent sees only own non-deleted students; platform_admin sees
-- everything (incl. soft-deleted) for audit. Both policies are issued
-- idempotently — schema.sql already declared earlier versions.
DROP POLICY IF EXISTS students_parent_only ON public.students;
CREATE POLICY students_parent_only ON public.students
  FOR ALL USING (parent_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS students_admin_audit ON public.students;
CREATE POLICY students_admin_audit ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'platform_admin'
    )
  );

-- ============================================================
-- 2. student_owned_items — items the parent already has at home
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_owned_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  list_item_id UUID NOT NULL REFERENCES public.list_items(id) ON DELETE CASCADE,
  marked_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, list_item_id)
);

CREATE INDEX IF NOT EXISTS idx_owned_items_student
  ON public.student_owned_items(student_id);
CREATE INDEX IF NOT EXISTS idx_owned_items_list_item
  ON public.student_owned_items(list_item_id);

ALTER TABLE public.student_owned_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS owned_items_parent_only ON public.student_owned_items;
CREATE POLICY owned_items_parent_only ON public.student_owned_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_owned_items.student_id
        AND s.parent_id = auth.uid()
        AND s.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS owned_items_admin_audit ON public.student_owned_items;
CREATE POLICY owned_items_admin_audit ON public.student_owned_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'platform_admin'
    )
  );

-- ============================================================
-- 3. RPC: register_student
--    Creates one student row with parental consent + tries to attach
--    an automatic published list when exactly one matches.
-- ============================================================

CREATE OR REPLACE FUNCTION public.register_student(
  p_first_name      TEXT,
  p_school_id       UUID,
  p_grade           TEXT,
  p_teacher_name    TEXT,
  p_consent_version TEXT
)
RETURNS TABLE (id UUID, list_id UUID, requires_list_selection BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id        UUID := auth.uid();
  v_school_status   school_status;
  v_matching_lists  UUID[];
  v_auto_list_id    UUID;
  v_new_student_id  UUID;
  v_first_name_clean TEXT;
  v_teacher_clean   TEXT;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'forbidden: must be authenticated';
  END IF;

  v_first_name_clean := trim(coalesce(p_first_name, ''));
  IF length(v_first_name_clean) < 2 OR length(v_first_name_clean) > 80 THEN
    RAISE EXCEPTION 'invalid first_name: must be between 2 and 80 chars after trim';
  END IF;

  IF p_consent_version IS NULL OR length(trim(p_consent_version)) = 0 THEN
    RAISE EXCEPTION 'parental consent version required';
  END IF;

  SELECT status INTO v_school_status FROM schools WHERE id = p_school_id;
  IF v_school_status IS NULL OR v_school_status <> 'approved' THEN
    RAISE EXCEPTION 'school not found or not approved';
  END IF;

  v_teacher_clean := NULLIF(trim(coalesce(p_teacher_name, '')), '');

  -- Match published lists on (school_id, grade, optional teacher_name).
  -- Teacher comparison is permissive: both NULL match, or both equal.
  SELECT array_agg(l.id) INTO v_matching_lists
  FROM lists l
  WHERE l.school_id = p_school_id
    AND l.grade = p_grade
    AND l.status = 'published'
    AND (
      v_teacher_clean IS NULL
      OR l.teacher_name IS NULL
      OR l.teacher_name = v_teacher_clean
    );

  IF coalesce(array_length(v_matching_lists, 1), 0) = 1 THEN
    v_auto_list_id := v_matching_lists[1];
  END IF;

  INSERT INTO students (
    parent_id, first_name, school_id, grade, teacher_name, list_id,
    parental_consent_at, parental_consent_version
  )
  VALUES (
    v_actor_id, v_first_name_clean, p_school_id, p_grade,
    v_teacher_clean, v_auto_list_id,
    NOW(), trim(p_consent_version)
  )
  RETURNING students.id INTO v_new_student_id;

  INSERT INTO students_access_log (student_id, accessed_by, action)
  VALUES (v_new_student_id, v_actor_id, 'create');

  RETURN QUERY
    SELECT v_new_student_id, v_auto_list_id, (v_auto_list_id IS NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_student(TEXT, UUID, TEXT, TEXT, TEXT)
  TO authenticated;

-- ============================================================
-- 4. RPC: soft_delete_student
--    Marks a student as deleted (deleted_at = NOW()). RLS hides it
--    immediately from the parent. Hard purge after 90d is out-of-scope
--    for this slice (human-driven SQL job, see TD-11).
-- ============================================================

CREATE OR REPLACE FUNCTION public.soft_delete_student(p_student_id UUID)
RETURNS TABLE (id UUID, deleted_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_owner_id UUID;
  v_already_deleted TIMESTAMPTZ;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'forbidden: must be authenticated';
  END IF;

  SELECT parent_id, students.deleted_at
    INTO v_owner_id, v_already_deleted
  FROM students WHERE students.id = p_student_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'student not found';
  END IF;
  IF v_owner_id <> v_actor_id THEN
    RAISE EXCEPTION 'forbidden: only parent can delete own student';
  END IF;
  IF v_already_deleted IS NOT NULL THEN
    RAISE EXCEPTION 'student already removed';
  END IF;

  UPDATE students
    SET deleted_at = NOW(), updated_at = NOW()
  WHERE students.id = p_student_id;

  INSERT INTO students_access_log (student_id, accessed_by, action)
  VALUES (p_student_id, v_actor_id, 'soft_delete');

  RETURN QUERY
    SELECT s.id, s.deleted_at FROM students s WHERE s.id = p_student_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_student(UUID) TO authenticated;

-- ============================================================
-- 5. RPC: toggle_owned_item
--    Existing pair → DELETE. Missing pair → INSERT. Returns the new
--    state so the front can update optimistically.
--    NOT logged in students_access_log (high-volume + no PII change).
-- ============================================================

CREATE OR REPLACE FUNCTION public.toggle_owned_item(
  p_student_id   UUID,
  p_list_item_id UUID
)
RETURNS TABLE (marked BOOLEAN, marked_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_owner_id UUID;
  v_existing_id UUID;
  v_new_marked_at TIMESTAMPTZ;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'forbidden: must be authenticated';
  END IF;

  SELECT parent_id INTO v_owner_id
  FROM students
  WHERE id = p_student_id AND deleted_at IS NULL;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'student not found or removed';
  END IF;
  IF v_owner_id <> v_actor_id THEN
    RAISE EXCEPTION 'forbidden: only parent of student can toggle';
  END IF;

  SELECT id INTO v_existing_id
  FROM student_owned_items
  WHERE student_id = p_student_id AND list_item_id = p_list_item_id;

  IF v_existing_id IS NOT NULL THEN
    DELETE FROM student_owned_items WHERE id = v_existing_id;
    RETURN QUERY SELECT FALSE::BOOLEAN, NULL::TIMESTAMPTZ;
  ELSE
    INSERT INTO student_owned_items (student_id, list_item_id)
    VALUES (p_student_id, p_list_item_id)
    RETURNING student_owned_items.marked_at INTO v_new_marked_at;
    RETURN QUERY SELECT TRUE::BOOLEAN, v_new_marked_at;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_owned_item(UUID, UUID) TO authenticated;

-- ============================================================
-- 6. View: my_students_with_progress
--    Active students for the calling parent + denormalized school
--    name/slug + total_items / owned_items counts. RLS on the
--    underlying `students` table already filters by parent_id.
-- ============================================================

CREATE OR REPLACE VIEW public.my_students_with_progress AS
SELECT
  s.id,
  s.parent_id,
  s.first_name,
  s.school_id,
  s.grade,
  s.teacher_name,
  s.list_id,
  s.parental_consent_at,
  s.parental_consent_version,
  s.created_at,
  sch.trade_name AS school_trade_name,
  sch.slug       AS school_slug,
  l.school_year  AS list_school_year,
  (SELECT COUNT(*)::INT FROM list_items WHERE list_id = s.list_id) AS total_items,
  (SELECT COUNT(*)::INT FROM student_owned_items WHERE student_id = s.id) AS owned_items
FROM students s
LEFT JOIN schools sch ON sch.id = s.school_id
LEFT JOIN lists   l   ON l.id   = s.list_id
WHERE s.deleted_at IS NULL;

COMMENT ON VIEW public.my_students_with_progress IS
  'LC-007: active students for the calling parent + progress counters.';
