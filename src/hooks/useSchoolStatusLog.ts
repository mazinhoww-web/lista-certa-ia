// Reads school_status_log entries for one school, joined with the actor's
// profile so the timeline can show "approved by Maria Souza" instead of
// a UUID. RLS gates the table to platform_admin and to school_admins of
// the school in question.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

type LogRow = Database["public"]["Tables"]["school_status_log"]["Row"];

export interface SchoolStatusLogEntry extends LogRow {
  changed_by_profile: { full_name: string | null } | null;
}

export function useSchoolStatusLog(schoolId: string | undefined) {
  return useQuery<SchoolStatusLogEntry[]>({
    queryKey: ["school-status-log", schoolId ?? "none"],
    enabled: Boolean(schoolId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_status_log")
        .select("*, changed_by_profile:profiles!changed_by(full_name)")
        .eq("school_id", schoolId!)
        .order("changed_at", { ascending: false });

      if (error) {
        console.error("[useSchoolStatusLog] query failed", {
          school_id: schoolId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      return (data ?? []) as SchoolStatusLogEntry[];
    },
  });
}
