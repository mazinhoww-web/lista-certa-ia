// LC-009: resolve a short link (8 hex chars) to the underlying
// cart_strategies row. Implementation note: uses substring(id::text, 1, 8)
// match with LIMIT 2. When 2+ rows match the same prefix (collision),
// we return null so the caller renders "link inválido" — better to fail
// loudly than to silently route the parent to someone else's cart.
//
// RLS on cart_strategies still gates by parent — even if the prefix
// matches another parent's strategy, that row is invisible to this
// user, so the LIMIT 2 protection is a defense-in-depth complement to
// RLS, not the primary security layer.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { isValidShortId } from "@/lib/shortId";

export interface ShortIdResolution {
  strategyId: string;
  studentId: string;
  retailerKey: "mercadolibre";
}

export function useStrategyByShortId(shortId: string | undefined) {
  return useQuery<ShortIdResolution | null>({
    queryKey: ["strategy-by-short-id", shortId ?? "none"],
    enabled: Boolean(shortId),
    queryFn: async () => {
      if (!shortId || !isValidShortId(shortId)) return null;
      const { data, error } = await supabase
        .from("cart_strategies")
        .select("id, student_id")
        .filter("id::text", "ilike", `${shortId}%`)
        .limit(2);
      if (error) {
        console.error("[useStrategyByShortId] query failed", {
          short_id: shortId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      if (!data || data.length === 0) return null;
      // Collision detected — refuse rather than serve a random row.
      // This bubbles up to TD-28 when it happens at scale.
      if (data.length > 1) {
        console.warn("[useStrategyByShortId] short_id collision", {
          short_id: shortId,
          count: data.length,
        });
        return null;
      }
      const row = data[0]!;
      return {
        strategyId: row.id,
        studentId: row.student_id,
        retailerKey: "mercadolibre",
      };
    },
  });
}
