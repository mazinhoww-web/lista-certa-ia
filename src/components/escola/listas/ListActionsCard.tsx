// Publish + archive buttons for the list detail page. Surfaces the RPC
// "Lista sem itens não pode ser publicada" exception as a friendly toast.

import { Archive, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePublishList } from "@/hooks/usePublishList";
import { useArchiveList } from "@/hooks/useArchiveList";
import type { Database } from "@/integrations/supabase/types";

type ListStatus = Database["public"]["Enums"]["list_status"];

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Lista sem itens")) {
    return "Adicione pelo menos um item antes de publicar.";
  }
  if (msg.includes("only draft")) return "Só rascunhos podem ser publicados.";
  if (msg.includes("forbidden")) return "Você não tem permissão para essa ação.";
  return "Não conseguimos completar agora. Tente novamente.";
}

interface Props {
  schoolId: string;
  listId: string;
  status: ListStatus;
  pendingManualDigitization: boolean;
}

export function ListActionsCard({
  schoolId,
  listId,
  status,
  pendingManualDigitization,
}: Props) {
  const publish = usePublishList();
  const archive = useArchiveList();

  const canPublish = status === "draft" && !pendingManualDigitization;
  const canArchive = status !== "archived";

  if (!canPublish && !canArchive) return null;

  return (
    <section className="rounded-2xl bg-lc-white border border-lc-border p-5 md:p-6">
      <h2 className="text-base font-bold text-lc-ink">Ações</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {canPublish && (
          <button
            type="button"
            disabled={publish.isPending}
            onClick={() => {
              publish.mutate(
                { listId, schoolId },
                {
                  onSuccess: () => toast.success("Lista publicada."),
                  onError: (err) => toast.error(friendlyError(err)),
                },
              );
            }}
            className="h-11 px-5 rounded-xl bg-emerald-600 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {publish.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="w-4 h-4" aria-hidden />
            )}
            Publicar
          </button>
        )}
        {canArchive && (
          <button
            type="button"
            disabled={archive.isPending}
            onClick={() => {
              archive.mutate(
                { listId, schoolId },
                {
                  onSuccess: () => toast.success("Lista arquivada."),
                  onError: (err) => toast.error(friendlyError(err)),
                },
              );
            }}
            className="h-11 px-5 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold inline-flex items-center gap-2 hover:bg-lc-surface transition-all"
          >
            {archive.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <Archive className="w-4 h-4" aria-hidden />
            )}
            Arquivar
          </button>
        )}
      </div>
    </section>
  );
}
