// /escola/:slug/lista/:listId — public list view. Renders PublicListView
// which already handles the auth-gated share/download actions.

import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePublicList } from "@/hooks/usePublicList";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { PublicListView } from "@/components/escola-publica/PublicListView";

export default function EscolaPublicaListaPage() {
  const { slug, listId } = useParams<{ slug: string; listId: string }>();
  const { data, isLoading, error } = usePublicList(slug, listId);

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center justify-between border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
        <Link
          to="/buscar"
          className="inline-flex items-center gap-2 text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Buscar
        </Link>
      </header>

      <main className="flex-1 mx-auto px-5 md:px-8 py-8 md:py-12 w-full max-w-[480px] md:max-w-[720px]">
        {isLoading && (
          <div className="space-y-4" role="status" aria-live="polite">
            <div className="h-8 w-64 rounded-md bg-lc-border/60 animate-pulse" />
            <div className="h-48 rounded-2xl bg-lc-border/60 animate-pulse" />
            <span className="sr-only">Carregando...</span>
          </div>
        )}
        {!isLoading && (error || !data) && (
          <div className="text-center py-12">
            <h1 className="text-2xl font-extrabold text-lc-ink">
              Lista não disponível.
            </h1>
            <p className="mt-2 text-sm text-lc-mid">
              A lista pode ter sido arquivada ou ainda não está publicada.
            </p>
            <Link
              to="/buscar"
              className="mt-6 inline-flex h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold items-center justify-center hover:opacity-90 transition-all"
            >
              Voltar para a busca
            </Link>
          </div>
        )}
        {!isLoading && data && (
          <PublicListView
            school={data.school}
            list={data.list}
            items={data.items}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
