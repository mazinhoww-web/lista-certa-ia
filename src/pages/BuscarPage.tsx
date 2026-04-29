// /buscar — public search of approved schools. Anon-accessible. Empty
// state offers popular-city quick links to scope the city filter.

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MapPin } from "lucide-react";
import {
  SEARCH_MIN_QUERY_LEN,
  useSearchSchools,
} from "@/hooks/useSearchSchools";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { SearchBar } from "@/components/buscar/SearchBar";
import { SchoolResultCard } from "@/components/buscar/SchoolResultCard";

const POPULAR_CITIES = ["Cuiabá", "Várzea Grande"];
const DEBOUNCE_MS = 300;

export default function BuscarPage() {
  const [q, setQ] = useState("");
  const [uf, setUf] = useState("MT");
  const [city, setCity] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [q]);

  const search = useSearchSchools({
    q: debouncedQ,
    uf: uf || null,
    city: city.trim() || null,
  });

  const trimmedQ = q.trim();
  const hasFilter = !!(uf || city.trim());
  const queryActive = trimmedQ.length >= SEARCH_MIN_QUERY_LEN || hasFilter;
  const tooShort = trimmedQ.length > 0 && trimmedQ.length < SEARCH_MIN_QUERY_LEN && !hasFilter;

  const results = useMemo(() => search.data ?? [], [search.data]);

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex-1 mx-auto px-5 md:px-8 py-8 md:py-12 w-full max-w-[480px] md:max-w-[720px]">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-lc-ink">
          Buscar escola
        </h1>
        <p className="mt-2 text-sm text-lc-mid">
          Encontre a escola do seu filho e veja as listas oficiais publicadas.
        </p>

        <div className="mt-6">
          <SearchBar
            q={q}
            uf={uf}
            city={city}
            onChange={(next) => {
              setQ(next.q);
              setUf(next.uf);
              setCity(next.city);
            }}
          />
        </div>

        {!queryActive && (
          <section className="mt-10">
            {tooShort ? (
              <p className="text-sm text-lc-mid">
                Digite pelo menos {SEARCH_MIN_QUERY_LEN} caracteres para buscar.
              </p>
            ) : (
              <>
                <p className="text-sm text-lc-mid">
                  Digite o nome da escola, cidade ou bairro pra começar.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {POPULAR_CITIES.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setCity(name)}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-lc-white border border-lc-border text-lc-ink text-xs font-semibold hover:bg-lc-surface transition-all"
                    >
                      <MapPin className="w-3.5 h-3.5" aria-hidden />
                      {name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {queryActive && search.isLoading && <Skeletons />}
        {queryActive && search.isError && (
          <ErrorState onRetry={() => void search.refetch()} />
        )}
        {queryActive && !search.isLoading && !search.isError && results.length === 0 && (
          <EmptyState />
        )}
        {queryActive && !search.isLoading && !search.isError && results.length > 0 && (
          <ul className="mt-8 space-y-3">
            {results.map((r) => (
              <li key={r.id}>
                <SchoolResultCard row={r} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Skeletons() {
  return (
    <ul className="mt-8 space-y-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-24 rounded-2xl bg-lc-border/60 animate-pulse" />
      ))}
    </ul>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-12 text-center">
      <p className="text-sm text-lc-mid">
        Não conseguimos buscar agora. Tente em instantes.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-all"
      >
        <Loader2 className="w-4 h-4" aria-hidden /> Tentar novamente
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 text-center">
      <p className="text-base text-lc-ink">Nenhuma escola encontrada.</p>
      <p className="mt-1 text-sm text-lc-mid">
        Talvez ela ainda não tenha publicado lista.
      </p>
      <Link
        to="/escola/cadastrar"
        className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold hover:bg-lc-surface transition-all"
      >
        Cadastrar escola
      </Link>
    </div>
  );
}
