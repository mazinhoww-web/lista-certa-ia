// Filter controls for AdminEscolasPage. Status is multi-select via toggles
// (more legible than a real <select multiple> on mobile). Origin and
// institutional-email are simple selects.

import type { Database } from "@/integrations/supabase/types";
import type { QueueFilters as Filters } from "@/hooks/useAdminSchoolsQueue";

type SchoolStatus = Database["public"]["Enums"]["school_status"];

const STATUS_OPTIONS: { value: SchoolStatus; label: string }[] = [
  { value: "pending_approval", label: "Em análise" },
  { value: "approved", label: "Aprovadas" },
  { value: "rejected", label: "Rejeitadas" },
  { value: "suspended", label: "Suspensas" },
];

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
}

export function QueueFilters({ value, onChange }: Props) {
  const selectedStatuses = value.statuses ?? [];

  const toggleStatus = (status: SchoolStatus) => {
    const set = new Set(selectedStatuses);
    if (set.has(status)) set.delete(status);
    else set.add(status);
    onChange({ ...value, statuses: Array.from(set) });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-lc-mid">
          Status
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const active = selectedStatuses.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleStatus(opt.value)}
                aria-pressed={active}
                className={`h-9 px-3 rounded-full border text-xs font-semibold transition-all ${
                  active
                    ? "bg-lc-blue text-white border-lc-blue"
                    : "bg-lc-white text-lc-ink border-lc-border hover:bg-lc-surface"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="filter-origin"
            className="block text-xs font-semibold uppercase tracking-wider text-lc-mid"
          >
            Origem
          </label>
          <select
            id="filter-origin"
            value={value.origin ?? "all"}
            onChange={(e) =>
              onChange({ ...value, origin: e.target.value as Filters["origin"] })
            }
            className="mt-1 w-full h-10 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          >
            <option value="all">Todas</option>
            <option value="inep">Vindas do INEP</option>
            <option value="manual">Cadastro manual</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="filter-email"
            className="block text-xs font-semibold uppercase tracking-wider text-lc-mid"
          >
            Email
          </label>
          <select
            id="filter-email"
            value={value.institutionalEmail ?? "all"}
            onChange={(e) =>
              onChange({
                ...value,
                institutionalEmail: e.target.value as Filters["institutionalEmail"],
              })
            }
            className="mt-1 w-full h-10 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          >
            <option value="all">Todos</option>
            <option value="yes">Institucional</option>
            <option value="no">Pessoal</option>
          </select>
        </div>
      </div>
    </div>
  );
}
