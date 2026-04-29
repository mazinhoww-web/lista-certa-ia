// Compact card representing one school in the admin queue. Click → detail.
// Visualizes the priority_score the view computes (0–3) so the admin can
// scan and prioritize without reading the rationale every time.

import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/escola/StatusBadge";
import type { AdminQueueRow } from "@/hooks/useAdminSchoolsQueue";
import type { Database } from "@/integrations/supabase/types";

type SchoolStatus = Database["public"]["Enums"]["school_status"];

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days > 0) return days === 1 ? "há 1 dia" : `há ${days} dias`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours > 0) return hours === 1 ? "há 1 hora" : `há ${hours} horas`;
  return "agora há pouco";
}

function PriorityBars({ score }: { score: number }) {
  // 0 = green, 1 = amber, 2-3 = red. Three slots so the visual encodes
  // ordering at a glance.
  return (
    <div
      className="inline-flex gap-0.5"
      aria-label={`Prioridade ${score} de 3`}
      title={`Prioridade ${score}/3`}
    >
      {[1, 2, 3].map((slot) => {
        const filled = slot <= score;
        const tone =
          score >= 2
            ? "bg-rose-400"
            : score === 1
              ? "bg-amber-400"
              : "bg-emerald-400";
        return (
          <span
            key={slot}
            className={`block w-3 h-1.5 rounded-full ${
              filled ? tone : "bg-lc-border"
            }`}
          />
        );
      })}
    </div>
  );
}

export function SchoolQueueRow({ row }: { row: AdminQueueRow }) {
  // The view exposes nullable variants of every column; the underlying
  // schools rows always have these populated. Defensive narrowing.
  const id = row.id ?? "";
  const tradeName = row.trade_name ?? "—";
  const city = row.city ?? "—";
  const state = row.state ?? "";
  const status = (row.status ?? "pending_approval") as SchoolStatus;
  const isManual = !!row.manually_added;
  const personalEmail = row.email_likely_institutional === false;
  const score = row.priority_score ?? 0;

  if (!id) return null;

  return (
    <Link
      to={`/admin/escolas/${id}`}
      className="block rounded-2xl bg-lc-white border border-lc-border p-5 hover:shadow-lc-md hover:border-lc-mid/40 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-bold text-lc-ink truncate">
            {tradeName}
          </div>
          <div className="text-sm text-lc-mid mt-0.5">
            {city} · {state}
          </div>
        </div>
        <div className="shrink-0">
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-lc-mid">
        <PriorityBars score={score} />
        <span aria-hidden>·</span>
        <span>{timeAgo(row.created_at)}</span>
        {isManual && (
          <>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-lc-coral/10 text-lc-coral font-semibold">
              Manual
            </span>
          </>
        )}
        {personalEmail && (
          <>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
              Email pessoal
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
