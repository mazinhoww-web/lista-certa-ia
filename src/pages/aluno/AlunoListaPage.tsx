// /meus-alunos/:studentId/lista — interactive list view scoped to one
// student. Shows the student's name + school context in the header,
// then re-uses PublicListView in interactive mode (studentId prop) so
// the toggle "já tenho em casa" appears per item.
//
// PII: never log first_name. Always student.id.

import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useStudent } from "@/hooks/useStudent";
import { useList } from "@/hooks/useList";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { PublicListView } from "@/components/escola-publica/PublicListView";
import { ListSelectionPrompt } from "@/components/aluno/ListSelectionPrompt";

export default function AlunoListaPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const studentQ = useStudent(studentId);
  // Pull the list (with items) only when the student has a list_id.
  const listQ = useList(studentQ.data?.list_id ?? undefined);

  if (!studentId) {
    navigate("/meus-alunos", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex-1 mx-auto px-5 md:px-8 py-8 md:py-12 w-full max-w-[480px] md:max-w-[720px]">
        <Link
          to="/meus-alunos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden /> Meus alunos
        </Link>

        {studentQ.isLoading && <LoadingSkeleton />}

        {!studentQ.isLoading && (studentQ.error || !studentQ.data) && (
          <RemovedState onBack={() => navigate("/meus-alunos")} />
        )}

        {!studentQ.isLoading && studentQ.data && (
          <>
            <header className="mt-4">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-lc-ink">
                Lista de {studentQ.data.first_name}
              </h1>
              <p className="mt-2 text-sm text-lc-mid">
                {studentQ.data.school_trade_name ?? "—"}
                {studentQ.data.grade ? ` · ${studentQ.data.grade}` : ""}
                {studentQ.data.teacher_name ? ` · ${studentQ.data.teacher_name}` : ""}
              </p>
            </header>

            {!studentQ.data.list_id && studentQ.data.school_id && studentQ.data.grade && (
              <div className="mt-8">
                <ListSelectionPrompt
                  studentId={studentQ.data.id!}
                  schoolId={studentQ.data.school_id}
                  grade={studentQ.data.grade}
                  teacherName={studentQ.data.teacher_name}
                  studentFirstName={studentQ.data.first_name ?? ""}
                  onLinked={() => void listQ.refetch()}
                />
              </div>
            )}

            {studentQ.data.list_id && (
              <div className="mt-8">
                {listQ.isLoading && (
                  <p className="text-sm text-lc-mid inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    Carregando lista...
                  </p>
                )}
                {!listQ.isLoading && (listQ.error || !listQ.data?.list) && (
                  <UnavailableListState />
                )}
                {!listQ.isLoading && listQ.data?.list && (
                  <PublicListView
                    school={
                      // Synthesize a minimal School row for the header link.
                      // school_trade_name + school_slug are denormalized in
                      // the my_students_with_progress view.
                      {
                        id: studentQ.data.school_id ?? "",
                        trade_name: studentQ.data.school_trade_name ?? "—",
                        slug: studentQ.data.school_slug ?? "",
                        // Other fields aren't read by PublicListView's header.
                        legal_name: studentQ.data.school_trade_name ?? "—",
                        city: "",
                        state: "",
                        status: "approved",
                        cep: null,
                        cnpj: null,
                        address: null,
                        approved_at: null,
                        approved_by: null,
                        email: null,
                        email_likely_institutional: false,
                        inep_code: null,
                        latitude: null,
                        longitude: null,
                        manually_added: false,
                        neighborhood: null,
                        phone: null,
                        rejected_reason: null,
                        updated_at: null,
                        website: null,
                        created_at: null,
                        created_by: null,
                      }
                    }
                    list={listQ.data.list}
                    items={listQ.data.items}
                    studentId={studentQ.data.id ?? undefined}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-6 space-y-4" role="status" aria-live="polite">
      <div className="h-8 w-64 rounded-md bg-lc-border/60 animate-pulse" />
      <div className="h-48 rounded-2xl bg-lc-border/60 animate-pulse" />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

function RemovedState({ onBack }: { onBack: () => void }) {
  return (
    <div className="mt-12 text-center">
      <h1 className="text-2xl font-extrabold text-lc-ink">
        Este aluno foi removido.
      </h1>
      <p className="mt-2 text-sm text-lc-mid">
        Os dados serão excluídos definitivamente em até 90 dias.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
      >
        Voltar para meus alunos
      </button>
    </div>
  );
}

function UnavailableListState() {
  return (
    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
      <p className="text-sm font-semibold text-amber-900">
        Esta lista não está mais disponível.
      </p>
      <p className="mt-1 text-sm text-amber-900/90">
        A escola pode ter arquivado a lista. Volte em breve.
      </p>
    </div>
  );
}
