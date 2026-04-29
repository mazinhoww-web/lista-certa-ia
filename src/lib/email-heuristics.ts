// Heuristic to flag whether a contact email looks institutional (school /
// org domain) versus a personal webmail. Output feeds the admin triage
// queue (LC-004): institutional senders get prioritized, personal ones get
// a soft second look. False positives are tolerated; false negatives are
// the more expensive case (we'd deprioritize a legitimate school).

const PERSONAL_PROVIDERS: ReadonlySet<string> = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "yahoo.com.br",
  "icloud.com",
  "live.com",
  "bol.com.br",
  "uol.com.br",
  "terra.com.br",
  "ig.com.br",
  "protonmail.com",
  "proton.me",
  "me.com",
  "mac.com",
  "msn.com",
  "yandex.com",
]);

export function isLikelyInstitutionalEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || /\s/.test(trimmed)) return false;

  const at = trimmed.lastIndexOf("@");
  if (at < 1 || at >= trimmed.length - 1) return false;

  const domain = trimmed.slice(at + 1).toLowerCase();
  if (!domain) return false;

  if (PERSONAL_PROVIDERS.has(domain)) return false;

  // Strong positive signals.
  if (domain.endsWith(".edu.br") || domain.endsWith(".edu")) return true;

  // Any other domain with a plausible TLD is a candidate.
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)
    && /\.[a-z]{2,}$/.test(domain);
}
