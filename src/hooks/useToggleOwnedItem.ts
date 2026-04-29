// Toggles "já tenho em casa" for one (student, list_item) pair via the
// toggle_owned_item RPC. Optimistic update on the cached owned-items set
// so the checkbox flips immediately. Cancelled queries during the
// pending mutation prevent a stale fetch from clobbering the optimistic
// state.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface ToggleVars {
  studentId: string;
  listItemId: string;
}

export function useToggleOwnedItem() {
  const qc = useQueryClient();
  return useMutation<{ marked: boolean; marked_at: string | null }, Error, ToggleVars>({
    mutationFn: async ({ studentId, listItemId }) => {
      const { data, error } = await supabase.rpc("toggle_owned_item", {
        p_student_id: studentId,
        p_list_item_id: listItemId,
      });
      if (error) {
        console.error("[useToggleOwnedItem] rpc failed", {
          student_id: studentId,
          list_item_id: listItemId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      const row = Array.isArray(data)
        ? data[0]
        : (data as { marked: boolean; marked_at: string | null } | null);
      if (!row) throw new Error("toggle_owned_item returned no row");
      return row;
    },
    onMutate: async ({ studentId, listItemId }) => {
      const key = ["student-owned-items", studentId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Set<string>>(key);
      if (previous) {
        const next = new Set(previous);
        if (next.has(listItemId)) next.delete(listItemId);
        else next.add(listItemId);
        qc.setQueryData(key, next);
      }
      return { previous, key };
    },
    onError: (_err, _vars, ctx) => {
      const c = ctx as { previous?: Set<string>; key?: readonly unknown[] } | undefined;
      if (c?.previous && c?.key) qc.setQueryData(c.key, c.previous);
    },
    onSettled: (_data, _err, { studentId }) => {
      qc.invalidateQueries({ queryKey: ["student-owned-items", studentId] });
      qc.invalidateQueries({ queryKey: ["my-students"] });
      qc.invalidateQueries({ queryKey: ["student", studentId] });
    },
  });
}
