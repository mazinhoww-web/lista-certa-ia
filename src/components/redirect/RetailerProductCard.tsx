// LC-009: numbered card on /ir-para listing one item of the strategy.
// Renders thumbnail, title, retailer/seller, price, and a per-item
// "comprar" CTA. The CTA is generated through wrapPermalink — when the
// host fails the allowlist, the URL is null and the button is rendered
// disabled with a manual-search fallback hint. We never render an open
// link to an off-allowlist host, even if the API hands us one.

import { ExternalLink, FlaskConical, Lock } from "lucide-react";
import { wrapPermalink } from "@/lib/wrapPermalink";
import type { CartStrategyItem } from "@/types/cart";

function formatBRL(cents: number | null): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

interface Props {
  index: number;
  item: CartStrategyItem;
  onClick?: (item: CartStrategyItem, wrappedUrl: string) => void;
}

export function RetailerProductCard({ index, item, onClick }: Props) {
  const wrapped = wrapPermalink(item.permalink);
  const isUnavailable = item.status === "unavailable";
  const disabled = isUnavailable || !wrapped;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!wrapped) {
      e.preventDefault();
      return;
    }
    onClick?.(item, wrapped);
  };

  const disabledReason = isUnavailable
    ? "Item indisponível no momento."
    : `Link indisponível, busque manualmente por: ${item.list_item_name}`;

  return (
    <article className="rounded-2xl bg-lc-white border border-lc-border p-4 shadow-lc-sm flex gap-4">
      <div className="shrink-0 flex flex-col items-center gap-2">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-lc-blue text-white text-xs font-bold"
          aria-hidden
        >
          {index}
        </span>
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-lc-surface border border-lc-border overflow-hidden">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : null}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <p className="text-sm font-semibold text-lc-ink line-clamp-2">
          {item.title ?? item.list_item_name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-lc-mid">
          {item.seller_name && !item.is_mock && <span>{item.seller_name}</span>}
          {item.is_full && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">
              Full
            </span>
          )}
          {item.is_mock && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
              <FlaskConical className="w-3 h-3" aria-hidden />
              DEMO
            </span>
          )}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-base font-bold lc-num text-lc-ink">
            {formatBRL(item.price_cents)}
          </p>

          {disabled ? (
            <button
              type="button"
              disabled
              title={disabledReason}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-lc-surface border border-lc-border text-lc-mid text-xs font-semibold cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5" aria-hidden />
              Indisponível
            </button>
          ) : (
            <a
              href={wrapped}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              onClick={handleClick}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-lc-blue text-white text-xs font-semibold hover:opacity-90 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden />
              Comprar
            </a>
          )}
        </div>
        {disabled && !isUnavailable && (
          <p className="mt-2 text-[11px] text-lc-mid">
            Link indisponível. Busque manualmente por:{" "}
            <span className="font-semibold text-lc-ink">
              {item.list_item_name}
            </span>
          </p>
        )}
      </div>
    </article>
  );
}
