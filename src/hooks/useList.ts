// Fetches one list along with its items, ordered by position. RLS handles
// the gate; the page renders a "não encontrada" state when data is null.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

type ListRow = Database["public"]["Tables"]["lists"]["Row"];
type ListItemRow = Database["public"]["Tables"]["list_items"]["Row"];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ListWithItems {
  list: ListRow;
  items: ListItemRow[];
}

export function useList(listId: string | undefined) {
  return useQuery<ListWithItems | null>({
    queryKey: ["list", listId ?? "none"],
    enabled: Boolean(listId),
    queryFn: async () => {
      if (!listId || !UUID_RE.test(listId)) return null;

      const [listRes, itemsRes] = await Promise.all([
        supabase.from("lists").select("*").eq("id", listId).maybeSingle(),
        supabase
          .from("list_items")
          .select("*")
          .eq("list_id", listId)
          .order("position", { ascending: true }),
      ]);

      if (listRes.error) {
        console.error("[useList] list query failed", {
          list_id: listId,
          code: listRes.error.code,
          message: listRes.error.message,
        });
        throw listRes.error;
      }
      if (itemsRes.error) {
        console.error("[useList] items query failed", {
          list_id: listId,
          code: itemsRes.error.code,
          message: itemsRes.error.message,
        });
        throw itemsRes.error;
      }

      if (!listRes.data) return null;
      return { list: listRes.data, items: itemsRes.data ?? [] };
    },
  });
}
