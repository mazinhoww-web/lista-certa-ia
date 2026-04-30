// LC-009: discreet Wirecutter-style affiliate disclosure. Conditional on
// VITE_AFFILIATE_DISCLOSURE_ENABLED so we can keep it dark while TD-25
// (Mercado Ads Afiliados onboarding) is pending and flip it on once the
// affiliate account is live, without a code deploy.

export function AffiliateDisclosureBanner() {
  const enabled =
    (import.meta as ImportMeta & { env?: Record<string, string> }).env
      ?.VITE_AFFILIATE_DISCLOSURE_ENABLED === "true";
  if (!enabled) return null;

  return (
    <p className="rounded-xl bg-lc-surface border border-lc-border px-3 py-2 text-[11px] leading-snug text-lc-mid">
      Ganhamos uma pequena comissão se você comprar pelo nosso link, sem
      custo adicional pra você. Isso ajuda a manter o ListaCerta gratuito.
    </p>
  );
}
