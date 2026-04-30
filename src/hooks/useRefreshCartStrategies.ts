// Forces a fresh build via the Edge Function (force_refresh=true) and
// updates the react-query cache so the page re-renders without refetch.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeBuildCart } from "@/hooks/useCartStrategies";
import type { CartStrategy } from "@/types/cart";

interface Vars {
  studentId: string;
  listId: string;
}

export function useRefreshCartStrategies() {
  const qc = useQueryClient();
  return useMutation<CartStrategy[], Error, Vars>({
    mutationFn: (vars) =>
      invokeBuildCart({
        studentId: vars.studentId,
        listId: vars.listId,
        forceRefresh: true,
      }),
    onSuccess: (data, vars) => {
      qc.setQueryData(
        ["cart-strategies", vars.studentId, vars.listId],
        data,
      );
    },
  });
}
