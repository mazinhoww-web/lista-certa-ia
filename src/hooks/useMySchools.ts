// Lists the schools the current user has admin access to (via school_admins),
// returning the full school row alongside the link role and join date so
// MinhasEscolasPage can render rich cards without a second query.
//
// Ordered by school_admins.created_at DESC (newest link first).

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type School = Database["public"]["Tables"]["schools"]["Row"];

export interface MySchoolLink {
  school: School;
  role: "admin" | "editor";
  joined_at: string;
}

export function useMySchools() {
  const { user } = useAuth();

  return useQuery<MySchoolLink[]>({
    queryKey: ["my-schools", user?.id ?? "anon"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_admins")
        .select("role, created_at, school:schools!inner(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useMySchools] query failed", { message: error.message });
        throw error;
      }

      return (data ?? []).map((row) => ({
        role: (row.role ?? "admin") as "admin" | "editor",
        joined_at: row.created_at ?? new Date(0).toISOString(),
        school: row.school as School,
      }));
    },
  });
}
