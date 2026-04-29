// Returns the set of list_item_ids that a given student has marked as
// "já tenho em casa". RLS filters by parent_id via the underlying
// student_owned_items policy.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useStudentOwnedItems(studentId: string | undefined) {
  return useQuery<Set<string>>({
    queryKey: ["student-owned-items", studentId ?? "none"],
    enabled: Boolean(studentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_owned_items")
        .select("list_item_id")
        .eq("student_id", studentId!);
      if (error) {
        console.error("[useStudentOwnedItems] query failed", {
          student_id: studentId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      return new Set((data ?? []).map((r) => r.list_item_id));
    },
  });
}
