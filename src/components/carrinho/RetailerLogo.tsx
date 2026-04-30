// Tiny inline retailer "logo" — a colored pill with the retailer name.
// Real SVG/PNG logos can land later (TD-13/14/18/19 era); for the MVP
// the pill is enough to convey the source distinction visually.

import type { CartItemSource } from "@/types/cart";

const STYLES: Record<CartItemSource, { label: string; classes: string }> = {
  mercadolibre: {
    label: "Mercado Livre",
    classes: "bg-amber-100 text-amber-900 border-amber-200",
  },
  kalunga_mock: {
    label: "Kalunga",
    classes: "bg-rose-100 text-rose-900 border-rose-200",
  },
  magalu_mock: {
    label: "Magazine Luiza",
    classes: "bg-sky-100 text-sky-900 border-sky-200",
  },
};

export function RetailerLogo({ source }: { source: CartItemSource }) {
  const cfg = STYLES[source];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}
