// LC-002.5: lista admins ativos de uma escola.
//
// RLS: só admins ativos da própria escola (ou platform_admin) conseguem
// SELECT, então o array vem vazio se o caller não tem permissão — não
// precisa de gating no hook.
//
// Inclui o profile do admin (id + first_name) pra renderizar o card.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface SchoolAdmin {
  user_id: string;
  joined_at: string;
  first_name: string | null;
}

export function useSchoolAdmins(schoolId: string | undefined) {
  return useQuery<SchoolAdmin[]>({
    queryKey: ["school-admins", schoolId ?? "none"],
    enabled: Boolean(schoolId),
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("school_admins")
        .select("user_id, created_at, profile:profiles!inner(id, first_name)")
        .eq("school_id", schoolId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[useSchoolAdmins] query failed", {
          school_id: schoolId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }

      type Row = {
        user_id: string;
        created_at: string | null;
        profile: { id: string; first_name: string | null } | null;
      };
      return ((data ?? []) as unknown as Row[]).map((r) => ({
        user_id: r.user_id,
        joined_at: r.created_at ?? new Date(0).toISOString(),
        first_name: r.profile?.first_name ?? null,
      }));
    },
  });
}
