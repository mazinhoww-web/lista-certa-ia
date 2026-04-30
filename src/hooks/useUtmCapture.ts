// LC-009: capture UTM parameters from the entry URL and persist them
// in sessionStorage so subsequent analytics_events can attach them.
//
// Run-once-per-session: read URLSearchParams on mount; if any utm_*
// keys are present, write a JSON blob into sessionStorage. Later
// useTrackEvent calls merge it into metadata.utm.
//
// Privacy: stores only the utm_* values the URL gave us. We do NOT
// fingerprint, store IP, user-agent, or referrer beyond the params.

import { useEffect } from "react";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;
type UtmKey = (typeof UTM_KEYS)[number];

const SS_KEY = "lc_utm";

/** Mount-once hook. Captures utm_* once per session from window.location. */
export function useUtmCapture(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const existing = window.sessionStorage.getItem(SS_KEY);
      if (existing) return; // Captured already this session.

      const params = new URLSearchParams(window.location.search);
      const captured: Partial<Record<UtmKey, string>> = {};
      for (const k of UTM_KEYS) {
        const v = params.get(k);
        if (v && v.length > 0 && v.length <= 200) {
          captured[k] = v;
        }
      }
      if (Object.keys(captured).length === 0) return;
      window.sessionStorage.setItem(SS_KEY, JSON.stringify(captured));
    } catch {
      // sessionStorage can throw in private mode; failing silently is
      // correct here — no analytics is acceptable, broken UX is not.
    }
  }, []);
}

/**
 * Read-only accessor. Returns {} when nothing was captured (or session
 * storage is unavailable). Used by useTrackEvent to enrich metadata.
 */
export function getStoredUtm(): Partial<Record<UtmKey, string>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(SS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<UtmKey, string>>;
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed;
  } catch {
    return {};
  }
}
