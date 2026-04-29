// /meus-alunos — hub of the parent's active students. Empty state pushes
// to /meus-alunos/novo. Cards include progress + soft-delete trigger.

import { Link } from "react-router-dom";
import { Loader2, Plus, Users } from "lucide-react";
import { useMyStudents } from "@/hooks/useMyStudents";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { StudentCard } from "@/components/aluno/StudentCard";

export default function MeusAlunosPage() {
  const { data, isLoading, error, refetch } = useMyStudents();

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex-1 mx-auto px-5 md:px-8 py-8 md:py-12 w-full max-w-[480px] md:max-w-[720px]">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-lc-ink">
          Meus alunos
        </h1>
        <p className="mt-2 text-sm text-lc-mid">
          Acompanhe a lista de cada filho e marque o que já tem em casa.
        </p>

        {isLoading && <Skeletons />}
        {!isLoading && error && (
          <div className="mt-12 text-center">
            <p className="text-sm text-lc-mid">
              Não conseguimos carregar agora. Tente em instantes.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-all"
            >
              <Loader2 className="w-4 h-4" aria-hidden /> Tentar novamente
            </button>
          </div>
        )}
        {!isLoading && !error && (data ?? []).length === 0 && <EmptyState />}
        {!isLoading && !error && (data ?? []).length > 0 && (
          <>
            <ul className="mt-8 space-y-3">
              {(data ?? []).map((row) => (
                <li key={row.id ?? Math.random()}>
                  <StudentCard row={row} />
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                to="/meus-alunos/novo"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold hover:bg-lc-surface transition-all"
              >
                <Plus className="w-4 h-4" aria-hidden />
                Cadastrar outro filho
              </Link>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Skeletons() {
  return (
    <ul className="mt-8 space-y-3" aria-hidden>
      {[0, 1].map((i) => (
        <li key={i} className="h-32 rounded-2xl bg-lc-border/60 animate-pulse" />
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 text-center">
      <Users className="w-14 h-14 text-lc-mid/60 mx-auto" aria-hidden />
      <p className="mt-4 text-base text-lc-ink">
        Você ainda não cadastrou nenhum filho.
      </p>
      <Link
        to="/meus-alunos/novo"
        className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
      >
        <Plus className="w-4 h-4" aria-hidden />
        Cadastrar meu primeiro filho
      </Link>
    </div>
  );
}
