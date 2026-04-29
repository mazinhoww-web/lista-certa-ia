// Wraps publish_list RPC. The RPC enforces:
//   - actor is school admin or platform_admin
//   - list is currently 'draft'
//   - list has at least 1 item ("Lista sem itens não pode ser publicada")
// On success, prior published lists for the same (school, grade, year,
// teacher) tuple are auto-archived in the same transaction.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function usePublishList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { listId: string; schoolId: string }) => {
      const { data, error } = await supabase.rpc("publish_list", {
        p_list_id: params.listId,
      });
      if (error) {
        console.error("[usePublishList] rpc failed", {
          list_id: params.listId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["school-lists", vars.schoolId] });
      qc.invalidateQueries({ queryKey: ["list", vars.listId] });
    },
  });
}
