// Debounced autocomplete over the public.search_inep_schools RPC.
// Mobile-first, keyboard-accessible (combobox role + ↑↓/Enter/Esc),
// emits onSelect when an INEP row is picked, or onManualAdd when the
// "Não encontrei minha escola" footer link is clicked.

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const DEBOUNCE_MS = 300;
const MIN_QUERY = 3;
const RESULT_LIMIT = 12;

export interface InepSearchResult {
  inep_code: string;
  trade_name: string;
  city: string;
  uf: string;
  address: string | null;
  cep: string | null;
}

interface Props {
  uf: string | null;
  cityFilter?: string | null;
  onSelect: (result: InepSearchResult) => void;
  onManualAdd: () => void;
}

export function SchoolAutocomplete({ uf, cityFilter, onSelect, onManualAdd }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InepSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const listboxId = useId();
  const requestSeq = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const seq = ++requestSeq.current;
    const timer = window.setTimeout(async () => {
      const { data, error } = await supabase.rpc("search_inep_schools", {
        q: trimmed,
        uf_filter: uf ?? undefined,
        city_filter: cityFilter ?? undefined,
        limit_n: RESULT_LIMIT,
      });

      // Drop stale responses (later input invalidated this one).
      if (seq !== requestSeq.current) return;

      if (error) {
        console.error("[autocomplete] rpc failed", { message: error.message });
        toast.error("Não conseguimos buscar escolas agora. Tente de novo.");
        setResults([]);
        setLoading(false);
        return;
      }

      const rows = (data ?? []).map((r) => ({
        inep_code: r.inep_code,
        trade_name: r.trade_name,
        city: r.city,
        uf: r.uf,
        address: r.address ?? null,
        cep: r.cep ?? null,
      }));
      setResults(rows);
      setHighlightedIdx(rows.length > 0 ? 0 : -1);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, uf, cityFilter]);

  const handlePick = (item: InepSearchResult) => {
    onSelect(item);
    setQuery(item.trade_name);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlightedIdx >= 0) {
      e.preventDefault();
      const picked = results[highlightedIdx];
      if (picked) handlePick(picked);
    }
  };

  const showDropdown = open && query.trim().length >= MIN_QUERY;
  const showEmpty = showDropdown && !loading && results.length === 0;

  return (
    <div className="relative" role="combobox" aria-expanded={showDropdown} aria-owns={listboxId} aria-haspopup="listbox">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lc-mid"
          aria-hidden
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="Digite o nome da escola"
          className="w-full h-12 pl-10 pr-10 rounded-xl border border-lc-border bg-lc-white text-lc-ink text-sm placeholder:text-lc-mid focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20 transition-colors"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={highlightedIdx >= 0 ? `${listboxId}-${highlightedIdx}` : undefined}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lc-mid animate-spin" aria-hidden />
        )}
      </div>

      {showDropdown && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-xl border border-lc-border bg-lc-white shadow-lc-md z-20"
        >
          {results.map((r, idx) => (
            <li
              key={r.inep_code}
              id={`${listboxId}-${idx}`}
              role="option"
              aria-selected={idx === highlightedIdx}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handlePick(r)}
              onMouseEnter={() => setHighlightedIdx(idx)}
              className={`px-4 py-3 cursor-pointer text-sm transition-colors ${
                idx === highlightedIdx ? "bg-lc-surface" : "hover:bg-lc-surface"
              }`}
            >
              <div className="font-semibold text-lc-ink">{r.trade_name}</div>
              <div className="text-xs text-lc-mid mt-0.5">
                {r.city} · {r.uf}
              </div>
            </li>
          ))}

          {showEmpty && (
            <li className="px-4 py-6 text-sm text-lc-mid text-center">
              Nenhuma escola encontrada para “{query.trim()}”.
            </li>
          )}

          <li
            className="px-4 py-3 border-t border-lc-border bg-lc-surface text-sm text-lc-blue font-semibold cursor-pointer hover:bg-lc-surface/70 sticky bottom-0"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setOpen(false);
              onManualAdd();
            }}
          >
            Não encontrei minha escola
          </li>
        </ul>
      )}
    </div>
  );
}
