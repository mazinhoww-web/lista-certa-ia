// /admin/escolas — fila de triagem do platform_admin. Default mostra só
// pending_approval (uso mais comum); o admin pode reabrir outros buckets
// pelo filtro de status.

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  useAdminSchoolsQueue,
  type QueueFilters as Filters,
} from "@/hooks/useAdminSchoolsQueue";
import { QueueFilters } from "@/components/admin/QueueFilters";
import { SchoolQueueRow } from "@/components/admin/SchoolQueueRow";

const DEFAULT_FILTERS: Filters = {
  statuses: ["pending_approval"],
  origin: "all",
  institutionalEmail: "all",
};

export default function AdminEscolasPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const { data, isLoading, error, refetch } = useAdminSchoolsQueue(filters);

  const counts = useMemo(() => {
    const list = data ?? [];
    return {
      total: list.length,
      pending: list.filter((r) => r.status === "pending_approval").length,
    };
  }, [data]);

  return (
    <div className="max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-lc-ink">
          Fila de aprovação
        </h1>
        <p className="mt-2 text-sm text-lc-mid">
          {isLoading
            ? "Carregando escolas..."
            : `${counts.total} escola${counts.total === 1 ? "" : "s"} no resultado · ${counts.pending} pendente${counts.pending === 1 ? "" : "s"}`}
        </p>
      </header>

      <section className="mt-6 rounded-2xl bg-lc-white border border-lc-border p-5">
        <QueueFilters value={filters} onChange={setFilters} />
      </section>

      <section className="mt-6">
        {isLoading && <Skeletons />}
        {!isLoading && error && (
          <div className="text-center py-12">
            <p className="text-sm text-lc-mid">
              Não conseguimos carregar a fila agora.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 inline-flex items-center gap-2 transition-all"
            >
              <Loader2 className="w-4 h-4" aria-hidden /> Tentar novamente
            </button>
          </div>
        )}
        {!isLoading && !error && (data ?? []).length === 0 && (
          <p className="text-center text-sm text-lc-mid py-12">
            Nenhuma escola na fila.
          </p>
        )}
        {!isLoading && !error && (data ?? []).length > 0 && (
          <ul className="space-y-3">
            {(data ?? []).map((row) => (
              <li key={row.id ?? Math.random()}>
                <SchoolQueueRow row={row} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Skeletons() {
  return (
    <ul className="space-y-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-28 rounded-2xl bg-lc-border/60 animate-pulse" />
      ))}
    </ul>
  );
}
