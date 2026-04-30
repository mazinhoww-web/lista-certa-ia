// Lightweight wrapper around the search_approved_schools RPC for cases
// that need the full approved-schools list (e.g., dropdowns). Defaults
// to no full-text query and a reasonable limit; uses react-query for
// caching across components.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ApprovedSchoolOption {
  id: string;
  trade_name: string;
  city: string | null;
  state: string | null;
}

export function useApprovedSchools(limit = 50) {
  return useQuery<ApprovedSchoolOption[]>({
    queryKey: ["approved-schools-list", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_approved_schools", {
        // RPC SQL accepts NULL; TS Args dropped nullability after regen.
        q: null as unknown as string,
        uf_filter: undefined,
        city_filter: undefined,
        limit_n: limit,
      });
      if (error) {
        console.error("[useApprovedSchools] rpc failed", {
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      return (data ?? []).map((r) => ({
        id: r.id,
        trade_name: r.trade_name,
        city: r.city,
        state: r.state,
      }));
    },
  });
}
