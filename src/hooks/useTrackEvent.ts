// LC-009: generic analytics_events writer. Merges UTM from
// sessionStorage automatically and tags the event with the parent's
// auth.uid() (or null if anon). Failures NEVER throw — analytics is
// fire-and-forget; broken UX from a 500 in tracking is unacceptable.

import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredUtm } from "@/hooks/useUtmCapture";

export interface TrackEventVars {
  eventName: string;
  metadata?: Record<string, unknown>;
}

export function useTrackEvent() {
  const { user } = useAuth();
  return useMutation<void, Error, TrackEventVars>({
    mutationFn: async (vars) => {
      const utm = getStoredUtm();
      const merged: Record<string, unknown> = {
        ...(vars.metadata ?? {}),
      };
      if (Object.keys(utm).length > 0) {
        merged.utm = utm;
      }
      const { error } = await supabase.from("analytics_events").insert({
        event_name: vars.eventName,
        user_id: user?.id ?? null,
        metadata: merged as never,
      });
      if (error) {
        // Log code/message only; never include event metadata in logs.
        console.error("[useTrackEvent] insert failed", {
          event: vars.eventName,
          code: error.code,
          message: error.message,
        });
        // Intentionally swallow: analytics MUST NOT block UX.
      }
    },
  });
}
