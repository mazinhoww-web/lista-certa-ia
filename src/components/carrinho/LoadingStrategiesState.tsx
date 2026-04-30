// Loading shell while build-cart runs (typical 1.5–3s). Three skeleton
// cards mirror the final layout so the user sees structural promise
// instead of a solo spinner.

import { Loader2 } from "lucide-react";

export function LoadingStrategiesState() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <p className="text-sm text-lc-mid inline-flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        Buscando os melhores preços…
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-lc-white border border-lc-border p-5 space-y-3"
            aria-hidden
          >
            <div className="h-5 w-28 rounded bg-lc-border/60 animate-pulse" />
            <div className="h-10 w-40 rounded bg-lc-border/60 animate-pulse" />
            <div className="h-3 w-full rounded bg-lc-border/60 animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-lc-border/60 animate-pulse" />
            <div className="h-10 w-full rounded bg-lc-border/60 animate-pulse" />
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando estratégias de carrinho…</span>
    </div>
  );
}
