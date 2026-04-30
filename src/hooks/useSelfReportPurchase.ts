// LC-009: drives the "comprou seu material?" modal.
//
// Trigger logic — all three must be true:
//   1. The current parent has at least one cart_strategy_clicked event
//      ≥ 24h old.
//   2. No cart_strategy_self_reported_purchase exists for this parent
//      within the past 30 days (stop interrogating).
//   3. The modal hasn't been shown this browser session
//      (sessionStorage flag).
//
// One modal per session, one report per 30 days. Configurable via the
// constants at the top — A/B testing TD-30.

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useTrackEvent } from "@/hooks/useTrackEvent";

const TRIGGER_AFTER_HOURS = 24; // TD-30: A/B 18 vs 24 vs 48
const REPORT_COOLDOWN_DAYS = 30;
const SS_SHOWN_KEY = "lc_self_report_shown";

interface ShouldShowDecision {
  shouldShow: boolean;
}

export type SelfReportResponse = "yes" | "no" | "partial";

export function useSelfReportPurchase(strategyId: string | undefined) {
  const { user } = useAuth();
  const track = useTrackEvent();
  const [shownThisSession, setShownThisSession] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(SS_SHOWN_KEY) === "1";
    } catch {
      return false;
    }
  });

  const decision = useQuery<ShouldShowDecision>({
    queryKey: ["self-report-decision", user?.id ?? "anon"],
    enabled: Boolean(user?.id) && !shownThisSession,
    queryFn: async () => {
      const triggerCutoff = new Date(
        Date.now() - TRIGGER_AFTER_HOURS * 3600 * 1000,
      ).toISOString();
      const reportCutoff = new Date(
        Date.now() - REPORT_COOLDOWN_DAYS * 24 * 3600 * 1000,
      ).toISOString();

      const [{ data: oldClick }, { data: recentReport }] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("id")
          .eq("user_id", user!.id)
          .eq("event_name", "cart_strategy_clicked")
          .lt("created_at", triggerCutoff)
          .limit(1),
        supabase
          .from("analytics_events")
          .select("id")
          .eq("user_id", user!.id)
          .eq("event_name", "cart_strategy_self_reported_purchase")
          .gt("created_at", reportCutoff)
          .limit(1),
      ]);
      const hasOldClick = (oldClick?.length ?? 0) > 0;
      const hasRecentReport = (recentReport?.length ?? 0) > 0;
      return { shouldShow: hasOldClick && !hasRecentReport };
    },
  });

  // Mark the session flag as soon as the modal will be shown so a
  // second strategy on the same student doesn't re-trigger it.
  useEffect(() => {
    if (decision.data?.shouldShow && !shownThisSession) {
      try {
        window.sessionStorage.setItem(SS_SHOWN_KEY, "1");
      } catch {
        // ignore
      }
      setShownThisSession(true);
    }
  }, [decision.data?.shouldShow, shownThisSession]);

  const report = (response: SelfReportResponse, itemsCount?: number) => {
    track.mutate({
      eventName: "cart_strategy_self_reported_purchase",
      metadata: {
        strategy_id: strategyId ?? null,
        response,
        items_purchased_count:
          response === "partial" && typeof itemsCount === "number"
            ? itemsCount
            : null,
      },
    });
  };

  return {
    shouldShow: !shownThisSession && Boolean(decision.data?.shouldShow),
    isPending: track.isPending,
    report,
  };
}
