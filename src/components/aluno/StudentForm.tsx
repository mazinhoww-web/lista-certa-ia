// Cadastro form for one student. Wires the same grade dropdown LC-005
// uses for lists, with the requiresTeacherName helper toggling the
// teacher field. Submit hands off the validated payload to the parent
// (which opens the consent modal before the actual RPC call).

import { useMemo, useState } from "react";
import { z } from "zod";
import {
  GRADE_GROUP_LABELS,
  GRADE_OPTIONS,
  type GradeGroup,
  requiresTeacherName,
} from "@/lib/grade-levels";
import { useApprovedSchools } from "@/hooks/useApprovedSchools";

const OTHER_GRADE = "__other__";

const formSchema = z.object({
  firstName: z.string().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres"),
  schoolId: z.string().uuid("Selecione uma escola"),
  grade: z.string().min(2, "Selecione a turma"),
  teacherName: z.string().nullable(),
});

export interface StudentFormPayload {
  firstName: string;
  schoolId: string;
  grade: string;
  teacherName: string | null;
}

interface Props {
  defaultSchoolId?: string;
  defaultGrade?: string;
  defaultTeacher?: string;
  pending?: boolean;
  onSubmit: (payload: StudentFormPayload) => void;
}

export function StudentForm({
  defaultSchoolId = "",
  defaultGrade = "",
  defaultTeacher = "",
  pending,
  onSubmit,
}: Props) {
  const [firstName, setFirstName] = useState("");
  const [schoolId, setSchoolId] = useState(defaultSchoolId);
  const [grade, setGrade] = useState(defaultGrade);
  const [teacherName, setTeacherName] = useState(defaultTeacher);
  const [otherActive, setOtherActive] = useState(
    defaultGrade !== "" && !GRADE_OPTIONS.some((o) => o.value === defaultGrade),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Approved schools the parent can attach a student to.
  const approvedSchoolsQ = useApprovedSchools(50);
  const approvedSchools = approvedSchoolsQ.data ?? [];

  const groupedGrades = useMemo(() => {
    return GRADE_OPTIONS.reduce<Record<GradeGroup, typeof GRADE_OPTIONS>>(
      (acc, opt) => {
        (acc[opt.group] ??= []).push(opt);
        return acc;
      },
      {} as Record<GradeGroup, typeof GRADE_OPTIONS>,
    );
  }, []);

  const showTeacher = requiresTeacherName(grade);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      firstName: firstName.trim(),
      schoolId,
      grade: grade.trim(),
      teacherName: showTeacher ? teacherName.trim() || null : null,
    };
    const result = formSchema.safeParse(payload);
    if (!result.success) {
      const e: Record<string, string> = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) e[String(issue.path[0])] = issue.message;
      }
      setErrors(e);
      return;
    }
    if (showTeacher && !payload.teacherName) {
      setErrors({ teacherName: "Informe o(a) professor(a) titular." });
      return;
    }
    setErrors({});
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="first-name" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
          Primeiro nome
        </label>
        <input
          id="first-name"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          maxLength={80}
          autoComplete="off"
          placeholder="Ex.: Lucas"
          className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          aria-invalid={!!errors.firstName}
        />
        {errors.firstName && (
          <p className="mt-1 text-xs text-lc-coral">{errors.firstName}</p>
        )}
      </div>

      <div>
        <label htmlFor="school-id" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
          Escola
        </label>
        <select
          id="school-id"
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
          className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          aria-invalid={!!errors.schoolId}
        >
          <option value="">Selecione…</option>
          {approvedSchools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.trade_name}
              {s.city ? ` — ${s.city}/${s.state ?? ""}` : ""}
            </option>
          ))}
        </select>
        {errors.schoolId && (
          <p className="mt-1 text-xs text-lc-coral">{errors.schoolId}</p>
        )}
      </div>

      <div>
        <label htmlFor="grade-select" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
          Turma / nível
        </label>
        <select
          id="grade-select"
          value={otherActive ? OTHER_GRADE : grade}
          onChange={(e) => {
            if (e.target.value === OTHER_GRADE) {
              setOtherActive(true);
              setGrade("");
              return;
            }
            setOtherActive(false);
            setGrade(e.target.value);
            if (!requiresTeacherName(e.target.value)) setTeacherName("");
          }}
          className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          aria-invalid={!!errors.grade}
        >
          <option value="">Selecione…</option>
          {(Object.keys(groupedGrades) as GradeGroup[]).map((g) => (
            <optgroup key={g} label={GRADE_GROUP_LABELS[g]}>
              {groupedGrades[g].map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value}
                </option>
              ))}
            </optgroup>
          ))}
          <option value={OTHER_GRADE}>Outro…</option>
        </select>
        {otherActive && (
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Ex.: Turma multidisciplinar"
            maxLength={100}
            className="mt-2 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          />
        )}
        {errors.grade && (
          <p className="mt-1 text-xs text-lc-coral">{errors.grade}</p>
        )}
      </div>

      {showTeacher && (
        <div>
          <label htmlFor="teacher-name" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
            Professor(a) titular
          </label>
          <input
            id="teacher-name"
            type="text"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            placeholder="Nome do(a) titular"
            maxLength={120}
            className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
            aria-invalid={!!errors.teacherName}
          />
          {errors.teacherName && (
            <p className="mt-1 text-xs text-lc-coral">{errors.teacherName}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full h-12 rounded-xl bg-lc-blue text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-all"
      >
        Continuar
      </button>
    </form>
  );
}
