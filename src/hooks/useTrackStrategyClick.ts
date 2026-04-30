// LC-008 hook, refactored in LC-009 to delegate to the generic
// useTrackEvent. The public API and the event_name written
// ('cart_strategy_clicked') are preserved exactly so CartStrategyCard
// keeps working without changes. Bonus: UTMs are now auto-merged via
// the underlying generic hook.

import { useTrackEvent } from "@/hooks/useTrackEvent";
import type { CartStrategyName } from "@/types/cart";

export interface TrackStrategyClickVars {
  studentId: string;
  strategy: CartStrategyName;
  mlItemId: string | null;
  isMock: boolean;
  permalink: string | null;
}

export function useTrackStrategyClick() {
  const track = useTrackEvent();
  return {
    isPending: track.isPending,
    mutate: (vars: TrackStrategyClickVars) => {
      track.mutate({
        eventName: "cart_strategy_clicked",
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
    },
  };
}
