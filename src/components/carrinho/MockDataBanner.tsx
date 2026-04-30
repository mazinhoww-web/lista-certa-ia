// Global banner shown at the top of StudentCartPage when ANY strategy
// includes a mock retailer (Kalunga / Magalu). Three layers of UX
// disclosure (badge per item + this banner + disabled CTA) are mandatory
// to prevent confusion with real data.
//
// Dismissible per session via sessionStorage.

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const SESSION_KEY = "lc_dismissed_mock_banner";

export function MockDataBanner() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  return (
    <div
      role="status"
      className="rounded-2xl bg-amber-50 border border-lc-coral/40 px-4 py-3 mb-4 flex items-start gap-3"
    >
      <AlertTriangle
        className="w-5 h-5 text-lc-coral mt-0.5 shrink-0"
        aria-hidden
      />
      <div className="flex-1 min-w-0 text-sm text-amber-900">
        <p className="font-semibold">Preços demonstrativos</p>
        <p className="mt-0.5 text-amber-900/90">
          Os preços de Kalunga e Magazine Luiza nesta tela são demonstrativos e
          não devem ser usados para compra real. Apenas Mercado Livre tem dado
          ao vivo no momento.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          try {
            sessionStorage.setItem(SESSION_KEY, "1");
          } catch {
            // ignore storage failure
          }
          setDismissed(true);
        }}
        aria-label="Fechar aviso"
        className="text-amber-900/70 hover:text-amber-900 transition-colors"
      >
        <X className="w-4 h-4" aria-hidden />
      </button>
    </div>
  );
}
