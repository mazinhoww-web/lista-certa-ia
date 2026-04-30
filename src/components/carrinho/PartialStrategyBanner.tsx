// Inline banner shown inside a CartStrategyCard when has_partial_strategy
// is true. For "Fastest" specifically, this means: not every item could
// be sourced from Full / pickup_2h, so the strategy fell back to the
// cheapest non-Full option for some items.

import { Truck } from "lucide-react";

interface Props {
  strategyLabel: string;
}

export function PartialStrategyBanner({ strategyLabel }: Props) {
  return (
    <div
      className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900 flex items-start gap-2"
      role="status"
    >
      <Truck className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
      <span>
        Alguns itens nesta opção <strong>{strategyLabel}</strong> não têm envio
        Full disponível. Selecionamos o mais rápido entre os candidatos.
      </span>
    </div>
  );
}
