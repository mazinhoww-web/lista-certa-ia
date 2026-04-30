// Fetches one student row from the my_students_with_progress view (RLS
// already gates by parent_id + deleted_at IS NULL). Returns null on
// not-found so the consumer can render a generic "removido" state
// without leaking PII.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type ViewRow = Database["public"]["Views"]["my_students_with_progress"]["Row"];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useStudent(studentId: string | undefined) {
  const { user } = useAuth();
  return useQuery<ViewRow | null>({
    queryKey: ["student", studentId ?? "none", user?.id ?? "anon"],
    enabled: Boolean(user && studentId),
    queryFn: async () => {
      if (!studentId || !UUID_RE.test(studentId)) return null;
      const { data, error } = await supabase
        .from("my_students_with_progress")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();
      if (error) {
        console.error("[useStudent] query failed", {
          student_id: studentId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      return (data ?? null) as ViewRow | null;
    },
  });
}
