// Pill that visually encodes a school's pending/approved/rejected/suspended
// status. Pure component; consumers pass the schema enum value verbatim.

import { CheckCircle2, Clock, PauseCircle, XCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["school_status"];

interface Props {
  status: Status;
  size?: "sm" | "md";
}

const STYLES: Record<
  Status,
  { label: string; classes: string; Icon: typeof Clock }
> = {
  pending_approval: {
    label: "Em análise",
    classes: "bg-amber-100 text-amber-800 border-amber-200",
    Icon: Clock,
  },
  approved: {
    label: "Aprovada",
    classes: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Icon: CheckCircle2,
  },
  rejected: {
    label: "Não aprovada",
    classes: "bg-rose-100 text-rose-800 border-rose-200",
    Icon: XCircle,
  },
  suspended: {
    label: "Suspensa",
    classes: "bg-slate-100 text-slate-700 border-slate-200",
    Icon: PauseCircle,
  },
};

export function StatusBadge({ status, size = "sm" }: Props) {
  const cfg = STYLES[status];
  const dimensions =
    size === "md"
      ? "px-3 py-1 text-sm gap-2"
      : "px-2.5 py-0.5 text-xs gap-1.5";
  const iconSize = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${dimensions} ${cfg.classes}`}
    >
      <cfg.Icon className={iconSize} aria-hidden />
      {cfg.label}
    </span>
  );
}
