// /escola/:id/listas/nova — manual list creation. Meta fields + items
// editor in single scroll. PDF upload modal is a sibling fallback in the
// header for schools that prefer to ship the PDF and wait.

import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSchool } from "@/hooks/useSchool";
import {
  useCreateList,
  type ListItemInput,
} from "@/hooks/useCreateList";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { ListMetaForm } from "@/components/escola/listas/ListMetaForm";
import { ListItemsEditor } from "@/components/escola/listas/ListItemsEditor";
import { PdfUploadModal } from "@/components/escola/listas/PdfUploadModal";
import { requiresTeacherName } from "@/lib/grade-levels";

const DEFAULT_YEAR = new Date().getFullYear() + 1;

interface MetaState {
  grade: string;
  schoolYear: number;
  teacherName: string;
}

export default function EscolaListaNovaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const schoolQ = useSchool(id);
  const createList = useCreateList();

  const [meta, setMeta] = useState<MetaState>({
    grade: "",
    schoolYear: DEFAULT_YEAR,
    teacherName: "",
  });
  const [items, setItems] = useState<ListItemInput[]>([]);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!id) {
    navigate("/minhas-escolas", { replace: true });
    return null;
  }

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!meta.grade.trim() || meta.grade.trim().length < 2) {
      e.grade = "Selecione ou informe a turma.";
    }
    if (!meta.schoolYear || meta.schoolYear < 2024) {
      e.schoolYear = "Ano letivo inválido.";
    }
    if (
      requiresTeacherName(meta.grade) &&
      meta.teacherName.trim().length === 0
    ) {
      e.teacherName = "Informe o(a) professor(a) titular.";
    }
    if (items.length === 0) {
      e.items = "Adicione pelo menos um item à lista.";
    }
    if (items.some((i) => !i.name.trim())) {
      e.items = "Todo item precisa de nome.";
    }
    if (items.some((i) => !Number.isFinite(i.quantity) || i.quantity < 1)) {
      e.items = "Quantidade deve ser ≥ 1.";
    }
    return e;
  };

  const onSaveDraft = async () => {
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      toast.error("Confira os campos destacados.");
      return;
    }
    try {
      const listId = await createList.mutateAsync({
        schoolId: id,
        grade: meta.grade.trim(),
        schoolYear: meta.schoolYear,
        teacherName: requiresTeacherName(meta.grade)
          ? meta.teacherName.trim() || null
          : null,
        source: "school_manual",
        pendingManualDigitization: false,
        rawFileUrl: null,
        items: items.map((it) => ({
          ...it,
          name: it.name.trim(),
          specification: it.specification?.trim() || null,
          unit: it.unit?.trim() || null,
          notes: it.notes?.trim() || null,
        })),
      });
      toast.success("Rascunho salvo.");
      navigate(`/escola/${id}/listas/${listId}`, { replace: true });
    } catch (err) {
      console.error("[lista-nova] create failed", {
        message: (err as Error).message,
      });
      toast.error("Não conseguimos salvar agora. Tente em instantes.");
    }
  };

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center justify-between border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
        <button
          type="button"
          onClick={() => setPdfOpen(true)}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-lc-white border border-lc-border text-lc-mid text-xs font-semibold hover:bg-lc-surface transition-all"
        >
          <FileUp className="w-3.5 h-3.5" aria-hidden />
          Já tenho a lista em PDF
        </button>
      </header>

      <main className="flex-1 mx-auto px-5 md:px-8 py-8 md:py-12 w-full max-w-[480px] md:max-w-[720px]">
        <Link
          to={`/escola/${id}/listas`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden /> Voltar
        </Link>

        <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-lc-ink">
          Nova lista
        </h1>
        {schoolQ.data?.school && (
          <p className="mt-2 text-sm text-lc-mid">
            {schoolQ.data.school.trade_name}
          </p>
        )}

        <section className="mt-8 rounded-2xl bg-lc-white border border-lc-border p-5 md:p-6">
          <h2 className="text-base font-bold text-lc-ink">1. Turma e ano</h2>
          <div className="mt-4">
            <ListMetaForm
              grade={meta.grade}
              schoolYear={meta.schoolYear}
              teacherName={meta.teacherName}
              onChange={(next) => setMeta(next)}
              errors={{
                grade: errors.grade,
                schoolYear: errors.schoolYear,
                teacherName: errors.teacherName,
              }}
            />
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-bold text-lc-ink">2. Itens da lista</h2>
          <p className="mt-1 text-sm text-lc-mid">
            Liste cada material que a turma precisa. Quantidade, unidade e
            observações são opcionais quando não fizerem diferença.
          </p>
          <div className="mt-4">
            <ListItemsEditor items={items} onChange={setItems} />
          </div>
          {errors.items && (
            <p className="mt-2 text-xs text-lc-coral">{errors.items}</p>
          )}
        </section>

        <button
          type="button"
          onClick={onSaveDraft}
          disabled={createList.isPending}
          className="mt-10 w-full h-12 rounded-xl bg-lc-blue text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {createList.isPending && (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          )}
          Salvar rascunho
        </button>
        <p className="mt-2 text-xs text-lc-mid text-center">
          Você pode publicar depois, na página de detalhe.
        </p>
      </main>

      <Footer />

      <PdfUploadModal
        open={pdfOpen}
        schoolId={id}
        defaultGrade={meta.grade}
        defaultSchoolYear={meta.schoolYear}
        onClose={() => setPdfOpen(false)}
        onSuccess={(listId) => {
          setPdfOpen(false);
          navigate(`/escola/${id}/listas/${listId}`, { replace: true });
        }}
      />
    </div>
  );
}
