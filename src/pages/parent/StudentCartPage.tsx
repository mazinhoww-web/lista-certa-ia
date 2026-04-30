// /meus-alunos/:studentId/carrinho — auto-fires build-cart on mount
// (via useCartStrategies). Renders 3 strategy cards in a stack on
// mobile and a 3-column grid on desktop. Optional banners surface
// unavailable items, mock data, and the LGPD note.
//
// PII: the student first_name appears in the page header and in
// document.title only — never logged.

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useStudent } from "@/hooks/useStudent";
import { useCartStrategies } from "@/hooks/useCartStrategies";
import { useRefreshCartStrategies } from "@/hooks/useRefreshCartStrategies";
import { useSelfReportPurchase } from "@/hooks/useSelfReportPurchase";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { CartStrategyCard } from "@/components/carrinho/CartStrategyCard";
import { EmptyCartState } from "@/components/carrinho/EmptyCartState";
import { LoadingStrategiesState } from "@/components/carrinho/LoadingStrategiesState";
import { MockDataBanner } from "@/components/carrinho/MockDataBanner";
import { PurchaseSelfReportModal } from "@/components/carrinho/PurchaseSelfReportModal";
import { StrategyComparisonHeader } from "@/components/carrinho/StrategyComparisonHeader";
import { UnavailableItemsBanner } from "@/components/carrinho/UnavailableItemsBanner";
import type { CartStrategy } from "@/types/cart";

const STRATEGY_ORDER: CartStrategy["strategy"][] = [
  "cheapest",
  "fastest",
  "recommended",
];

export default function StudentCartPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const studentQ = useStudent(studentId);
  const listId = studentQ.data?.list_id ?? undefined;
  const cart = useCartStrategies(studentId, listId ?? undefined);
  const refresh = useRefreshCartStrategies();

  useEffect(() => {
    if (studentQ.data?.first_name) {
      document.title = `Carrinho de ${studentQ.data.first_name} · ListaCerta`;
    }
    return () => {
      document.title = "ListaCerta";
    };
  }, [studentQ.data?.first_name]);

  const strategies = useMemo(() => {
    if (!cart.data) return [] as CartStrategy[];
    const byName = new Map(cart.data.map((s) => [s.strategy, s]));
    return STRATEGY_ORDER.map((n) => byName.get(n)).filter(
      (s): s is CartStrategy => Boolean(s),
    );
  }, [cart.data]);

  const hasAnyMock = useMemo(
    () => strategies.some((s) => s.items.some((i) => i.is_mock)),
    [strategies],
  );

  // Self-report modal: pick the recommended strategy id (or first
  // available) to attribute the report to. The hook gates the
  // shouldShow logic — see useSelfReportPurchase for trigger details.
  const reportStrategyId =
    strategies.find((s) => s.strategy === "recommended")?.id ?? strategies[0]?.id;
  const reportTotalItems = strategies[0]?.total_items ?? 0;
  const selfReport = useSelfReportPurchase(reportStrategyId);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (selfReport.shouldShow) setReportOpen(true);
  }, [selfReport.shouldShow]);

  // Hook ordering rule: keep all hooks above any conditional return.
  useEffect(() => {
    if (!studentId) navigate("/meus-alunos", { replace: true });
  }, [studentId, navigate]);

  const onRefresh = () => {
    if (!listId || !studentId) return;
    refresh.mutate(
      { studentId, listId },
      {
        onSuccess: () => toast.success("Carrinhos atualizados."),
        onError: () => toast.error("Não conseguimos atualizar agora."),
      },
    );
  };

  if (!studentId) return null;

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center border-b border-lc-border bg-lc-white">
        <button
          onClick={() => navigate("/")}
          aria-label="ListaCerta — início"
          className="flex items-center"
        >
          <Logo size="sm" />
        </button>
      </header>

      <main className="flex-1 mx-auto px-5 md:px-8 py-6 md:py-10 w-full max-w-[480px] md:max-w-[1100px]">
        {studentQ.isLoading && <LoadingStrategiesState />}

        {!studentQ.isLoading && !studentQ.data && (
          <RemovedState onBack={() => navigate("/meus-alunos")} />
        )}

        {!studentQ.isLoading && studentQ.data && (
          <>
            <StrategyComparisonHeader
              studentFirstName={studentQ.data.first_name ?? "—"}
              schoolName={studentQ.data.school_trade_name}
              listGrade={studentQ.data.grade}
              generatedAt={strategies[0]?.generated_at ?? null}
              onRefresh={onRefresh}
              refreshing={refresh.isPending}
            />

            {!listId && (
              <EmptyCartState
                studentId={studentId}
                studentFirstName={studentQ.data.first_name ?? ""}
              />
            )}

            {listId && (cart.isLoading || refresh.isPending) && (
              <LoadingStrategiesState />
            )}

            {listId && !cart.isLoading && cart.error && (
              <FailedState onRetry={() => void cart.refetch()} />
            )}

            {listId && !cart.isLoading && !cart.error && strategies.length > 0 && (
              <>
                {hasAnyMock && <MockDataBanner />}
                <UnavailableItemsBanner strategies={strategies} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {strategies.map((s) => (
                    <CartStrategyCard key={s.id} strategy={s} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <PurchaseSelfReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        totalItems={reportTotalItems}
        onReport={selfReport.report}
      />

      <Footer />
    </div>
  );
}

function RemovedState({ onBack }: { onBack: () => void }) {
  return (
    <div className="mt-12 text-center">
      <h1 className="text-2xl font-extrabold text-lc-ink">
        Este aluno foi removido.
      </h1>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
      >
        Voltar para meus alunos
      </button>
    </div>
  );
}

function FailedState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl bg-lc-white border border-lc-border p-8 text-center">
      <h2 className="text-lg font-bold text-lc-ink">
        Não conseguimos montar o carrinho agora.
      </h2>
      <p className="mt-2 text-sm text-lc-mid">
        Tente novamente em instantes.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
      >
        Tentar novamente
      </button>
    </div>
  );
}
