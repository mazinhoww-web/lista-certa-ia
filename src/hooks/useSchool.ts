// Fetches a single school by id, scoped to schools the current user has an
// admin link to (RLS handles the gate via the school_admins join). Returns
// null when the user has no link to that school OR when the id is not a
// valid UUID — both surface as "not found" in the UI without leaking
// existence information.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type School = Database["public"]["Tables"]["schools"]["Row"];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface UseSchoolResult {
  school: School;
  role: "admin" | "editor";
}

export function useSchool(schoolId: string | undefined) {
  const { user } = useAuth();

  return useQuery<UseSchoolResult | null>({
    queryKey: ["school", schoolId ?? "none", user?.id ?? "anon"],
    enabled: Boolean(user && schoolId),
    queryFn: async () => {
      if (!schoolId || !UUID_RE.test(schoolId)) return null;

      const { data, error } = await supabase
        .from("school_admins")
        .select("role, school:schools(*)")
        .eq("school_id", schoolId)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) {
        console.error("[useSchool] query failed", {
          school_id: schoolId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }

      if (!data || !data.school) return null;

      return {
        school: data.school as School,
        role: (data.role ?? "admin") as "admin" | "editor",
      };
    },
  });
}
