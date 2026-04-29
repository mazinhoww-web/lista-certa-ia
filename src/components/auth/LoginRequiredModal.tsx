// Pops up when an unauthenticated user clicks an action that requires
// auth (compartilhar, baixar PDF). Triggers the same Google OAuth flow
// LoginPage uses, but stays on the current public page so the user can
// resume the action right after returning.

import { useState } from "react";
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
import { lovable } from "@/integrations/lovable";

const POST_LOGIN_KEY = "lc_post_login_redirect";

interface Props {
  open: boolean;
  reason: string;
  onClose: () => void;
}

export function LoginRequiredModal({ open, reason, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  const onGoogle = async () => {
    setLoading(true);
    // Resume on the current public page after Google round-trip.
    sessionStorage.setItem(
      POST_LOGIN_KEY,
      window.location.pathname + window.location.search,
    );
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Algo nao saiu como esperado. Tenta de novo?");
      return;
    }
    if (result.redirected) {
      // Browser is navigating to Google.
      return;
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Faça login pra continuar</DialogTitle>
          <DialogDescription>{reason}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 px-5 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold hover:bg-lc-surface transition-all disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onGoogle}
            disabled={loading}
            className="h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
            Continuar com Google
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
