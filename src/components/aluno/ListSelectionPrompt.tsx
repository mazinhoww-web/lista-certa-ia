// Surfaced when a student was created but the RPC could not auto-link a
// single published list (zero matches OR multiple matches). Lets the
// parent attach the right list with one click. Direct UPDATE on the
// students row — RLS already ensures the parent owns it.

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

type ListRow = Database["public"]["Tables"]["lists"]["Row"];

interface Props {
  studentId: string;
  schoolId: string;
  grade: string;
  teacherName: string | null;
  studentFirstName: string;
  onLinked: (listId: string) => void;
}

export function ListSelectionPrompt({
  studentId,
  schoolId,
  grade,
  teacherName,
  studentFirstName,
  onLinked,
}: Props) {
  const qc = useQueryClient();
  const [candidates, setCandidates] = useState<ListRow[] | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void supabase
      .from("lists")
      .select("*")
      .eq("school_id", schoolId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("[ListSelectionPrompt] query failed", {
            student_id: studentId,
            code: error.code,
            message: error.message,
          });
          setCandidates([]);
          return;
        }
        const filtered = (data ?? []).filter(
          (l) => l.grade === grade,
        );
        setCandidates(filtered);
      });
    return () => {
      mounted = false;
    };
  }, [studentId, schoolId, grade]);

  const onPick = async (listId: string) => {
    setSubmitting(listId);
    const { error } = await supabase
      .from("students")
      .update({ list_id: listId, updated_at: new Date().toISOString() })
      .eq("id", studentId);
    setSubmitting(null);
    if (error) {
      console.error("[ListSelectionPrompt] update failed", {
        student_id: studentId,
        code: error.code,
        message: error.message,
      });
      toast.error("Não conseguimos vincular agora. Tente em instantes.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["my-students"] });
    qc.invalidateQueries({ queryKey: ["student", studentId] });
    onLinked(listId);
  };

  if (candidates === null) {
    return (
      <div className="rounded-2xl bg-lc-white border border-lc-border p-5">
        <p className="text-sm text-lc-mid inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Procurando listas correspondentes...
        </p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
        <p className="text-sm font-semibold text-amber-900">
          Nenhuma lista publicada para essa turma ainda.
        </p>
        <p className="mt-1 text-sm text-amber-900/90">
          Você pode aguardar a escola publicar — assim que disponível, a lista
          será vinculada automaticamente ao perfil de {studentFirstName}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-lc-white border border-lc-border p-5">
      <h2 className="text-base font-bold text-lc-ink">
        Encontramos {candidates.length} listas pra essa turma
      </h2>
      <p className="mt-1 text-sm text-lc-mid">
        Escolha qual é a do {studentFirstName}:
      </p>
      <ul className="mt-4 space-y-2">
        {candidates.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => onPick(l.id)}
              disabled={!!submitting}
              className="w-full text-left rounded-xl border border-lc-border bg-lc-surface px-4 py-3 text-sm hover:bg-lc-white transition-all disabled:opacity-60"
            >
              <div className="font-semibold text-lc-ink">
                {l.grade}
                <span className="text-lc-mid font-normal"> · {l.school_year}</span>
              </div>
              {l.teacher_name && (
                <div className="text-xs text-lc-mid mt-0.5">
                  Professor(a): {l.teacher_name}
                  {teacherName &&
                    teacherName === l.teacher_name &&
                    " · combina com o cadastro"}
                </div>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
