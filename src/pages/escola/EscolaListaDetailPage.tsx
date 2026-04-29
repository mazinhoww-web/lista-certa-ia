// /escola/:id/listas/:listId — single list detail. Renders meta + items
// table-style and surfaces the only mutations the operator should run from
// here: publish (draft → published, with auto-archive of prior published)
// and archive (any status → archived).

import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useList } from "@/hooks/useList";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { ListActionsCard } from "@/components/escola/listas/ListActionsCard";
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

function statusLabel(s: ListStatus, pending: boolean): string {
  if (pending) return "Aguardando digitalização";
  if (s === "published") return "Publicada";
  if (s === "archived") return "Arquivada";
  return "Rascunho";
}

function statusClasses(s: ListStatus, pending: boolean): string {
  if (pending) return "bg-amber-100 text-amber-800 border-amber-200";
  if (s === "published")
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (s === "archived")
    return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-lc-blue/10 text-lc-blue border-lc-blue/20";
}

export default function EscolaListaDetailPage() {
  const { id, listId } = useParams<{ id: string; listId: string }>();
  const navigate = useNavigate();
  const listQ = useList(listId);

  if (!id || !listId) {
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
          to={`/escola/${id}/listas`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden /> Voltar para listas
        </Link>

        {listQ.isLoading && (
          <div className="mt-8 space-y-4" aria-hidden>
            <div className="h-8 w-64 rounded-md bg-lc-border/60 animate-pulse" />
            <div className="h-32 rounded-2xl bg-lc-border/60 animate-pulse" />
          </div>
        )}

        {!listQ.isLoading && (listQ.error || !listQ.data?.list) && (
          <div className="mt-12 text-center">
            <h1 className="text-2xl font-extrabold text-lc-ink">
              Lista não encontrada.
            </h1>
            <Link
              to={`/escola/${id}/listas`}
              className="mt-6 inline-flex h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold items-center justify-center hover:opacity-90 transition-all"
            >
              Voltar para listas
            </Link>
          </div>
        )}

        {!listQ.isLoading && listQ.data?.list && (
          <>
            <h1 className="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight text-lc-ink">
              {listQ.data.list.grade}
              {listQ.data.list.teacher_name && (
                <span className="text-lc-mid font-normal">
                  {" "}· {listQ.data.list.teacher_name}
                </span>
              )}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-lc-mid">
              <span>Ano letivo {listQ.data.list.school_year}</span>
              <span aria-hidden>·</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${statusClasses(listQ.data.list.status, listQ.data.list.pending_manual_digitization)}`}
              >
                {statusLabel(
                  listQ.data.list.status,
                  listQ.data.list.pending_manual_digitization,
                )}
              </span>
            </div>

            <section className="mt-8 rounded-2xl bg-lc-white border border-lc-border p-5 md:p-6">
              <h2 className="text-base font-bold text-lc-ink">
                Itens ({listQ.data.items.length})
              </h2>
              {listQ.data.items.length === 0 ? (
                <p className="mt-3 text-sm text-lc-mid italic">
                  {listQ.data.list.pending_manual_digitization
                    ? "Aguardando digitalização do PDF."
                    : "Nenhum item nesta lista ainda."}
                </p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {listQ.data.items.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-lc-surface text-lc-mid text-xs font-semibold">
                        {it.position}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lc-ink">
                          {it.quantity}
                          {it.unit ? ` ${it.unit}` : "x"} · {it.name}
                        </div>
                        {it.specification && (
                          <div className="text-xs text-lc-mid">
                            {it.specification}
                          </div>
                        )}
                        {it.notes && (
                          <div className="text-xs text-lc-mid italic">
                            {it.notes}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="mt-6 rounded-2xl bg-lc-white border border-lc-border p-5 md:p-6">
              <h2 className="text-base font-bold text-lc-ink">Datas</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="font-semibold text-lc-mid w-32 shrink-0">
                    Criada em
                  </dt>
                  <dd className="text-lc-ink">
                    {formatDate(listQ.data.list.created_at)}
                  </dd>
                </div>
                {listQ.data.list.published_at && (
                  <div className="flex gap-2">
                    <dt className="font-semibold text-lc-mid w-32 shrink-0">
                      Publicada em
                    </dt>
                    <dd className="text-lc-ink">
                      {formatDate(listQ.data.list.published_at)}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            <div className="mt-6">
              <ListActionsCard
                schoolId={id}
                listId={listId}
                status={listQ.data.list.status}
                pendingManualDigitization={
                  listQ.data.list.pending_manual_digitization
                }
              />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
