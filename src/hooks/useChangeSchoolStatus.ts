// Wraps the admin_change_school_status RPC. The RPC is SECURITY DEFINER
// and atomic: status update + audit log + (on approve) parent→school_admin
// promotion all happen together server-side. Front-end only sends the
// transition request and invalidates affected queries on success.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

type SchoolStatus = Database["public"]["Enums"]["school_status"];

export interface ChangeStatusVars {
  schoolId: string;
  toStatus: SchoolStatus;
  reason?: string | null;
}

export function useChangeSchoolStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: ChangeStatusVars) => {
      const { data, error } = await supabase.rpc("admin_change_school_status", {
        p_school_id: vars.schoolId,
        p_to_status: vars.toStatus,
        p_reason: vars.reason ?? undefined,
      });
      if (error) {
        console.error("[useChangeSchoolStatus] rpc failed", {
          school_id: vars.schoolId,
          to_status: vars.toStatus,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-schools-queue"] });
      qc.invalidateQueries({ queryKey: ["school", vars.schoolId] });
      qc.invalidateQueries({ queryKey: ["school-status-log", vars.schoolId] });
      qc.invalidateQueries({ queryKey: ["my-schools"] });
    },
  });
}
