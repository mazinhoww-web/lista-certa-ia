// Reads one school by its public slug. Includes the school's lists and
// filters them client-side to status='published' so /escola/:slug never
// surfaces drafts or archived versions even when the parent inadvertently
// has admin permissions on that school.
//
// RLS already gates: anon sees only approved schools, and lists_select_published
// only exposes published lists on approved schools. The .eq('status','approved')
// here is an extra explicit guard.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

type School = Database["public"]["Tables"]["schools"]["Row"];
type ListRow = Database["public"]["Tables"]["lists"]["Row"];

export interface PublicSchoolData {
  school: School;
  publishedLists: ListRow[];
}

export function usePublicSchool(slug: string | undefined) {
  return useQuery<PublicSchoolData | null>({
    queryKey: ["public-school", slug ?? "none"],
    enabled: Boolean(slug),
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("schools")
        .select("*, lists(*)")
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();
      if (error) {
        console.error("[usePublicSchool] query failed", {
          slug,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      if (!data) return null;
      const { lists, ...school } = data as School & { lists: ListRow[] };
      const publishedLists = (lists ?? [])
        .filter((l) => l.status === "published")
        .sort((a, b) => {
          const ay = b.school_year - a.school_year;
          if (ay !== 0) return ay;
          return a.grade.localeCompare(b.grade, "pt-BR");
        });
      return { school: school as School, publishedLists };
    },
  });
}
