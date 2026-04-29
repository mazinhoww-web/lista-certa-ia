// Wraps the create_list_with_items RPC. The RPC is SECURITY DEFINER and
// inserts the list + its items in one transaction; the front never writes
// directly to lists/list_items.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database, Json } from "@/integrations/supabase/types";

type ListSource = Database["public"]["Enums"]["list_source"];

export interface ListItemInput {
  name: string;
  specification?: string | null;
  quantity: number;
  unit?: string | null;
  notes?: string | null;
}

export interface CreateListVars {
  schoolId: string;
  grade: string;
  schoolYear: number;
  teacherName: string | null;
  source: ListSource;
  pendingManualDigitization: boolean;
  rawFileUrl: string | null;
  items: ListItemInput[];
}

export function useCreateList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: CreateListVars): Promise<string> => {
      const { data, error } = await supabase.rpc("create_list_with_items", {
        p_school_id: vars.schoolId,
        p_grade: vars.grade,
        p_school_year: vars.schoolYear,
        // RPC Args type omitted nullability after regen; runtime accepts NULL
        // and the SQL function signature treats these params as nullable text.
        p_teacher_name: vars.teacherName as unknown as string,
        p_source: vars.source,
        p_pending_manual_digitization: vars.pendingManualDigitization,
        p_raw_file_url: vars.rawFileUrl as unknown as string,
        // Items are typed as ListItemInput[]; the RPC accepts JSONB.
        // Cast through unknown — the runtime JSON serialization is identical.
        p_items: vars.items as unknown as Json,
      });
      if (error) {
        console.error("[useCreateList] rpc failed", {
          school_id: vars.schoolId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      // RPC returns SETOF (id, status, created_at) — take the first row's id.
      const row = Array.isArray(data) ? data[0] : (data as { id: string } | null);
      if (!row?.id) {
        throw new Error("create_list_with_items returned no row");
      }
      return row.id;
    },
    onSuccess: (_listId, vars) => {
      qc.invalidateQueries({ queryKey: ["school-lists", vars.schoolId] });
    },
  });
}
