// LC-009: /ir-para/:strategyId/:retailerKey
//
// "Sala de espera" entre a escolha da estratégia e a chegada no varejista:
//   - lista numerada dos itens com permalinks via wrapPermalink
//   - banner de divulgação afiliada (quando habilitado)
//   - tracking de redirect_page_viewed na montagem (1x por mount)
//   - per-item click registra cart_strategy_clicked com {item_id, item_idx}
//
// Por que existe: redirecionar direto pro permalink mata a chance de
// (a) registrar o evento de conversão de forma confiável, (b) avisar o
// pai sobre a relação afiliada (LGPD/transparência), (c) lidar
// graciosamente com permalinks fora do allowlist.

import { useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { RetailerProductCard } from "@/components/redirect/RetailerProductCard";
import { AffiliateDisclosureBanner } from "@/components/redirect/AffiliateDisclosureBanner";
import { useStrategyById } from "@/hooks/useStrategyById";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import type { CartStrategyItem } from "@/types/cart";

const VALID_RETAILERS = new Set(["mercadolibre"]);

const STRATEGY_LABEL: Record<string, string> = {
  cheapest: "Mais barato",
  fastest: "Mais rápido",
  recommended: "Recomendado",
};

export default function RedirectToRetailerPage() {
  const { strategyId, retailerKey } = useParams<{
    strategyId: string;
    retailerKey: string;
  }>();

  const strategyQ = useStrategyById(strategyId);
  const track = useTrackEvent();
  const viewedRef = useRef(false);

  const isValidRetailer = retailerKey && VALID_RETAILERS.has(retailerKey);

  const strategy = strategyQ.data ?? null;

  useEffect(() => {
    if (!strategy || viewedRef.current) return;
    viewedRef.current = true;
    track.mutate({
      eventName: "redirect_page_viewed",
      metadata: {
        strategy_id: strategy.id,
        student_id: strategy.student_id,
        strategy: strategy.strategy,
        retailer_key: retailerKey ?? null,
        total_items: strategy.total_items,
      },
    });
    // mutate identity is stable across re-renders here; including the
    // mutation object would re-fire the event on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategy?.id]);

  const orderedItems = useMemo<CartStrategyItem[]>(() => {
    if (!strategy) return [];
    // Show available items first, unavailable last.
    return [...strategy.items].sort((a, b) => {
      const ua = a.status === "unavailable" ? 1 : 0;
      const ub = b.status === "unavailable" ? 1 : 0;
      return ua - ub;
    });
  }, [strategy]);

  const onItemClick = (item: CartStrategyItem) => {
    if (!strategy) return;
    track.mutate({
      eventName: "cart_strategy_clicked",
      metadata: {
        student_id: strategy.student_id,
        strategy_id: strategy.id,
        strategy: strategy.strategy,
        ml_item_id: item.ml_item_id,
        list_item_id: item.list_item_id,
        is_mock: item.is_mock,
        permalink: item.permalink,
        retailer_key: retailerKey ?? null,
      },
    });
  };

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início" className="flex items-center">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex-1 mx-auto px-5 md:px-8 py-6 md:py-10 w-full max-w-[720px]">
        {!isValidRetailer && <InvalidLinkState />}

        {isValidRetailer && strategyQ.isLoading && <LoadingState />}

        {isValidRetailer && !strategyQ.isLoading && !strategy && (
          <InvalidLinkState />
        )}

        {isValidRetailer && strategy && (
          <>
            <Link
              to={`/meus-alunos/${strategy.student_id}/carrinho`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-lc-mid hover:text-lc-ink mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
              Voltar para o carrinho
            </Link>

            <h1 className="text-2xl md:text-3xl font-extrabold text-lc-ink tracking-tight">
              Comprar no Mercado Livre
            </h1>
            <p className="mt-1 text-sm text-lc-mid">
              Estratégia{" "}
              <span className="font-semibold">
                {STRATEGY_LABEL[strategy.strategy] ?? strategy.strategy}
              </span>
              {" · "}
              {strategy.total_items - strategy.unavailable_items} de{" "}
              {strategy.total_items} itens com link
            </p>

            <div className="mt-4">
              <AffiliateDisclosureBanner />
            </div>

            <ol className="mt-5 space-y-3">
              {orderedItems.map((item, idx) => (
                <li key={`${item.list_item_id}-${item.source}`}>
                  <RetailerProductCard
                    index={idx + 1}
                    item={item}
                    onClick={onItemClick}
                  />
                </li>
              ))}
            </ol>

            <p className="mt-6 text-[11px] text-lc-mid">
              Cada link abre o produto correspondente em uma nova aba do
              Mercado Livre. O ListaCerta não cobra nada e não compartilha
              dados pessoais com o varejista.
            </p>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      <div className="h-6 w-40 rounded-md bg-lc-border/60 animate-pulse" />
      <div className="h-4 w-64 rounded-md bg-lc-border/40 animate-pulse" />
      <div className="mt-4 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-lc-white border border-lc-border animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

function InvalidLinkState() {
  return (
    <div className="mt-12 rounded-2xl bg-lc-white border border-lc-border p-8 text-center">
      <h1 className="text-2xl font-extrabold text-lc-ink">Link inválido</h1>
      <p className="mt-2 text-sm text-lc-mid">
        Esse link expirou ou nunca existiu. Volte ao carrinho do aluno e
        tente de novo.
      </p>
      <Link
        to="/meus-alunos"
        className="mt-6 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
      >
        Voltar para meus alunos
      </Link>
    </div>
  );
}
