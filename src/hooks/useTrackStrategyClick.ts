// Inserts a 'cart_strategy_clicked' row into analytics_events. user_id is
// the parent (auth.uid()); never the student. metadata holds strategy
// name + ml_item_id + is_mock flag for UTM-style segmentation.

import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { CartStrategyName } from "@/types/cart";

export interface TrackStrategyClickVars {
  studentId: string;
  strategy: CartStrategyName;
  mlItemId: string | null;
  isMock: boolean;
  permalink: string | null;
}

export function useTrackStrategyClick() {
  const { user } = useAuth();
  return useMutation<void, Error, TrackStrategyClickVars>({
    mutationFn: async (vars) => {
      const { error } = await supabase.from("analytics_events").insert({
        event_name: "cart_strategy_clicked",
        user_id: user?.id ?? null,
        metadata: {
          // PII safety: nothing here can be tied back to the student
          // beyond the opaque student_id (no first_name, no school name).
          student_id: vars.studentId,
          strategy: vars.strategy,
          ml_item_id: vars.mlItemId,
          is_mock: vars.isMock,
          permalink: vars.permalink,
        },
      });
      if (error) {
        console.error("[useTrackStrategyClick] insert failed", {
          message: error.message,
        });
        // Tracking failures must NOT block the click flow.
      }
    },
  });
}
