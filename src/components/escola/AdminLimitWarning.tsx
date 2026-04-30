// LC-002.5: aviso suave quando a escola se aproxima do limite hard de
// 5 admins. Exibido a partir de 4 admins ativos. Mensagem pt-BR direta.

import { AlertTriangle } from "lucide-react";

interface Props {
  count: number;
  max: number;
}

export function AdminLimitWarning({ count, max }: Props) {
  if (count < 4) return null;
  const atLimit = count >= max;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 flex items-start gap-2">
      <AlertTriangle
        className="w-4 h-4 text-amber-700 mt-0.5 shrink-0"
        aria-hidden
      />
      <p className="text-xs text-amber-900 leading-snug">
        {atLimit ? (
          <>
            <span className="font-semibold">Limite atingido.</span> Esta escola
            já tem {max} administradores. Para convidar outra pessoa, remova
            um dos atuais antes.
          </>
        ) : (
          <>
            Você está em <span className="font-semibold">{count} de {max}</span>{" "}
            administradores. Atingindo {max}, novos convites ficam bloqueados.
          </>
        )}
      </p>
    </div>
  );
}
