// Lists every list belonging to one school, ordered by created_at DESC.
// RLS gates SELECT to school admins, platform admin, and the public when
// status='published' on an approved school — for our use (school admin
// management screen) the school admin path is what fires.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

type ListRow = Database["public"]["Tables"]["lists"]["Row"];

export interface SchoolListSummary extends ListRow {
  items_count: number;
}

export function useSchoolLists(schoolId: string | undefined) {
  return useQuery<SchoolListSummary[]>({
    queryKey: ["school-lists", schoolId ?? "none"],
    enabled: Boolean(schoolId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lists")
        .select("*, list_items(count)")
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useSchoolLists] query failed", {
          school_id: schoolId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }

      return (data ?? []).map((row) => {
        const itemsCountRaw = (row as ListRow & { list_items?: Array<{ count: number }> })
          .list_items;
        const items_count = itemsCountRaw?.[0]?.count ?? 0;
        const { ...rest } = row as ListRow;
        return { ...rest, items_count } as SchoolListSummary;
      });
    },
  });
}
