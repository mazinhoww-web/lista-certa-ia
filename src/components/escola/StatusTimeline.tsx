// Vertical 3-step timeline reflecting where a school sits in the approval
// pipeline. Pure component: receives the school row and renders. No data
// fetching, no side effects.
//
// Step 1: cadastro recebido — always complete (created_at).
// Step 2: análise — in-progress when pending_approval, complete otherwise.
// Step 3: decisão final — branches by status:
//   approved   → complete, label "Escola aprovada", subtitle approved_at.
//   rejected   → complete, label "Não aprovada", subtitle rejected_reason.
//   suspended  → complete, label "Acesso suspenso", suporte CTA subtitle.
//   pending    → pending grey, label "Aguardando análise", "até 48h" sub.

import { Check } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type School = Database["public"]["Tables"]["schools"]["Row"];

interface Step {
  label: string;
  subtitle: string;
  state: "complete" | "in_progress" | "pending";
}

function formatDate(iso: string | null | undefined): string {
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

function buildSteps(school: School): Step[] {
  const cadastro: Step = {
    label: "Cadastro recebido",
    subtitle: formatDate(school.created_at),
    state: "complete",
  };

  const analise: Step = {
    label: "Em análise pelo time ListaCerta",
    subtitle:
      school.status === "pending_approval"
        ? "Acontecendo agora"
        : "Concluída",
    state: school.status === "pending_approval" ? "in_progress" : "complete",
  };

  let decisao: Step;
  switch (school.status) {
    case "approved":
      decisao = {
        label: "Escola aprovada",
        subtitle: formatDate(school.approved_at),
        state: "complete",
      };
      break;
    case "rejected":
      decisao = {
        label: "Não aprovada",
        subtitle: school.rejected_reason ?? "Motivo não informado",
        state: "complete",
      };
      break;
    case "suspended":
      decisao = {
        label: "Acesso suspenso",
        subtitle: "Entre em contato com o suporte.",
        state: "complete",
      };
      break;
    case "pending_approval":
    default:
      decisao = {
        label: "Aguardando análise",
        subtitle: "Geralmente em até 48h.",
        state: "pending",
      };
      break;
  }

  return [cadastro, analise, decisao];
}

function dotClass(state: Step["state"]): string {
  if (state === "complete") return "bg-emerald-500 text-white";
  if (state === "in_progress") return "bg-amber-500 text-white animate-pulse";
  return "bg-slate-300 text-slate-500";
}

export function StatusTimeline({ school }: { school: School }) {
  const steps = buildSteps(school);

  return (
    <ol className="relative" aria-label="Status do cadastro">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <li key={idx} className="relative pl-10 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[14px] top-7 bottom-0 w-px bg-slate-200"
              />
            )}
            <span
              aria-hidden
              className={`absolute left-0 top-0 inline-flex w-7 h-7 items-center justify-center rounded-full ${dotClass(step.state)}`}
            >
              {step.state === "complete" && <Check className="w-4 h-4" />}
            </span>
            <div className="text-sm font-semibold text-lc-ink leading-tight">
              {step.label}
            </div>
            <div className="text-xs text-lc-mid mt-0.5">{step.subtitle}</div>
          </li>
        );
      })}
    </ol>
  );
}
