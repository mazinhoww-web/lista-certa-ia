// One student in the parent's hub. Surface name + school link + grade +
// progress bar + "Ver lista" CTA + a soft-delete trigger that opens a
// confirmation dialog. PII: nothing logged.

import { useState } from "react";
import { Link } from "react-router-dom";
import { ListChecks, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSoftDeleteStudent } from "@/hooks/useSoftDeleteStudent";
import type { MyStudentRow } from "@/hooks/useMyStudents";

function progressPct(owned: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((owned / total) * 100));
}

export function StudentCard({ row }: { row: MyStudentRow }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const del = useSoftDeleteStudent();

  if (!row.id) return null;

  const owned = row.owned_items ?? 0;
  const total = row.total_items ?? 0;
  const pct = progressPct(owned, total);

  const onConfirmDelete = () => {
    del.mutate(row.id!, {
      onSuccess: () => {
        toast.success("Aluno será removido em até 90 dias.");
        setConfirmOpen(false);
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("already removed")) {
          toast.error("Esse aluno já foi removido.");
        } else {
          toast.error("Não conseguimos remover agora. Tente em instantes.");
        }
      },
    });
  };

  return (
    <article className="rounded-2xl bg-lc-white border border-lc-border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold text-lc-ink truncate">
            {row.first_name ?? "—"}
          </div>
          <div className="text-sm text-lc-mid mt-0.5">
            {row.school_slug && row.school_trade_name ? (
              <Link
                to={`/escola/${row.school_slug}`}
                className="hover:text-lc-ink transition-colors"
              >
                {row.school_trade_name}
              </Link>
            ) : (
              row.school_trade_name ?? "—"
            )}
            {row.grade ? ` · ${row.grade}` : ""}
            {row.teacher_name ? ` · ${row.teacher_name}` : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label="Remover aluno"
          className="text-lc-mid hover:text-lc-coral transition-colors"
        >
          <Trash2 className="w-4 h-4" aria-hidden />
        </button>
      </div>

      {row.list_id ? (
        <>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-lc-mid mb-1.5">
              <span>{owned} de {total} itens adquiridos</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-lc-surface overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${pct}%` }}
                aria-hidden
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to={`/meus-alunos/${row.id}/lista`}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-lc-blue text-white text-xs font-semibold hover:opacity-90 transition-all"
            >
              <ListChecks className="w-4 h-4" aria-hidden />
              Ver lista de {row.first_name ?? "aluno"}
            </Link>
            <Link
              to={`/meus-alunos/${row.id}/carrinho`}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-xs font-semibold hover:bg-lc-surface transition-all"
            >
              <ShoppingCart className="w-4 h-4" aria-hidden />
              Ver carrinho
            </Link>
          </div>
        </>
      ) : (
        <p className="mt-4 text-xs text-lc-mid">
          Sem lista vinculada — abra o detalhe pra escolher.
        </p>
      )}

      <Dialog open={confirmOpen} onOpenChange={(v) => !v && setConfirmOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover {row.first_name ?? "aluno"}?</DialogTitle>
            <DialogDescription>
              Os dados serão removidos da sua conta imediatamente e excluídos em
              até 90 dias por necessidade técnica de auditoria.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={del.isPending}
              className="h-11 px-5 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold hover:bg-lc-surface transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={del.isPending}
              className="h-11 px-5 rounded-xl bg-lc-coral text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all"
            >
              Remover
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
