// Yellow banner listing items the cart-build couldn't price. Counts come
// from cart_strategies aggregates; the labels come from the items array.
// The list collapses when there are > 5 names to avoid noise.

import { useState } from "react";
import { ChevronDown, ChevronUp, PackageX } from "lucide-react";
import type { CartStrategy } from "@/types/cart";

interface Props {
  strategies: CartStrategy[];
}

function uniqueUnavailableNames(strategies: CartStrategy[]): string[] {
  const names = new Set<string>();
  for (const s of strategies) {
    for (const it of s.items) {
      if (it.status === "unavailable") names.add(it.list_item_name);
    }
  }
  return [...names];
}

export function UnavailableItemsBanner({ strategies }: Props) {
  const names = uniqueUnavailableNames(strategies);
  const [open, setOpen] = useState(false);

  if (names.length === 0) return null;

  const visible = open ? names : names.slice(0, 5);
  const hidden = names.length - visible.length;

  return (
    <div
      role="status"
      className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 mb-4"
    >
      <div className="flex items-start gap-3">
        <PackageX
          className="w-5 h-5 text-amber-700 mt-0.5 shrink-0"
          aria-hidden
        />
        <div className="flex-1 min-w-0 text-sm text-amber-900">
          <p className="font-semibold">
            {names.length === 1
              ? "1 item não disponível"
              : `${names.length} itens não disponíveis`}
          </p>
          <p className="mt-0.5 text-amber-900/90">
            Não encontramos esses produtos no Mercado Livre agora. Você pode
            comprar na escola ou em loja física.
          </p>
          <ul className="mt-2 text-xs text-amber-900/90 list-disc pl-5 space-y-0.5">
            {visible.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          {hidden > 0 && !open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-amber-700 transition-colors"
            >
              Mostrar mais {hidden} <ChevronDown className="w-3 h-3" aria-hidden />
            </button>
          )}
          {open && names.length > 5 && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-amber-700 transition-colors"
            >
              Recolher <ChevronUp className="w-3 h-3" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
