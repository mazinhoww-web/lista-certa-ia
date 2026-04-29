// Vertical history of status changes for one school. Each entry shows the
// transition (from → to), who made it, when, and the reason if any.

import { ArrowRight } from "lucide-react";
import type { SchoolStatusLogEntry } from "@/hooks/useSchoolStatusLog";
import type { Database } from "@/integrations/supabase/types";

type SchoolStatus = Database["public"]["Enums"]["school_status"];

const STATUS_LABEL: Record<SchoolStatus, string> = {
  pending_approval: "Em análise",
  approved: "Aprovada",
  rejected: "Não aprovada",
  suspended: "Suspensa",
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

interface Props {
  entries: SchoolStatusLogEntry[];
  isLoading: boolean;
}

export function StatusLogTimeline({ entries, isLoading }: Props) {
  if (isLoading) {
    return (
      <ul className="space-y-3" aria-hidden>
        {[0, 1].map((i) => (
          <li key={i} className="h-14 rounded-xl bg-lc-border/60 animate-pulse" />
        ))}
      </ul>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-lc-mid">Nenhuma alteração registrada ainda.</p>
    );
  }

  return (
    <ol className="relative" aria-label="Histórico de status">
      {entries.map((entry, idx) => {
        const isLast = idx === entries.length - 1;
        const actor = entry.changed_by_profile?.full_name ?? "—";
        return (
          <li key={entry.id} className="relative pl-8 pb-5 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[10px] top-6 bottom-0 w-px bg-slate-200"
              />
            )}
            <span
              aria-hidden
              className="absolute left-0 top-1.5 inline-block w-5 h-5 rounded-full bg-lc-blue/15 border-2 border-lc-blue"
            />
            <div className="text-sm font-semibold text-lc-ink inline-flex items-center gap-2">
              {entry.from_status ? STATUS_LABEL[entry.from_status] : "—"}
              <ArrowRight className="w-3.5 h-3.5 text-lc-mid" aria-hidden />
              {STATUS_LABEL[entry.to_status]}
            </div>
            <div className="text-xs text-lc-mid mt-0.5">
              {actor} · {formatWhen(entry.changed_at)}
            </div>
            {entry.reason && (
              <p className="mt-1 text-xs text-lc-ink/80 bg-lc-surface rounded-lg px-3 py-2">
                {entry.reason}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
