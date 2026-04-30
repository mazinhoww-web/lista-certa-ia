// LC-009: wrap a Mercado Livre permalink with affiliate tracking params.
//
// Two responsibilities:
//   1. Open-redirect prevention — refuse any URL whose hostname is not
//      on ML_HOSTS. Returns null in that case so callers can render a
//      "link indisponível" state without blindly redirecting elsewhere.
//   2. Affiliate tagging — when VITE_ML_AFFILIATE_TAG is set, append
//      the tracking parameter pair to the URL. When unset, the URL is
//      returned unchanged (graceful no-op while TD-25 is pending).
//
// SYNC: This list of hosts MUST stay in sync with
//       supabase/functions/build-cart/index.ts.
//       If you add or remove a host here, make the same change there.
//       TD-31 is the long-term fix (single source of truth via test).
export const ML_HOSTS = [
  "mercadolivre.com.br",
  "www.mercadolivre.com.br",
  "produto.mercadolivre.com.br",
  "lista.mercadolivre.com.br",
  "mercadolibre.com",
] as const;

const ML_HOSTS_SET = new Set<string>(ML_HOSTS);

function getAffiliateTag(): string | null {
  // Prefer Vite-injected env when running in the browser bundle.
  const tag =
    (typeof import.meta !== "undefined" &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env
        ?.VITE_ML_AFFILIATE_TAG) ||
    "";
  const trimmed = tag.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Validates rawUrl is a Mercado Livre URL (exact hostname match) and
 * appends affiliate tracking params when available.
 *
 * Returns:
 *   - the URL unchanged when the affiliate tag env is empty
 *   - the URL with appended params when the tag is present
 *   - null when rawUrl is missing, malformed, or its hostname is not
 *     in the ML_HOSTS allowlist (open-redirect prevention)
 */
export function wrapPermalink(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }
  // Exact hostname match — substring is unsafe (evil-mercadolivre.com.br
  // would otherwise pass).
  if (!ML_HOSTS_SET.has(parsed.hostname)) {
    return null;
  }

  const tag = getAffiliateTag();
  if (!tag) return parsed.toString();

  // Append tracking params. ML BR's actual parameter names changed
  // historically; the operator copies the pair from the real affiliate
  // dashboard once the account is live (TD-25). The placeholder names
  // below are deliberately neutral and easy to grep for when TD-25 lands.
  parsed.searchParams.set("matt_tool", tag);
  parsed.searchParams.set("matt_word", tag);
  return parsed.toString();
}
