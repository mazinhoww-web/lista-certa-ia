// Lists the parent's active (non-soft-deleted) students with school + list
// metadata + progress counts. Reads the my_students_with_progress view,
// which already filters by deleted_at IS NULL and joins schools/lists.
//
// PII safety: when logging, we only emit student.id — never first_name.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

export type MyStudentRow =
  Database["public"]["Views"]["my_students_with_progress"]["Row"];

export function useMyStudents() {
  const { user } = useAuth();
  return useQuery<MyStudentRow[]>({
    queryKey: ["my-students", user?.id ?? "anon"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("my_students_with_progress")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        // PII: only error code/message; the row.first_name never reaches the log.
        console.error("[useMyStudents] query failed", {
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      return (data ?? []) as MyStudentRow[];
    },
  });
}
