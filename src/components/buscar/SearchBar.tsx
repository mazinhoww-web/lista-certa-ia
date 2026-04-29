// Public search input + UF/city filters. The parent page wires this to
// useSearchSchools with a 300ms debounce on `q`. Mobile-first: a single
// big input on top, filters in a 2-column grid below.

import { Search } from "lucide-react";

const UF_OPTIONS = [
  "MT", "SP", "MG", "RJ", "BA", "PR", "RS", "SC", "GO", "DF", "PE", "CE",
];

interface Props {
  q: string;
  uf: string;
  city: string;
  onChange: (next: { q: string; uf: string; city: string }) => void;
}

export function SearchBar({ q, uf, city, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-lc-mid"
          aria-hidden
        />
        <input
          type="search"
          value={q}
          onChange={(e) => onChange({ q: e.target.value, uf, city })}
          placeholder="Nome da escola, cidade ou bairro"
          aria-label="Buscar escola"
          className="w-full h-14 pl-12 pr-4 rounded-2xl border border-lc-border bg-lc-white text-base placeholder:text-lc-mid focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20 transition-colors"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label
            htmlFor="search-uf"
            className="block text-xs font-semibold uppercase tracking-wider text-lc-mid"
          >
            UF
          </label>
          <select
            id="search-uf"
            value={uf}
            onChange={(e) => onChange({ q, uf: e.target.value, city })}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          >
            <option value="">Todas</option>
            {UF_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label
            htmlFor="search-city"
            className="block text-xs font-semibold uppercase tracking-wider text-lc-mid"
          >
            Cidade
          </label>
          <input
            id="search-city"
            type="text"
            value={city}
            onChange={(e) => onChange({ q, uf, city: e.target.value })}
            placeholder="Ex.: Cuiabá"
            className="mt-1 w-full h-10 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          />
        </div>
      </div>
    </div>
  );
}
