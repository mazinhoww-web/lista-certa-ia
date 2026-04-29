// Header for /escola/:slug — name + address + contact + a "Validada Procon"
// placeholder that we'll wire to real validation in Phase 5.

import { Building2, Mail, Phone, ShieldCheck } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type School = Database["public"]["Tables"]["schools"]["Row"];

function buildAddress(s: School): string {
  const parts = [
    s.address,
    s.neighborhood ? `Bairro ${s.neighborhood}` : null,
    `${s.city}/${s.state}`,
    s.cep ? `CEP ${s.cep}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function PublicSchoolHeader({ school }: { school: School }) {
  const address = buildAddress(school);
  return (
    <header>
      <div className="flex items-start gap-3">
        <Building2 className="w-6 h-6 text-lc-mid mt-1.5 shrink-0" aria-hidden />
        <div className="min-w-0">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-lc-ink">
            {school.trade_name}
          </h1>
          <p className="mt-2 text-sm text-lc-mid">{address}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-lc-mid">
        {school.phone && (
          <span className="inline-flex items-center gap-1.5">
            <Phone className="w-4 h-4" aria-hidden />
            {school.phone}
          </span>
        )}
        {school.email && (
          <span className="inline-flex items-center gap-1.5">
            <Mail className="w-4 h-4" aria-hidden />
            {school.email}
          </span>
        )}
      </div>

      <div className="mt-4">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
          title="Validador automático em desenvolvimento (Phase 5)"
        >
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
          Validada Procon
        </span>
      </div>
    </header>
  );
}
