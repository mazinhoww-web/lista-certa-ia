// Lists the schools the current user has admin access to (via school_admins).
// Used by MinhaContaPage to decide whether to show the "Cadastrar minha
// escola" CTA, and will also drive future role-based dashboards.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type School = Database["public"]["Tables"]["schools"]["Row"];

export interface MySchoolLink {
  school: Pick<School, "id" | "trade_name" | "slug" | "status" | "city" | "state">;
  role: string;
}

export function useMySchools() {
  const { user } = useAuth();

  return useQuery<MySchoolLink[]>({
    queryKey: ["my-schools", user?.id ?? "anon"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_admins")
        .select(
          "role, school:schools!inner(id, trade_name, slug, status, city, state)",
        )
        .eq("user_id", user!.id);

      if (error) {
        console.error("[useMySchools] query failed", { message: error.message });
        throw error;
      }

      return (data ?? []).map((row) => ({
        role: row.role ?? "admin",
        school: row.school as MySchoolLink["school"],
      }));
    },
  });
}
