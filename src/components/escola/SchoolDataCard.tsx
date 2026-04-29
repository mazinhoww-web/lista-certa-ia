// "Dados da escola" card used by StatusEscolaPage. Pure presentational.

import type { Database } from "@/integrations/supabase/types";

type School = Database["public"]["Tables"]["schools"]["Row"];

export function SchoolDataCard({ school }: { school: School }) {
  const fullAddress = [school.address, school.neighborhood]
    .filter(Boolean)
    .join(" — ");
  const cityState = `${school.city} / ${school.state}`;
  const showLegalName =
    school.legal_name && school.legal_name !== school.trade_name;

  return (
    <section className="mt-6 rounded-2xl bg-lc-white border border-lc-border p-5 md:p-6">
      <h2 className="text-base font-bold text-lc-ink">Dados da escola</h2>
      <dl className="mt-4 space-y-4 text-sm">
        <Field label="Nome fantasia" value={school.trade_name} />
        {showLegalName && <Field label="Razão social" value={school.legal_name} />}
        {school.inep_code ? (
          <Field label="INEP" value={school.inep_code} />
        ) : school.manually_added ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-lc-mid">
              Origem
            </dt>
            <dd className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-lc-coral/10 text-lc-coral text-xs font-semibold">
                Cadastro manual
              </span>
            </dd>
          </div>
        ) : null}
        <Field label="CNPJ" value={school.cnpj ?? "Não informado"} />
        <Field
          label="Endereço"
          value={`${fullAddress || "—"}\n${school.cep ?? ""} ${cityState}`.trim()}
        />
        <Field label="Telefone" value={school.phone ?? "—"} />
        <Field label="Email institucional" value={school.email ?? "—"} />
      </dl>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-lc-mid">
        {label}
      </dt>
      <dd className="mt-1 text-base text-lc-ink whitespace-pre-line">{value}</dd>
    </div>
  );
}
