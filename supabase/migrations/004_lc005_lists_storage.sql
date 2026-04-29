-- supabase/migrations/004_lc005_lists_storage.sql
-- LC-005: school_admin publishes school material lists.
--
-- Adds the only column lists is missing (pending_manual_digitization),
-- creates the private storage bucket where PDF uploads land, and ships
-- two SECURITY DEFINER RPCs that the front uses for the only mutation
-- paths the app supports for lists:
--
--   create_list_with_items(p_school_id, p_grade, p_school_year,
--                          p_teacher_name, p_source,
--                          p_pending_manual_digitization,
--                          p_raw_file_url, p_items)
--      → inserts the lists row + N list_items rows in one transaction.
--
--   publish_list(p_list_id)
--      → flips status draft → published, auto-archives any prior published
--        list with the same (school_id, grade, school_year, teacher_name)
--        on the same call, and refuses lists that have zero items.

-- ============================================================
-- 1. New column on lists
-- ============================================================

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS pending_manual_digitization BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.lists.pending_manual_digitization IS
  'TRUE when the school uploaded a PDF that still needs manual digitization (LC-005).';

-- ============================================================
-- 2. Private Storage bucket + RLS
--    Convention for object names: {school_id}/{list_id}/{filename}
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-lists',
  'school-lists',
  false,
  15728640,                       -- 15 MB cap (D4)
  ARRAY['application/pdf']        -- PDF only in MVP (D5)
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Single combined policy: school admins for that school OR platform admin.
DROP POLICY IF EXISTS school_lists_admin_all ON storage.objects;
CREATE POLICY school_lists_admin_all ON storage.objects
  FOR ALL USING (
    bucket_id = 'school-lists'
    AND (
      EXISTS (
        SELECT 1 FROM public.school_admins sa
        WHERE sa.user_id = auth.uid()
          AND sa.school_id::text = (storage.foldername(name))[1]
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'platform_admin'
      )
    )
  ) WITH CHECK (
    bucket_id = 'school-lists'
    AND (
      EXISTS (
        SELECT 1 FROM public.school_admins sa
        WHERE sa.user_id = auth.uid()
          AND sa.school_id::text = (storage.foldername(name))[1]
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'platform_admin'
      )
    )
  );

-- ============================================================
-- 3. RPC: create_list_with_items
--    Atomic insert of a draft list + its items. Items are passed as a
--    JSONB array; positions are derived from the array order.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_list_with_items(
  p_school_id                  UUID,
  p_grade                      TEXT,
  p_school_year                INT,
  p_teacher_name               TEXT,
  p_source                     list_source,
  p_pending_manual_digitization BOOLEAN,
  p_raw_file_url               TEXT,
  p_items                      JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id   UUID := auth.uid();
  v_can_modify BOOLEAN;
  v_list_id    UUID;
  v_item       JSONB;
  v_position   INT := 0;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'forbidden: not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM school_admins sa
    WHERE sa.school_id = p_school_id AND sa.user_id = v_actor_id
  ) OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = v_actor_id AND p.role = 'platform_admin'
  ) INTO v_can_modify;

  IF NOT v_can_modify THEN
    RAISE EXCEPTION 'forbidden: only school admins or platform_admin can create lists';
  END IF;

  IF p_grade IS NULL OR length(trim(p_grade)) = 0 THEN
    RAISE EXCEPTION 'grade is required';
  END IF;
  IF p_school_year IS NULL THEN
    RAISE EXCEPTION 'school_year is required';
  END IF;
  IF p_source IS NULL THEN
    RAISE EXCEPTION 'source is required';
  END IF;

  INSERT INTO lists (
    school_id, grade, school_year, teacher_name, source,
    pending_manual_digitization, raw_file_url, status, created_by
  ) VALUES (
    p_school_id,
    p_grade,
    p_school_year,
    NULLIF(trim(coalesce(p_teacher_name, '')), ''),
    p_source,
    COALESCE(p_pending_manual_digitization, FALSE),
    NULLIF(p_raw_file_url, ''),
    'draft',
    v_actor_id
  )
  RETURNING id INTO v_list_id;

  IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' THEN
    FOR v_item IN SELECT jsonb_array_elements(p_items)
    LOOP
      v_position := v_position + 1;
      INSERT INTO list_items (
        list_id, position, name, specification, quantity, unit, notes
      ) VALUES (
        v_list_id,
        v_position,
        v_item->>'name',
        NULLIF(v_item->>'specification', ''),
        COALESCE(NULLIF(v_item->>'quantity', '')::INT, 1),
        NULLIF(v_item->>'unit', ''),
        NULLIF(v_item->>'notes', '')
      );
    END LOOP;
  END IF;

  RETURN v_list_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_list_with_items(
  UUID, TEXT, INT, TEXT, list_source, BOOLEAN, TEXT, JSONB
) TO authenticated;

-- ============================================================
-- 4. RPC: publish_list
--    Flip draft → published with three guards:
--      - actor must be a school admin of that school OR platform_admin
--      - list must currently be 'draft'
--      - list must have at least 1 item (mandatory acceptance criterion)
--    On success, auto-archives any other published list with the same
--    (school_id, grade, school_year, teacher_name) tuple.
-- ============================================================

CREATE OR REPLACE FUNCTION public.publish_list(p_list_id UUID)
RETURNS list_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id      UUID := auth.uid();
  v_can_modify    BOOLEAN;
  v_school_id     UUID;
  v_grade         TEXT;
  v_school_year   INT;
  v_teacher_name  TEXT;
  v_status        list_status;
  v_item_count    INT;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'forbidden: not authenticated';
  END IF;

  SELECT school_id, grade, school_year, teacher_name, status
  INTO v_school_id, v_grade, v_school_year, v_teacher_name, v_status
  FROM lists WHERE id = p_list_id;

  IF v_school_id IS NULL THEN
    RAISE EXCEPTION 'list not found: %', p_list_id;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM school_admins sa
    WHERE sa.school_id = v_school_id AND sa.user_id = v_actor_id
  ) OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = v_actor_id AND p.role = 'platform_admin'
  ) INTO v_can_modify;

  IF NOT v_can_modify THEN
    RAISE EXCEPTION 'forbidden: only school admins or platform_admin can publish lists';
  END IF;

  IF v_status <> 'draft' THEN
    RAISE EXCEPTION 'only draft lists can be published (current: %)', v_status;
  END IF;

  -- MANDATORY GUARD: list must have at least one item.
  SELECT COUNT(*) INTO v_item_count FROM list_items WHERE list_id = p_list_id;
  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'Lista sem itens não pode ser publicada';
  END IF;

  -- Auto-archive prior published lists for the same tuple.
  -- COALESCE keeps NULL teacher_name lists matched against each other.
  UPDATE lists SET
    status = 'archived',
    updated_at = NOW()
  WHERE school_id = v_school_id
    AND grade = v_grade
    AND school_year = v_school_year
    AND status = 'published'
    AND COALESCE(teacher_name, '') = COALESCE(v_teacher_name, '')
    AND id <> p_list_id;

  UPDATE lists SET
    status = 'published',
    published_at = NOW(),
    updated_at = NOW()
  WHERE id = p_list_id;

  RETURN 'published'::list_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_list(UUID) TO authenticated;
