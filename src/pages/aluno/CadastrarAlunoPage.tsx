// /meus-alunos/novo — cadastro de aluno. Two-step UX:
//   1. StudentForm collects first_name + school + grade + teacher.
//   2. ParentalConsentModal presents the term + checkbox; on accept we
//      call register_student and route based on the result:
//        - list_id present → /meus-alunos/:id/lista
//        - requires_list_selection → /meus-alunos/:id/lista (page renders
//          a ListSelectionPrompt when the student has no list_id)
//
// Optional query params (deep-link from the public list page):
//   ?school_id=<uuid>&grade=<text>&teacher=<text>

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { StudentForm, type StudentFormPayload } from "@/components/aluno/StudentForm";
import { ParentalConsentModal } from "@/components/aluno/ParentalConsentModal";
import { useRegisterStudent } from "@/hooks/useRegisterStudent";

export default function CadastrarAlunoPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const register = useRegisterStudent();
  const [pending, setPending] = useState<StudentFormPayload | null>(null);

  const onSubmitForm = (payload: StudentFormPayload) => {
    setPending(payload);
  };

  const onAcceptConsent = (consentVersion: string) => {
    if (!pending) return;
    register.mutate(
      {
        firstName: pending.firstName,
        schoolId: pending.schoolId,
        grade: pending.grade,
        teacherName: pending.teacherName,
        consentVersion,
      },
      {
        onSuccess: (result) => {
          toast.success("Aluno cadastrado.");
          // Always route to the student's list view; if no list is
          // attached yet, that page renders ListSelectionPrompt.
          navigate(`/meus-alunos/${result.id}/lista`, { replace: true });
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("school not found or not approved")) {
            toast.error("Essa escola não está disponível para cadastro.");
          } else if (msg.includes("invalid first_name")) {
            toast.error("Nome inválido.");
          } else {
            toast.error("Não conseguimos cadastrar agora. Tente em instantes.");
          }
          setPending(null);
        },
      },
    );
  };

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
          <ArrowLeft className="w-4 h-4" aria-hidden /> Voltar
        </Link>

        <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-lc-ink">
          Cadastrar aluno
        </h1>
        <p className="mt-2 text-sm text-lc-mid">
          Coletamos apenas dados necessários para personalizar a lista. Você
          pode solicitar exclusão a qualquer momento.
        </p>

        <section className="mt-8 rounded-2xl bg-lc-white border border-lc-border p-5 md:p-6">
          <StudentForm
            defaultSchoolId={params.get("school_id") ?? ""}
            defaultGrade={params.get("grade") ?? ""}
            defaultTeacher={params.get("teacher") ?? ""}
            pending={register.isPending}
            onSubmit={onSubmitForm}
          />
        </section>
      </main>

      <Footer />

      <ParentalConsentModal
        open={!!pending}
        pending={register.isPending}
        onClose={() => {
          if (!register.isPending) setPending(null);
        }}
        onAccept={onAcceptConsent}
      />
    </div>
  );
}
