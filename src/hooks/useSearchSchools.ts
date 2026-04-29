// Public search of approved schools via the SECURITY DEFINER RPC. Anon
// can call this; the RPC scopes to status='approved' and exposes only
// listing-safe columns (no email/phone/cnpj). Debouncing is the caller's
// responsibility — BuscarPage applies a 300ms debounce on the query.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface SchoolSearchResult {
  id: string;
  slug: string;
  trade_name: string;
  city: string;
  state: string;
  neighborhood: string | null;
  email_likely_institutional: boolean;
  published_lists_count: number;
  rank: number;
}

export interface SearchFilters {
  q: string;
  uf?: string | null;
  city?: string | null;
  limit?: number;
}

const DEFAULT_LIMIT = 12;
const MIN_QUERY_LEN = 3;

export function useSearchSchools(filters: SearchFilters) {
  const q = (filters.q ?? "").trim();
  const uf = filters.uf ?? null;
  const city = filters.city ?? null;
  // The RPC accepts q=NULL meaning "no full-text filter" — useful when the
  // operator only wants UF/city scoping. We translate that to a real query
  // shape only when q is shorter than MIN_QUERY_LEN AND no other filter
  // narrows the result; otherwise we skip the query entirely.
  const hasFilter = !!(uf || city);
  const enabled = q.length >= MIN_QUERY_LEN || hasFilter;

  return useQuery<SchoolSearchResult[]>({
    queryKey: ["search-schools", { q, uf, city, limit: filters.limit ?? DEFAULT_LIMIT }],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_approved_schools", {
        q: q.length >= MIN_QUERY_LEN ? q : null,
        uf_filter: uf,
        city_filter: city,
        limit_n: filters.limit ?? DEFAULT_LIMIT,
      });
      if (error) {
        console.error("[useSearchSchools] rpc failed", {
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      return (data ?? []) as SchoolSearchResult[];
    },
  });
}

// Exported so the consumer can show a "digite pelo menos N caracteres"
// hint that matches the hook's threshold without duplicating the constant.
export const SEARCH_MIN_QUERY_LEN = MIN_QUERY_LEN;
