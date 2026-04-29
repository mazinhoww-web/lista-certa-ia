// Status-conditional footer block used by StatusEscolaPage. Pure component.
// pending  → discreet "verificando atualizações" indicator
// approved → green celebration card
// rejected → amber card with rejected_reason and "cadastrar nova escola" CTA
// suspended → grey support contact card

import { Link } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type School = Database["public"]["Tables"]["schools"]["Row"];

export function StatusFooter({ school }: { school: School }) {
  if (school.status === "pending_approval") {
    return (
      <section className="mt-6 text-center text-sm text-lc-mid">
        <p>Você será avisado por email assim que sua escola for aprovada.</p>
        <p className="mt-2 text-xs inline-flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
          Verificando atualizações...
        </p>
      </section>
    );
  }

  if (school.status === "approved") {
    return (
      <section className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center">
        <p className="text-sm font-semibold text-emerald-800">
          Sua escola está aprovada!
        </p>
        <p className="mt-1 text-xs text-emerald-700">
          Publique as listas de material das suas turmas.
        </p>
        <Link
          to={`/escola/${school.id}/listas`}
          className="mt-4 inline-flex h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold items-center justify-center hover:opacity-90 transition-all"
        >
          Gerenciar listas
        </Link>
      </section>
    );
  }

  if (school.status === "rejected") {
    return (
      <section className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-5">
        <p className="text-sm font-semibold text-amber-900">Motivo da decisão</p>
        <p className="mt-1 text-sm text-amber-900/90">
          {school.rejected_reason ?? "Não informado"}
        </p>
        <Link
          to="/escola/cadastrar"
          className="mt-4 inline-flex h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold items-center justify-center hover:opacity-90 transition-all"
        >
          Cadastrar nova escola
        </Link>
      </section>
    );
  }

  // suspended
  return (
    <section className="mt-6 rounded-2xl bg-slate-100 border border-slate-200 p-5 text-center">
      <p className="text-sm font-semibold text-slate-800">Acesso suspenso</p>
      <p className="mt-1 text-sm text-slate-700">
        Entre em contato com o suporte para mais informações.
      </p>
      <a
        href="mailto:suporte@listacerta.app"
        className="mt-4 inline-flex h-11 px-5 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold items-center justify-center gap-2 hover:bg-lc-surface transition-all"
      >
        <Mail className="w-4 h-4" aria-hidden />
        suporte@listacerta.app
      </a>
    </section>
  );
}
