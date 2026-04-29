// Direct UPDATE on lists.status = 'archived'. RLS on lists permits this
// for school admins of the school (FOR ALL policy), so no RPC needed.
// Archive does not auto-promote a draft like publish_list does — it's
// a one-way exit.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useArchiveList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { listId: string; schoolId: string }) => {
      const { error } = await supabase
        .from("lists")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", params.listId);
      if (error) {
        console.error("[useArchiveList] update failed", {
          list_id: params.listId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["school-lists", vars.schoolId] });
      qc.invalidateQueries({ queryKey: ["list", vars.listId] });
    },
  });
}
