// LC-002.5: row de admin na página /escola/:id/admins.
// Mostra avatar circular com inicial, nome (only first_name) ou "Você",
// data de entrada, e CTA de remoção/saída condicional.
//
// Self-removal e remoção de outro são visualmente distintos: rótulos
// "Sair" vs "Remover" e modal de confirmação com cópia diferente.

import { LogOut, MinusCircle } from "lucide-react";
import type { SchoolAdmin } from "@/hooks/useSchoolAdmins";

interface Props {
  admin: SchoolAdmin;
  isYou: boolean;
  isLastActiveAdmin: boolean;
  onRequestRemove: (admin: SchoolAdmin) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function AdminListCard({
  admin,
  isYou,
  isLastActiveAdmin,
  onRequestRemove,
}: Props) {
  const displayName = isYou ? "Você" : admin.first_name || "Admin";
  const initial = (admin.first_name?.[0] ?? "A").toUpperCase();
  const ctaLabel = isYou ? "Sair" : "Remover";
  const ctaIcon = isYou ? LogOut : MinusCircle;
  const Icon = ctaIcon;

  const removeDisabled = isYou && isLastActiveAdmin;

  return (
    <article className="rounded-2xl bg-lc-white border border-lc-border p-4 flex items-center gap-3">
      <div
        className="shrink-0 w-10 h-10 rounded-full bg-lc-blue/10 text-lc-blue inline-flex items-center justify-center font-bold text-sm"
        aria-hidden
      >
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-lc-ink truncate">
          {displayName}
        </p>
        <p className="text-xs text-lc-mid">
          Admin desde {formatDate(admin.joined_at)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onRequestRemove(admin)}
        disabled={removeDisabled}
        title={
          removeDisabled
            ? "Você é o único admin. Convide outra pessoa antes."
            : undefined
        }
        className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold transition-all ${
          removeDisabled
            ? "bg-lc-surface border border-lc-border text-lc-mid cursor-not-allowed"
            : "bg-lc-white border border-lc-border text-lc-ink hover:bg-lc-surface"
        }`}
      >
        <Icon className="w-3.5 h-3.5" aria-hidden />
        {ctaLabel}
      </button>
    </article>
  );
}
