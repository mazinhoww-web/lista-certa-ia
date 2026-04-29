// /escola/:id/listas — gestão das listas da escola. school_admin ou
// platform_admin only (via RLS). Empty state pushes to /listas/nova.

import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, Plus } from "lucide-react";
import { useSchool } from "@/hooks/useSchool";
import { useSchoolLists, type SchoolListSummary } from "@/hooks/useSchoolLists";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import type { Database } from "@/integrations/supabase/types";

type ListStatus = Database["public"]["Enums"]["list_status"];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
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

function statusLabel(status: ListStatus, pending: boolean): string {
  if (pending) return "Aguardando digitalização";
  if (status === "published") return "Publicada";
  if (status === "archived") return "Arquivada";
  return "Rascunho";
}

function statusClasses(status: ListStatus, pending: boolean): string {
  if (pending) return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "published")
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "archived")
    return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-lc-blue/10 text-lc-blue border-lc-blue/20";
}

export default function EscolaListasPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const schoolQ = useSchool(id);
  const lists = useSchoolLists(id);

  if (!id) {
    navigate("/minhas-escolas", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex-1 mx-auto px-5 md:px-8 py-8 md:py-12 w-full max-w-[480px] md:max-w-[720px]">
        <Link
          to={`/escola/${id}/status`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden /> Voltar
        </Link>

        <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-lc-ink">
          Listas de material
        </h1>
        {schoolQ.data?.school && (
          <p className="mt-2 text-sm text-lc-mid">
            {schoolQ.data.school.trade_name}
          </p>
        )}

        {lists.isLoading && <Skeletons />}
        {!lists.isLoading && lists.error && (
          <div className="mt-12 text-center">
            <p className="text-sm text-lc-mid">
              Não conseguimos carregar as listas agora.
            </p>
            <button
              type="button"
              onClick={() => void lists.refetch()}
              className="mt-4 h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-all"
            >
              <Loader2 className="w-4 h-4" aria-hidden /> Tentar novamente
            </button>
          </div>
        )}
        {!lists.isLoading && !lists.error && (lists.data ?? []).length === 0 && (
          <EmptyState schoolId={id} />
        )}
        {!lists.isLoading && !lists.error && (lists.data ?? []).length > 0 && (
          <>
            <ul className="mt-8 space-y-3">
              {(lists.data ?? []).map((row) => (
                <li key={row.id}>
                  <ListCard schoolId={id} row={row} />
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                to={`/escola/${id}/listas/nova`}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
              >
                <Plus className="w-4 h-4" aria-hidden />
                Nova lista
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
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-24 rounded-2xl bg-lc-border/60 animate-pulse" />
      ))}
    </ul>
  );
}

function EmptyState({ schoolId }: { schoolId: string }) {
  return (
    <div className="mt-12 text-center">
      <FileText className="w-14 h-14 text-lc-mid/60 mx-auto" aria-hidden />
      <p className="mt-4 text-base text-lc-ink">
        Nenhuma lista publicada ainda.
      </p>
      <Link
        to={`/escola/${schoolId}/listas/nova`}
        className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
      >
        <Plus className="w-4 h-4" aria-hidden />
        Criar primeira lista
      </Link>
    </div>
  );
}

function ListCard({
  schoolId,
  row,
}: {
  schoolId: string;
  row: SchoolListSummary;
}) {
  const pending = row.pending_manual_digitization;
  return (
    <Link
      to={`/escola/${schoolId}/listas/${row.id}`}
      className="block rounded-2xl bg-lc-white border border-lc-border p-5 hover:shadow-lc-md hover:border-lc-mid/40 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-bold text-lc-ink truncate">
            {row.grade}
            {row.teacher_name && (
              <span className="text-lc-mid font-normal"> · {row.teacher_name}</span>
            )}
          </div>
          <div className="text-sm text-lc-mid mt-0.5">
            Ano letivo {row.school_year} · {row.items_count} item
            {row.items_count === 1 ? "" : "s"}
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${statusClasses(row.status, pending)}`}
        >
          {statusLabel(row.status, pending)}
        </span>
      </div>
      <div className="mt-3 text-xs text-lc-mid">
        Criada em {formatDate(row.created_at)}
        {row.published_at && ` · publicada em ${formatDate(row.published_at)}`}
      </div>
    </Link>
  );
}
