// LC-009: "comprou seu material?" modal. Three responses:
//   - "yes"    → marks the strategy as converted, single event.
//   - "no"     → records "no", single event (helpful signal too).
//   - "partial" → reveals an items count input, then records the count.
//
// Trigger lives in useSelfReportPurchase: 24h after first cart click,
// 30d cooldown after a previous report, max 1 per session. The modal
// itself is dumb — it just reports back what the parent says.
//
// Privacy: we send only counts and the strategy id. No item names, no
// retailer breakdown — we don't need them to know if conversion happened.

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SelfReportResponse } from "@/hooks/useSelfReportPurchase";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalItems: number;
  onReport: (response: SelfReportResponse, itemsCount?: number) => void;
}

export function PurchaseSelfReportModal({
  open,
  onOpenChange,
  totalItems,
  onReport,
}: Props) {
  const [mode, setMode] = useState<"choose" | "partial">("choose");
  const [count, setCount] = useState<number>(Math.max(1, totalItems - 1));

  const close = () => {
    setMode("choose");
    setCount(Math.max(1, totalItems - 1));
    onOpenChange(false);
  };

  const handleYes = () => {
    onReport("yes");
    close();
  };

  const handleNo = () => {
    onReport("no");
    close();
  };

  const handlePartialConfirm = () => {
    const safe = Math.max(1, Math.min(totalItems, Math.round(count) || 1));
    onReport("partial", safe);
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Você comprou o material?</DialogTitle>
          <DialogDescription>
            Suas respostas ajudam a melhorar a próxima lista. A gente não
            compartilha nada com nenhum varejista.
          </DialogDescription>
        </DialogHeader>

        {mode === "choose" && (
          <div className="grid grid-cols-1 gap-2 mt-2">
            <button
              type="button"
              onClick={handleYes}
              className="h-11 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
            >
              Sim, comprei tudo
            </button>
            <button
              type="button"
              onClick={() => setMode("partial")}
              className="h-11 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold hover:bg-lc-surface transition-all"
            >
              Comprei só uma parte
            </button>
            <button
              type="button"
              onClick={handleNo}
              className="h-11 rounded-xl bg-lc-white border border-lc-border text-lc-mid text-sm font-semibold hover:bg-lc-surface transition-all"
            >
              Ainda não comprei
            </button>
          </div>
        )}

        {mode === "partial" && (
          <div className="mt-2 space-y-3">
            <label className="block text-sm font-semibold text-lc-ink">
              Quantos itens você conseguiu comprar?
              <input
                type="number"
                min={1}
                max={totalItems}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-lc-ink text-sm focus:outline-none focus:ring-2 focus:ring-lc-blue lc-num"
              />
            </label>
            <p className="text-[11px] text-lc-mid">
              De um total de {totalItems} itens na lista.
            </p>
            <DialogFooter className="gap-2 sm:gap-2">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="h-10 px-4 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold hover:bg-lc-surface transition-all"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handlePartialConfirm}
                className="h-10 px-4 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
              >
                Confirmar
              </button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
