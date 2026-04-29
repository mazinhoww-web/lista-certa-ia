// Owns the school search experience: UF select, optional CEP-derived city
// filter, autocomplete, and the "manual add" modal. Bubbles a chosen school
// up to the parent through two callbacks so the cadastro form can hydrate.

import { useState } from "react";
import { lookupCep } from "@/lib/cep";
import {
  SchoolAutocomplete,
  type InepSearchResult,
} from "@/components/escola/SchoolAutocomplete";
import {
  ManualSchoolModal,
  type ManualSchoolPayload,
} from "@/components/escola/ManualSchoolModal";

const UF_OPTIONS = [
  "MT", "SP", "MG", "RJ", "BA", "PR", "RS", "SC", "GO", "DF", "PE", "CE",
];

interface Props {
  defaultUf: string;
  onInepSelect: (r: InepSearchResult) => void;
  onManualConfirm: (p: ManualSchoolPayload) => void;
}

export function SchoolPickerSection({ defaultUf, onInepSelect, onManualConfirm }: Props) {
  const [searchUf, setSearchUf] = useState(defaultUf);
  const [byCep, setByCep] = useState(false);
  const [searchCep, setSearchCep] = useState("");
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const onCepFilterBlur = async () => {
    const cleaned = searchCep.replace(/\D/g, "");
    if (cleaned.length !== 8) {
      setCityFilter(null);
      return;
    }
    const r = await lookupCep(cleaned);
    setCityFilter(r?.city ?? null);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={searchUf}
          onChange={(e) => setSearchUf(e.target.value)}
          aria-label="Filtrar por UF"
          className="h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
        >
          {UF_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setByCep((v) => !v);
            setCityFilter(null);
            setSearchCep("");
          }}
          className={`h-11 px-3 rounded-xl border text-sm font-semibold transition-all ${
            byCep
              ? "bg-lc-blue text-white border-lc-blue"
              : "bg-lc-white border-lc-border text-lc-ink hover:bg-lc-surface"
          }`}
          aria-pressed={byCep}
        >
          Buscar por CEP
        </button>
        {byCep && (
          <input
            type="text"
            inputMode="numeric"
            placeholder="CEP da região"
            value={searchCep}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "").slice(0, 8);
              setSearchCep(d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d);
            }}
            onBlur={onCepFilterBlur}
            className="h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          />
        )}
      </div>

      <div className="mt-4">
        <SchoolAutocomplete
          uf={searchUf}
          cityFilter={cityFilter}
          onSelect={onInepSelect}
          onManualAdd={() => setManualOpen(true)}
        />
      </div>

      <ManualSchoolModal
        open={manualOpen}
        defaultUf={searchUf}
        onClose={() => setManualOpen(false)}
        onConfirm={(p) => {
          onManualConfirm(p);
          setManualOpen(false);
        }}
      />
    </>
  );
}
