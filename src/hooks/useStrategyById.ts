// LC-009: read one cart_strategies row by uuid. RLS already gates by
// parent_id (LC-008 policy cart_strategies_parent_select), so a parent
// looking at someone else's strategy_id silently gets null and the
// caller renders "link inválido". No service_role here.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CartStrategy } from "@/types/cart";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useStrategyById(strategyId: string | undefined) {
  return useQuery<CartStrategy | null>({
    queryKey: ["cart-strategy", strategyId ?? "none"],
    enabled: Boolean(strategyId),
    queryFn: async () => {
      if (!strategyId || !UUID_RE.test(strategyId)) return null;
      const { data, error } = await supabase
        .from("cart_strategies")
        .select("*")
        .eq("id", strategyId)
        .maybeSingle();
      if (error) {
        console.error("[useStrategyById] query failed", {
          strategy_id: strategyId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      return (data as CartStrategy | null) ?? null;
    },
  });
}
