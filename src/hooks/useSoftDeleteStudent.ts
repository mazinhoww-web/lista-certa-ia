// Wraps the soft_delete_student RPC. The RPC sets deleted_at = NOW(),
// writes a 'soft_delete' audit entry, and refuses double-deletes. The
// hook invalidates my-students so the list re-renders without the row.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useSoftDeleteStudent() {
  const qc = useQueryClient();
  return useMutation<{ id: string; deleted_at: string }, Error, string>({
    mutationFn: async (studentId) => {
      const { data, error } = await supabase.rpc("soft_delete_student", {
        p_student_id: studentId,
      });
      if (error) {
        console.error("[useSoftDeleteStudent] rpc failed", {
          student_id: studentId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      const row = Array.isArray(data) ? data[0] : (data as { id: string; deleted_at: string } | null);
      if (!row?.id) {
        throw new Error("soft_delete_student returned no row");
      }
      return row;
    },
    onSuccess: (_data, studentId) => {
      qc.invalidateQueries({ queryKey: ["my-students"] });
      qc.invalidateQueries({ queryKey: ["student", studentId] });
    },
  });
}
