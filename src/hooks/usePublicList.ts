// Public read of one list (with its items + parent school). Slug is in
// the URL for canonicality; the actual fetch is by listId because the
// (school_id, list_id) tuple is unique. We still validate that the
// returned list belongs to a school whose slug matches the URL — an
// extra guard against the edge case where a list moves schools.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

type ListRow = Database["public"]["Tables"]["lists"]["Row"];
type ListItemRow = Database["public"]["Tables"]["list_items"]["Row"];
type School = Database["public"]["Tables"]["schools"]["Row"];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PublicListData {
  list: ListRow;
  items: ListItemRow[];
  school: School;
}

export function usePublicList(slug: string | undefined, listId: string | undefined) {
  return useQuery<PublicListData | null>({
    queryKey: ["public-list", slug ?? "none", listId ?? "none"],
    enabled: Boolean(slug && listId),
    queryFn: async () => {
      if (!slug || !listId || !UUID_RE.test(listId)) return null;

      const { data, error } = await supabase
        .from("lists")
        .select("*, school:schools!inner(*), items:list_items(*)")
        .eq("id", listId)
        .eq("status", "published")
        .maybeSingle();

      if (error) {
        console.error("[usePublicList] query failed", {
          list_id: listId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      if (!data) return null;

      const { school, items, ...list } = data as ListRow & {
        school: School;
        items: ListItemRow[];
      };

      // Slug consistency guard.
      if (school.slug !== slug || school.status !== "approved") {
        return null;
      }

      const sortedItems = (items ?? []).sort((a, b) => a.position - b.position);
      return {
        list: list as ListRow,
        items: sortedItems,
        school,
      };
    },
  });
}
