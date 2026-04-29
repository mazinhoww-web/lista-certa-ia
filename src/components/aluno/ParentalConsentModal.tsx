// Modal that displays the parental consent text and gates the actual
// student creation behind an explicit checkbox. The text + version live
// in src/lib/parental-consent (placeholder; revision tracked by TD-10).

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CURRENT_CONSENT_VERSION,
  PARENTAL_CONSENT_TEXT,
} from "@/lib/parental-consent";

interface Props {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onAccept: (consentVersion: string) => void;
}

export function ParentalConsentModal({
  open,
  pending,
  onClose,
  onAccept,
}: Props) {
  const [agreed, setAgreed] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          setAgreed(false);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Consentimento parental</DialogTitle>
          <DialogDescription>
            Antes de cadastrar, leia o termo abaixo. Você pode solicitar
            exclusão a qualquer momento.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-lc-border bg-lc-surface p-4 text-xs leading-relaxed text-lc-ink whitespace-pre-line">
          {PARENTAL_CONSENT_TEXT}
        </div>

        <label className="mt-4 flex items-start gap-3 cursor-pointer text-sm text-lc-ink">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-lc-blue"
          />
          <span>
            Confirmo que sou responsável legal pelo menor cadastrado e li o
            termo acima.
          </span>
        </label>

        <DialogFooter>
          <button
            type="button"
            onClick={() => {
              setAgreed(false);
              onClose();
            }}
            disabled={pending}
            className="h-11 px-5 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold hover:bg-lc-surface disabled:opacity-60 transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!agreed || pending}
            onClick={() => onAccept(CURRENT_CONSENT_VERSION)}
            className="h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
            Aceitar e cadastrar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
