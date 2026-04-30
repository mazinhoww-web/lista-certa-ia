// LC-002.5: modal de geração de link de convite. Fluxo:
//   1. Aberto → dispara create_admin_invite e mostra spinner.
//   2. Sucesso → mostra URL absoluta + botão "Copiar" + share WhatsApp.
//   3. Erro → mensagem pt-BR + retry.
//
// O link é gerado uma vez por abertura. Fechar e reabrir gera um novo
// (não há "ver invites pendentes" no MVP — TD-37).

import { useEffect, useState } from "react";
import { Copy, MessageCircle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateAdminInvite } from "@/hooks/useCreateAdminInvite";
import { inviteUrl } from "@/lib/inviteUrl";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  schoolName: string;
}

export function InviteAdminModal({
  open,
  onOpenChange,
  schoolId,
  schoolName,
}: Props) {
  const create = useCreateAdminInvite(schoolId);
  const [link, setLink] = useState<string | null>(null);

  // Reset state on close so reabrindo gera novo link.
  useEffect(() => {
    if (!open) {
      setLink(null);
      create.reset();
    }
  }, [open, create]);

  // Gera o link na primeira abertura.
  useEffect(() => {
    if (!open || link || create.isPending || create.isError) return;
    create.mutate(undefined, {
      onSuccess: (data) => setLink(inviteUrl(data.token)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  };

  const whatsappHref = link
    ? `https://wa.me/?text=${encodeURIComponent(
        `Você foi convidado para administrar ${schoolName} no ListaCerta. Clique para aceitar (válido por 48h): ${link}`,
      )}`
    : "#";

  const onRetry = () => {
    setLink(null);
    create.reset();
    create.mutate(undefined, {
      onSuccess: (data) => setLink(inviteUrl(data.token)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar novo admin</DialogTitle>
          <DialogDescription>
            Compartilhe este link. Quem aceitar passa a administrar{" "}
            <span className="font-semibold">{schoolName}</span>. O link
            expira em 48h.
          </DialogDescription>
        </DialogHeader>

        {create.isPending && !link && (
          <div className="py-6 flex items-center justify-center gap-2 text-sm text-lc-mid">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            Gerando link…
          </div>
        )}

        {create.isError && !link && (
          <div className="py-4 space-y-3">
            <p className="text-sm text-lc-coral">
              {create.error?.message ?? "Não foi possível gerar o link."}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden />
              Tentar novamente
            </button>
          </div>
        )}

        {link && (
          <div className="space-y-3">
            <div className="rounded-xl border border-lc-border bg-lc-surface p-3 flex items-center gap-2">
              <code className="flex-1 text-xs text-lc-ink break-all font-mono">
                {link}
              </code>
              <button
                type="button"
                onClick={onCopy}
                aria-label="Copiar link"
                className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-lc-white border border-lc-border text-lc-ink hover:bg-lc-surface transition-all"
              >
                <Copy className="w-4 h-4" aria-hidden />
              </button>
            </div>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-xl bg-lc-emerald text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90"
            >
              <MessageCircle className="w-4 h-4" aria-hidden />
              Compartilhar no WhatsApp
            </a>

            <p className="text-[11px] text-lc-mid leading-snug">
              Quem clicar precisa estar logado para aceitar. O link funciona
              uma vez só e vence em 48h.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
