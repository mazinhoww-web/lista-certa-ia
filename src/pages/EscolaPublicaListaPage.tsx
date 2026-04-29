// /escola/:slug/lista/:listId — public list view. Renders PublicListView.
// When the visitor is authenticated and has at least one active student
// linked to this list, surfaces a "Vendo lista para: [Nome]" picker so
// the toggle "já tenho em casa" appears interactively. Visitors without
// a matching student see a CTA to cadastrar nesse contexto.

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicList } from "@/hooks/usePublicList";
import { useMyStudents } from "@/hooks/useMyStudents";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { PublicListView } from "@/components/escola-publica/PublicListView";

export default function EscolaPublicaListaPage() {
  const { slug, listId } = useParams<{ slug: string; listId: string }>();
  const { data, isLoading, error } = usePublicList(slug, listId);
  const { user } = useAuth();
  const myStudents = useMyStudents();

  // Students that match this list. We also keep "students at this school"
  // separately so we can hint the deep-link to /meus-alunos/novo when
  // none match this specific list_id but the family has someone here.
  const studentsForList = useMemo(() => {
    if (!user || !listId || !myStudents.data) return [];
    return myStudents.data.filter((s) => s.list_id === listId);
  }, [user, listId, myStudents.data]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  useEffect(() => {
    if (studentsForList.length > 0 && !selectedStudentId) {
      setSelectedStudentId(studentsForList[0]?.id ?? "");
    }
    if (studentsForList.length === 0 && selectedStudentId) {
      setSelectedStudentId("");
    }
  }, [studentsForList, selectedStudentId]);

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
          <>
            {user && studentsForList.length > 0 && (
              <div className="mb-6 rounded-2xl bg-lc-white border border-lc-border p-4 flex flex-wrap items-center gap-3">
                <label
                  htmlFor="student-picker"
                  className="text-xs font-semibold uppercase tracking-wider text-lc-mid"
                >
                  Vendo lista para
                </label>
                <select
                  id="student-picker"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
                >
                  {studentsForList.map((s) => (
                    <option key={s.id ?? "—"} value={s.id ?? ""}>
                      {s.first_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {user && studentsForList.length === 0 && !myStudents.isLoading && (
              <div className="mb-6 rounded-2xl bg-lc-white border border-lc-border p-5">
                <p className="text-sm text-lc-ink font-semibold">
                  É a lista do seu filho?
                </p>
                <p className="mt-1 text-sm text-lc-mid">
                  Cadastre o aluno para marcar itens "já tenho em casa".
                </p>
                <Link
                  to={`/meus-alunos/novo?school_id=${data.school.id}&grade=${encodeURIComponent(data.list.grade)}${data.list.teacher_name ? `&teacher=${encodeURIComponent(data.list.teacher_name)}` : ""}`}
                  className="mt-4 inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
                >
                  <UserPlus className="w-4 h-4" aria-hidden />
                  Cadastrar meu filho pra esta lista
                </Link>
              </div>
            )}

            <PublicListView
              school={data.school}
              list={data.list}
              items={data.items}
              studentId={selectedStudentId || undefined}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
