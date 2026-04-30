// One of the 3 strategy cards. Color-coded per strategy (Lime / Coral /
// Blue), shows the total in big lc-num typography, retailer breakdown,
// optional partial-strategy banner, expandable item list, and a CTA
// that navigates to the per-strategy /ir-para redirect page.
//
// CTA behavior (LC-009):
//   - Real ML retailer in winning slot → enabled, tracks click, routes
//     internally to /ir-para/:strategyId/:retailerKey.
//   - Mostly mock retailers in winning slot → disabled with tooltip.
// Tracking: useTrackStrategyClick fires regardless of disabled state so
// we still measure intent on demo strategies (metadata.is_mock=true).

import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, ExternalLink, Lock } from "lucide-react";
import { CartItemRow } from "@/components/carrinho/CartItemRow";
import { PartialStrategyBanner } from "@/components/carrinho/PartialStrategyBanner";
import { useTrackStrategyClick } from "@/hooks/useTrackStrategyClick";
import type { CartStrategy, CartItemSource } from "@/types/cart";

const STRATEGY_COPY: Record<
  CartStrategy["strategy"],
  { label: string; subtitle: string; chip: string; theme: string }
> = {
  cheapest: {
    label: "Mais barato",
    subtitle: "Menor preço por item, mesmo de vendedores diferentes.",
    chip: "vários vendedores",
    theme:
      "border-l-4 border-l-lc-lime bg-lc-white text-lc-ink",
  },
  fastest: {
    label: "Mais rápido",
    subtitle: "Prioriza Mercado Livre Full e retirada em 2h.",
    chip: "envio prioritário",
    theme:
      "border-l-4 border-l-lc-coral bg-lc-white text-lc-ink",
  },
  recommended: {
    label: "Recomendado",
    subtitle: "Equilibra preço, velocidade e vendedor.",
    chip: "balanceado",
    theme:
      "border-l-4 border-l-lc-blue bg-lc-white text-lc-ink",
  },
};

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function pickCtaItem(strategy: CartStrategy) {
  // First non-mock item with a permalink wins. If everything is mock, we
  // still pick the first available so we can disable the CTA cleanly.
  const real = strategy.items.find(
    (i) => !i.is_mock && i.permalink && i.status !== "unavailable",
  );
  if (real) return { item: real, allMock: false };
  const anyAvail = strategy.items.find(
    (i) => i.permalink && i.status !== "unavailable",
  );
  return { item: anyAvail ?? null, allMock: !!anyAvail };
}

function retailerKeyForSource(source: CartItemSource): string {
  // Today only ML has a redirect page; future retailers extend this map.
  if (source === "mercadolibre") return "mercadolibre";
  return "mercadolibre";
}

export function CartStrategyCard({ strategy }: { strategy: CartStrategy }) {
  const cfg = STRATEGY_COPY[strategy.strategy];
  const [open, setOpen] = useState(false);
  const trackClick = useTrackStrategyClick();
  const { item: cta, allMock } = pickCtaItem(strategy);
  const ctaDisabled = !cta || allMock;
  const retailerEntries = Object.entries(strategy.retailers_summary);
  const retailerKey = cta ? retailerKeyForSource(cta.source) : "mercadolibre";
  const ctaHref = `/ir-para/${strategy.id}/${retailerKey}`;

  const fireClickTrack = () => {
    if (!cta) return;
    trackClick.mutate({
      studentId: strategy.student_id,
      strategy: strategy.strategy,
      mlItemId: cta.ml_item_id,
      isMock: cta.is_mock,
      permalink: cta.permalink,
    });
  };

  const hasMockItem = strategy.items.some((i) => i.is_mock);

  return (
    <article className={`rounded-2xl ${cfg.theme} p-5 shadow-lc-sm`}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold tracking-tight">{cfg.label}</h3>
          <p className="mt-0.5 text-xs text-lc-mid leading-snug">
            {cfg.subtitle}
          </p>
        </div>
        {hasMockItem && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-semibold">
            contém demo
          </span>
        )}
      </header>

      <p className="mt-5 text-3xl md:text-4xl font-black tracking-tight lc-num">
        {formatBRL(strategy.total_cents)}
      </p>
      <p className="text-xs text-lc-mid mt-0.5">
        {strategy.total_items - strategy.unavailable_items} de{" "}
        {strategy.total_items} itens com preço
        {strategy.unavailable_items > 0
          ? ` · ${strategy.unavailable_items} sem preço`
          : ""}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-lc-surface border border-lc-border text-lc-mid font-semibold">
          {cfg.chip}
        </span>
        {retailerEntries.length > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-lc-surface border border-lc-border text-lc-mid">
            {retailerEntries.length === 1
              ? `1 vendedor`
              : `${retailerEntries.length} vendedores`}
          </span>
        )}
      </div>

      {strategy.has_partial_strategy && strategy.strategy === "fastest" && (
        <div className="mt-4">
          <PartialStrategyBanner strategyLabel={cfg.label} />
        </div>
      )}

      {ctaDisabled ? (
        <button
          type="button"
          onClick={fireClickTrack}
          disabled
          title="Disponível em breve"
          className="mt-5 w-full h-11 px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all bg-lc-surface border border-lc-border text-lc-mid cursor-not-allowed"
        >
          <Lock className="w-4 h-4" aria-hidden />
          Disponível em breve
        </button>
      ) : (
        <Link
          to={ctaHref}
          onClick={fireClickTrack}
          className="mt-5 w-full h-11 px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all bg-lc-blue text-white hover:opacity-90"
        >
          <ExternalLink className="w-4 h-4" aria-hidden />
          Comprar no Mercado Livre
        </Link>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-4 w-full inline-flex items-center justify-center gap-1 text-xs font-semibold text-lc-mid hover:text-lc-ink transition-colors"
        aria-expanded={open}
      >
        {open ? "Esconder itens" : `Ver ${strategy.items.length} itens`}
        {open ? (
          <ChevronUp className="w-3 h-3" aria-hidden />
        ) : (
          <ChevronDown className="w-3 h-3" aria-hidden />
        )}
      </button>

      {open && (
        <ul className="mt-3 divide-y divide-lc-border/60 border-t border-lc-border/60 pt-1">
          {strategy.items.map((it) => (
            <li key={`${it.list_item_id}-${it.source}`}>
              <CartItemRow item={it} />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
