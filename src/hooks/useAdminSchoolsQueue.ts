// Reads the admin_schools_queue view (schools enriched with priority_score
// and admins_count) with optional filters. RLS gates the view to
// platform_admin users via the underlying schools policy.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

type SchoolStatus = Database["public"]["Enums"]["school_status"];
export type AdminQueueRow =
  Database["public"]["Views"]["admin_schools_queue"]["Row"];

export interface QueueFilters {
  statuses?: SchoolStatus[];
  origin?: "inep" | "manual" | "all";
  institutionalEmail?: "yes" | "no" | "all";
}

export function useAdminSchoolsQueue(filters: QueueFilters) {
  return useQuery<AdminQueueRow[]>({
    queryKey: ["admin-schools-queue", filters],
    queryFn: async () => {
      let q = supabase.from("admin_schools_queue").select("*");

      if (filters.statuses && filters.statuses.length > 0) {
        q = q.in("status", filters.statuses);
      }
      if (filters.origin === "inep") {
        q = q.not("inep_code", "is", null);
      } else if (filters.origin === "manual") {
        q = q.eq("manually_added", true);
      }
      if (filters.institutionalEmail === "yes") {
        q = q.eq("email_likely_institutional", true);
      } else if (filters.institutionalEmail === "no") {
        q = q.eq("email_likely_institutional", false);
      }

      const { data, error } = await q
        .order("priority_score", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useAdminSchoolsQueue] query failed", {
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      return (data ?? []) as AdminQueueRow[];
    },
  });
}
