// LC-009: /r/:shortId — resolves an 8-hex prefix of cart_strategies.id
// and bounces to /ir-para/:strategyId/:retailerKey. RLS makes the query
// invisible to other parents; useStrategyByShortId additionally rejects
// any short id whose prefix matches more than one row (collision) and
// renders a generic "link inválido" state. This means the page never
// silently routes a parent to a stranger's cart.
//
// We do NOT track an event from this page directly — the
// redirect_page_viewed event fires from RedirectToRetailerPage on
// arrival, which keeps a single source of truth for the funnel.

import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { useStrategyByShortId } from "@/hooks/useStrategyByShortId";
import { isValidShortId } from "@/lib/shortId";

export default function ShortLinkResolverPage() {
  const { shortId } = useParams<{ shortId: string }>();
  const enabled = isValidShortId(shortId);
  const resolution = useStrategyByShortId(enabled ? shortId : undefined);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = "Abrindo carrinho · ListaCerta";
    return () => {
      document.title = "ListaCerta";
    };
  }, []);

  if (!enabled) return <NotFoundLayout />;

  if (resolution.isLoading) return <LoadingLayout />;

  if (resolution.error || !resolution.data) return <NotFoundLayout />;

  return (
    <Navigate
      to={`/ir-para/${resolution.data.strategyId}/${resolution.data.retailerKey}`}
      replace
    />
  );
}

function LoadingLayout() {
  return (
    <Shell>
      <div className="mt-12 text-center">
        <p className="text-sm text-lc-mid">Abrindo seu carrinho…</p>
        <div className="mx-auto mt-4 h-2 w-40 rounded-full bg-lc-border/60 overflow-hidden">
          <div className="h-full w-1/3 bg-lc-blue animate-pulse" />
        </div>
      </div>
    </Shell>
  );
}

function NotFoundLayout() {
  return (
    <Shell>
      <div className="mt-12 rounded-2xl bg-lc-white border border-lc-border p-8 text-center">
        <h1 className="text-2xl font-extrabold text-lc-ink">Link inválido</h1>
        <p className="mt-2 text-sm text-lc-mid">
          Esse link expirou ou nunca existiu. Volte para a página inicial e
          comece pela busca da escola.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
        >
          Ir para a página inicial
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início" className="flex items-center">
          <Logo size="sm" />
        </Link>
      </header>
      <main className="flex-1 mx-auto px-5 md:px-8 py-6 md:py-10 w-full max-w-[480px]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
