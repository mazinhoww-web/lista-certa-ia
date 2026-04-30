// One line in a CartStrategyCard's expandable item list. Shows thumbnail,
// title, retailer pill, price, and Full / DEMO badges as appropriate.
// Truncates long titles to keep the row to ~3 lines max on mobile.

import { CheckCircle2, FlaskConical } from "lucide-react";
import { RetailerLogo } from "@/components/carrinho/RetailerLogo";
import type { CartStrategyItem } from "@/types/cart";

function formatBRL(cents: number | null): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function CartItemRow({ item }: { item: CartStrategyItem }) {
  const isUnavailable = item.status === "unavailable";

  return (
    <div
      className={`flex items-start gap-3 py-2 ${
        isUnavailable ? "opacity-60" : ""
      }`}
    >
      <div
        className="shrink-0 w-12 h-12 rounded-lg bg-lc-surface border border-lc-border overflow-hidden"
        aria-hidden
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-lc-ink line-clamp-2 flex-1 min-w-0">
            {item.title ?? item.list_item_name}
          </p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          {!isUnavailable && <RetailerLogo source={item.source} />}
          {item.is_full && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">
              <CheckCircle2 className="w-3 h-3" aria-hidden />
              Full
            </span>
          )}
          {item.is_mock && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold"
              title="Dado demonstrativo — não use para compra real"
            >
              <FlaskConical className="w-3 h-3" aria-hidden />
              DEMO
            </span>
          )}
          {item.seller_name && !item.is_mock && (
            <span className="text-lc-mid">{item.seller_name}</span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`text-sm font-bold lc-num ${
            isUnavailable ? "text-lc-mid" : "text-lc-ink"
          }`}
        >
          {isUnavailable ? "—" : formatBRL(item.price_cents)}
        </p>
      </div>
    </div>
  );
}
