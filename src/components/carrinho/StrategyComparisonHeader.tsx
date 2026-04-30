// Header bar above the 3-strategy grid. Shows the student first name +
// school context + a refresh button. The refresh CTA is the only place
// the parent can force a re-fetch of cart_strategies (besides invalidating
// the cache via TTL).
//
// PII NOTE: first_name appears in the rendered DOM (intentional — it's
// the parent's own data, visible only in their authenticated session).
// Logs MUST NOT include first_name; only the page DOM may.

import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  studentFirstName: string;
  schoolName: string | null;
  listGrade: string | null;
  generatedAt: string | null;
  onRefresh: () => void;
  refreshing: boolean;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "agora há pouco";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "há 1 hora" : `há ${hours} horas`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
}

export function StrategyComparisonHeader({
  studentFirstName,
  schoolName,
  listGrade,
  generatedAt,
  onRefresh,
  refreshing,
}: Props) {
  return (
    <header className="mb-6">
      <Link
        to="/meus-alunos"
        className="inline-flex items-center gap-2 text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden /> Meus alunos
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-lc-ink">
            Carrinho de {studentFirstName}
          </h1>
          <p className="mt-1 text-sm text-lc-mid">
            {schoolName ?? "—"}
            {listGrade ? ` · ${listGrade}` : ""}
          </p>
          {generatedAt && (
            <p className="mt-1 text-xs text-lc-mid">
              Preços atualizados {formatRelative(generatedAt)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="h-10 px-4 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold inline-flex items-center gap-2 hover:bg-lc-surface disabled:opacity-60 transition-all"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="w-4 h-4" aria-hidden />
          )}
          Atualizar
        </button>
      </div>
    </header>
  );
}
