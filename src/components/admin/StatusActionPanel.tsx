// Contextual action buttons for the admin detail page. The visible buttons
// depend on the school's current status; reason-required transitions
// (reject, suspend) open a modal for the operator to type the rationale.
//
// All transitions go through useChangeSchoolStatus (RPC). Concurrent edits
// are detected by the RPC's "already in status X" exception, surfaced here
// as a toast asking the operator to refresh.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useChangeSchoolStatus } from "@/hooks/useChangeSchoolStatus";
import type { Database } from "@/integrations/supabase/types";

type SchoolStatus = Database["public"]["Enums"]["school_status"];

interface Props {
  schoolId: string;
  status: SchoolStatus;
}

const reasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Descreva o motivo (mínimo 10 caracteres)")
    .max(500),
});
type ReasonForm = z.infer<typeof reasonSchema>;

interface PendingTransition {
  toStatus: SchoolStatus;
  title: string;
  description: string;
}

export function StatusActionPanel({ schoolId, status }: Props) {
  const mutation = useChangeSchoolStatus();
  const [pending, setPending] = useState<PendingTransition | null>(null);

  const submitDirect = (toStatus: SchoolStatus) => {
    mutation.mutate(
      { schoolId, toStatus },
      {
        onSuccess: () => toast.success(SUCCESS_COPY[toStatus]),
        onError: (err) => toast.error(friendlyError(err)),
      },
    );
  };

  const submitWithReason = (toStatus: SchoolStatus, reason: string) => {
    mutation.mutate(
      { schoolId, toStatus, reason },
      {
        onSuccess: () => {
          toast.success(SUCCESS_COPY[toStatus]);
          setPending(null);
        },
        onError: (err) => toast.error(friendlyError(err)),
      },
    );
  };

  return (
    <section className="rounded-2xl bg-lc-white border border-lc-border p-5 md:p-6">
      <h2 className="text-base font-bold text-lc-ink">Ações</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {status === "pending_approval" && (
          <>
            <button
              type="button"
              onClick={() => submitDirect("approved")}
              disabled={mutation.isPending}
              className="h-11 px-5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {mutation.isPending && mutation.variables?.toStatus === "approved"
                ? "Aprovando..."
                : "Aprovar"}
            </button>
            <button
              type="button"
              onClick={() =>
                setPending({
                  toStatus: "rejected",
                  title: "Rejeitar escola",
                  description: "Explique o motivo. O cadastrante verá esse texto.",
                })
              }
              className="h-11 px-5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-all"
            >
              Rejeitar
            </button>
          </>
        )}

        {status === "approved" && (
          <button
            type="button"
            onClick={() =>
              setPending({
                toStatus: "suspended",
                title: "Suspender escola",
                description: "Por que esta escola está sendo suspensa?",
              })
            }
            className="h-11 px-5 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-800 transition-all"
          >
            Suspender
          </button>
        )}

        {status === "rejected" && (
          <button
            type="button"
            onClick={() => submitDirect("pending_approval")}
            disabled={mutation.isPending}
            className="h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            Reanalisar
          </button>
        )}

        {status === "suspended" && (
          <button
            type="button"
            onClick={() => submitDirect("approved")}
            disabled={mutation.isPending}
            className="h-11 px-5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            Reativar
          </button>
        )}
      </div>

      {pending && (
        <ReasonDialog
          pending={pending}
          isPending={mutation.isPending}
          onClose={() => setPending(null)}
          onSubmit={(reason) => submitWithReason(pending.toStatus, reason)}
        />
      )}
    </section>
  );
}

function ReasonDialog({
  pending,
  isPending,
  onClose,
  onSubmit,
}: {
  pending: PendingTransition;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const form = useForm<ReasonForm>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "" },
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pending.title}</DialogTitle>
          <DialogDescription>{pending.description}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) => onSubmit(v.reason.trim()))}
          className="space-y-4 mt-2"
        >
          <div>
            <label htmlFor="reason" className="sr-only">
              Motivo
            </label>
            <textarea
              id="reason"
              {...form.register("reason")}
              rows={4}
              maxLength={500}
              className="w-full rounded-xl border border-lc-border bg-lc-white p-3 text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
              placeholder="Ex.: CNPJ não encontrado na Receita Federal."
              autoFocus
            />
            {form.formState.errors.reason && (
              <p className="mt-1 text-xs text-lc-coral">
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold hover:bg-lc-surface transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              Confirmar
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const SUCCESS_COPY: Record<SchoolStatus, string> = {
  pending_approval: "Escola enviada para reanálise.",
  approved: "Escola aprovada.",
  rejected: "Escola rejeitada.",
  suspended: "Escola suspensa.",
};

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("already in status")) {
    return "Esta escola já foi atualizada por outro admin. Atualize a página.";
  }
  if (msg.includes("forbidden")) {
    return "Você não tem permissão para essa ação.";
  }
  return "Não conseguimos completar agora. Tente novamente.";
}
