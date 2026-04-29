// Hub showing every school the operator administers. Empty state pushes
// toward /escola/cadastrar; populated state lists clickable cards ordered
// newest-first by school_admins.created_at.

import { Link } from "react-router-dom";
import { Plus, School as SchoolIcon } from "lucide-react";
import { useMySchools, type MySchoolLink } from "@/hooks/useMySchools";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { StatusBadge } from "@/components/escola/StatusBadge";

const ROLE_LABELS: Record<MySchoolLink["role"], string> = {
  admin: "Administradora",
  editor: "Editora",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function MinhasEscolasPage() {
  const { data, isLoading, error, refetch } = useMySchools();

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex-1 mx-auto px-5 md:px-8 py-8 md:py-12 w-full max-w-[480px] md:max-w-[720px]">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-lc-ink">
          Minhas escolas
        </h1>
        <p className="mt-2 text-sm text-lc-mid leading-relaxed">
          Acompanhe o status de cada escola que você administra.
        </p>

        {isLoading && <Skeletons />}
        {!isLoading && error && <ErrorState onRetry={() => void refetch()} />}
        {!isLoading && !error && (data ?? []).length === 0 && <EmptyState />}
        {!isLoading && !error && (data ?? []).length > 0 && (
          <>
            <ul className="mt-8 space-y-3">
              {(data ?? []).map((row) => (
                <li key={row.school.id}>
                  <SchoolCard row={row} />
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                to="/escola/cadastrar"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold hover:bg-lc-surface transition-all"
              >
                <Plus className="w-4 h-4" aria-hidden />
                Cadastrar outra escola
              </Link>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function SchoolCard({ row }: { row: MySchoolLink }) {
  const { school, role, joined_at } = row;
  return (
    <Link
      to={`/escola/${school.id}/status`}
      className="block rounded-2xl bg-lc-white border border-lc-border p-5 hover:shadow-lc-md hover:border-lc-mid/40 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-bold text-lc-ink truncate">
            {school.trade_name}
          </div>
          <div className="text-sm text-lc-mid mt-0.5">
            {school.city} · {school.state}
          </div>
        </div>
        <div className="shrink-0">
          <StatusBadge status={school.status} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-lc-mid">
        <span>Cadastrada em {formatDate(joined_at)}</span>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-lc-surface border border-lc-border text-lc-mid font-semibold">
          {ROLE_LABELS[role] ?? "Administradora"}
        </span>
      </div>
    </Link>
  );
}

function Skeletons() {
  return (
    <ul className="mt-8 space-y-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="h-28 rounded-2xl bg-lc-border/60 animate-pulse"
        />
      ))}
    </ul>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-12 text-center">
      <h2 className="text-xl font-extrabold text-lc-ink">
        Não conseguimos carregar suas escolas.
      </h2>
      <p className="mt-2 text-sm text-lc-mid">Tente novamente em instantes.</p>
      <button
        onClick={onRetry}
        className="mt-4 h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 text-center">
      <SchoolIcon className="w-14 h-14 text-lc-mid/60 mx-auto" aria-hidden />
      <p className="mt-4 text-base text-lc-ink">
        Você ainda não administra nenhuma escola.
      </p>
      <Link
        to="/escola/cadastrar"
        className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
      >
        <Plus className="w-4 h-4" aria-hidden />
        Cadastrar minha primeira escola
      </Link>
    </div>
  );
}
