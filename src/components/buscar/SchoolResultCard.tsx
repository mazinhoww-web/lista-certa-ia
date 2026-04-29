// One school in the search results list. Click navigates to the public
// school page by slug. Pills carry the two signals visible to a parent:
// how many lists are available right now, and whether the school
// presented an institutional contact email (as a soft trust signal).

import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import type { SchoolSearchResult } from "@/hooks/useSearchSchools";

export function SchoolResultCard({ row }: { row: SchoolSearchResult }) {
  const lists = row.published_lists_count;
  const listsLabel =
    lists === 0
      ? "Sem listas disponíveis"
      : lists === 1
        ? "1 lista disponível"
        : `${lists} listas disponíveis`;
  const listsClasses =
    lists > 0
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <Link
      to={`/escola/${row.slug}`}
      className="block rounded-2xl bg-lc-white border border-lc-border p-5 hover:shadow-lc-md hover:border-lc-mid/40 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold text-lc-ink truncate">
            {row.trade_name}
          </div>
          <div className="text-sm text-lc-mid mt-0.5">
            {row.city} · {row.state}
            {row.neighborhood ? ` · ${row.neighborhood}` : ""}
          </div>
        </div>
        {row.email_likely_institutional && (
          <span
            className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold"
            title="Contato institucional verificado"
          >
            <CheckCircle2 className="w-3 h-3" aria-hidden />
            Validada
          </span>
        )}
      </div>
      <div className="mt-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${listsClasses}`}
        >
          {listsLabel}
        </span>
      </div>
    </Link>
  );
}
