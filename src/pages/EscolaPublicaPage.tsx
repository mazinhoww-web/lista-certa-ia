// /escola/:slug — public school profile. Anon-accessible. Lists shown
// here are the published_at-DESC subset already filtered by the hook.

import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePublicSchool } from "@/hooks/usePublicSchool";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { PublicSchoolHeader } from "@/components/escola-publica/PublicSchoolHeader";
import { PublicListCard } from "@/components/escola-publica/PublicListCard";

export default function EscolaPublicaPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = usePublicSchool(slug);

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
        {isLoading && <LoadingSkeleton />}
        {!isLoading && (error || !data?.school) && <NotFoundState />}
        {!isLoading && data?.school && (
          <>
            <PublicSchoolHeader school={data.school} />

            <section className="mt-10">
              <h2 className="text-base font-bold text-lc-ink">
                Listas oficiais publicadas
              </h2>
              {data.publishedLists.length === 0 ? (
                <p className="mt-3 text-sm text-lc-mid">
                  Esta escola ainda não publicou listas pro ano letivo. Volte em
                  breve.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.publishedLists.map((list) => (
                    <li key={list.id}>
                      <PublicListCard
                        schoolSlug={data.school.slug}
                        list={list}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-12 rounded-2xl bg-lc-white border border-lc-border p-5 text-sm text-lc-mid">
              Você é responsável por esta escola?{" "}
              <Link
                to="/escola/cadastrar"
                className="text-lc-blue font-semibold hover:underline"
              >
                Cadastrar minha escola
              </Link>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="h-8 w-64 rounded-md bg-lc-border/60 animate-pulse" />
      <div className="h-32 rounded-2xl bg-lc-border/60 animate-pulse" />
      <div className="h-24 rounded-2xl bg-lc-border/60 animate-pulse" />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-extrabold text-lc-ink">
        Escola não encontrada.
      </h1>
      <p className="mt-2 text-sm text-lc-mid">
        Pode ser que ela não esteja aprovada ainda na plataforma.
      </p>
      <Link
        to="/buscar"
        className="mt-6 inline-flex h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold items-center justify-center hover:opacity-90 transition-all"
      >
        Voltar para a busca
      </Link>
    </div>
  );
}
