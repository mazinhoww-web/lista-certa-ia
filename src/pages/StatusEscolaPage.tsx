// Detail screen for a single school the operator administers. Renders the
// pipeline timeline, the school's own data, and a status-specific footer.
//
// Polls the query every 30s while status is pending_approval so the
// operator sees an approval/rejection without manually refreshing. Polling
// stops automatically when the status leaves pending_approval.

import { useEffect } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSchool } from "@/hooks/useSchool";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { StatusBadge } from "@/components/escola/StatusBadge";
import { StatusTimeline } from "@/components/escola/StatusTimeline";
import { SchoolDataCard } from "@/components/escola/SchoolDataCard";
import { StatusFooter } from "@/components/escola/StatusFooter";

const POLL_MS = 30_000;

export default function StatusEscolaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useSchool(id);

  useEffect(() => {
    if (!data?.school || data.school.status !== "pending_approval") return;
    const interval = window.setInterval(() => void refetch(), POLL_MS);
    return () => window.clearInterval(interval);
  }, [data?.school, refetch]);

  if (!id) return <Navigate to="/minhas-escolas" replace />;

  if (isLoading) {
    return (
      <PageShell>
        <LoadingSkeleton />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <ErrorState onRetry={() => void refetch()} />
      </PageShell>
    );
  }

  if (!data?.school) {
    return (
      <PageShell>
        <NotFoundState onBack={() => navigate("/minhas-escolas")} />
      </PageShell>
    );
  }

  const school = data.school;

  return (
    <PageShell>
      <header className="flex items-center justify-between gap-4">
        <Link
          to="/minhas-escolas"
          className="inline-flex items-center gap-2 text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Minhas escolas
        </Link>
      </header>

      <div className="mt-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-lc-ink">
          {school.trade_name}
        </h1>
        <div className="mt-2">
          <StatusBadge status={school.status} size="md" />
        </div>
      </div>

      <section className="mt-8 rounded-2xl bg-lc-white border border-lc-border p-5 md:p-6">
        <h2 className="text-base font-bold text-lc-ink">Status do cadastro</h2>
        <div className="mt-4">
          <StatusTimeline school={school} />
        </div>
      </section>

      <SchoolDataCard school={school} />
      <StatusFooter school={school} />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex-1 mx-auto px-5 md:px-8 py-8 md:py-12 w-full max-w-[480px] md:max-w-[720px]">
        {children}
      </main>

      <Footer />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="h-6 w-40 rounded-md bg-lc-border/60 animate-pulse" />
      <div className="h-32 rounded-2xl bg-lc-border/60 animate-pulse" />
      <div className="h-48 rounded-2xl bg-lc-border/60 animate-pulse" />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-extrabold text-lc-ink">
        Não conseguimos carregar agora.
      </h2>
      <p className="mt-2 text-sm text-lc-mid">Tente novamente em instantes.</p>
      <button
        onClick={() => {
          onRetry();
          toast("Tentando de novo...");
        }}
        className="mt-6 h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-all"
      >
        <Loader2 className="w-4 h-4" aria-hidden /> Tentar novamente
      </button>
    </div>
  );
}

function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-extrabold text-lc-ink">Escola não encontrada.</h2>
      <p className="mt-2 text-sm text-lc-mid">
        A escola pode não existir ou você não tem permissão para vê-la.
      </p>
      <button
        onClick={onBack}
        className="mt-6 h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
      >
        Ver minhas escolas
      </button>
    </div>
  );
}
