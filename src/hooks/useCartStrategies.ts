// Reads cached cart_strategies for a (student, list) pair OR triggers
// the build-cart Edge Function when nothing is cached. The Edge Function
// itself does the cache-or-build decision; the front just calls it once
// per page mount and caches via react-query (staleTime 60s).
//
// LGPD: nothing logged here carries first_name. Only IDs + counters.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CartStrategy, BuildCartResponse } from "@/types/cart";

interface InvokeArgs {
  studentId: string;
  listId: string;
  forceRefresh?: boolean;
}

async function invokeBuildCart(args: InvokeArgs): Promise<CartStrategy[]> {
  const { data, error } = await supabase.functions.invoke<BuildCartResponse>(
    "build-cart",
    {
      body: {
        student_id: args.studentId,
        list_id: args.listId,
        force_refresh: args.forceRefresh ?? false,
      },
    },
  );
  if (error) {
    console.error("[useCartStrategies] invoke failed", {
      student_id: args.studentId,
      list_id: args.listId,
      message: error.message,
    });
    throw error;
  }
  if (!data?.strategies) {
    throw new Error("build-cart returned no strategies");
  }
  return data.strategies;
}

export function useCartStrategies(
  studentId: string | undefined,
  listId: string | undefined,
) {
  return useQuery<CartStrategy[]>({
    queryKey: ["cart-strategies", studentId ?? "none", listId ?? "none"],
    enabled: Boolean(studentId && listId),
    staleTime: 60_000,
    gcTime: 24 * 3600 * 1000,
    queryFn: () =>
      invokeBuildCart({
        studentId: studentId!,
        listId: listId!,
        forceRefresh: false,
      }),
  });
}

export { invokeBuildCart };
