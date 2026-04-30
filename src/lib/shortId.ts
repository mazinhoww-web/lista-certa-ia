// LC-009: short link encoding for cart_strategies.id.
//
// Strategy id is a UUID v4 (32 hex digits + 4 dashes). The first 8 hex
// digits give a 16^8 ≈ 4.3B namespace. With ~10K strategies the chance
// of collision is ~1.2e-5; with 100K it is ~1.2e-3.
//
// useStrategyByShortId protects against silent prefix collision by
// SELECTing with LIMIT 2 — when two rows share the same prefix, both
// requests are rejected (caller renders "link inválido"). This makes
// collision observable in logs and triggers TD-28 (migrate to nanoid).

const SHORT_ID_RE = /^[0-9a-f]{8}$/i;

/**
 * Returns the first 8 hex characters of a UUID (no dashes).
 * Pure, deterministic. Throws nothing — callers can rely on always
 * getting an 8-char string back when given a valid UUID.
 */
export function encodeShortId(strategyUuid: string): string {
  return strategyUuid.replace(/-/g, "").slice(0, 8).toLowerCase();
}

/** Format-only validation. Resolution happens server-side via SQL. */
export function isValidShortId(s: string | null | undefined): boolean {
  if (!s) return false;
  return SHORT_ID_RE.test(s);
}
