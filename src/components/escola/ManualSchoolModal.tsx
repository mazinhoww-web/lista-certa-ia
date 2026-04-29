// Triggered from SchoolAutocomplete when the operator clicks
// "Não encontrei minha escola". Captures the minimal fields we still need
// (trade_name, uf, city) and returns them up so CadastrarEscolaPage can
// hydrate the form as if the row had come from the INEP base — but with
// inep_code=null and manually_added=true.

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export interface ManualSchoolPayload {
  trade_name: string;
  uf: string;
  city: string;
}

interface Props {
  open: boolean;
  defaultUf: string;
  onClose: () => void;
  onConfirm: (payload: ManualSchoolPayload) => void;
}

export function ManualSchoolModal({ open, defaultUf, onClose, onConfirm }: Props) {
  const [tradeName, setTradeName] = useState("");
  const [uf, setUf] = useState(defaultUf);
  const [city, setCity] = useState("");

  const canSubmit = tradeName.trim().length >= 3 && uf.length === 2 && city.trim().length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm({
      trade_name: tradeName.trim(),
      uf,
      city: city.trim(),
    });
    setTradeName("");
    setCity("");
    setUf(defaultUf);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar escola manualmente</DialogTitle>
          <DialogDescription>
            Sua escola será cadastrada e ficará pendente de aprovação.
            Você pode prosseguir e completar o cadastro normalmente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label htmlFor="manual-trade-name" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
              Nome da escola
            </label>
            <input
              id="manual-trade-name"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              placeholder="Ex.: Colégio São Pedro"
              maxLength={200}
              className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="manual-uf" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
                UF
              </label>
              <select
                id="manual-uf"
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
              >
                {BR_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label htmlFor="manual-city" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
                Cidade
              </label>
              <input
                id="manual-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cuiabá"
                className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold hover:bg-lc-surface transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Continuar
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
