// Meta fields for a list: grade (dropdown + "Outro..." free text), school
// year (number input), and teacher_name (only when the chosen grade calls
// for one — the heuristic kept synchronized with the dropdown options).

import { useState } from "react";
import {
  GRADE_GROUP_LABELS,
  GRADE_OPTIONS,
  type GradeGroup,
  requiresTeacherName,
} from "@/lib/grade-levels";

interface Props {
  grade: string;
  schoolYear: number;
  teacherName: string;
  onChange: (next: { grade: string; schoolYear: number; teacherName: string }) => void;
  errors?: Partial<Record<"grade" | "schoolYear" | "teacherName", string>>;
}

const OTHER_VALUE = "__other__";

export function ListMetaForm({
  grade,
  schoolYear,
  teacherName,
  onChange,
  errors = {},
}: Props) {
  // Detect if the current grade is one of the dropdown options or a custom value.
  const isCustom = grade !== "" && !GRADE_OPTIONS.some((o) => o.value === grade);
  const [otherActive, setOtherActive] = useState(isCustom);

  const showTeacher = requiresTeacherName(grade);

  const handleGradeSelect = (value: string) => {
    if (value === OTHER_VALUE) {
      setOtherActive(true);
      onChange({ grade: "", schoolYear, teacherName });
      return;
    }
    setOtherActive(false);
    onChange({ grade: value, schoolYear, teacherName: requiresTeacherName(value) ? teacherName : "" });
  };

  const grouped = GRADE_OPTIONS.reduce<Record<GradeGroup, typeof GRADE_OPTIONS>>(
    (acc, opt) => {
      (acc[opt.group] ??= []).push(opt);
      return acc;
    },
    {} as Record<GradeGroup, typeof GRADE_OPTIONS>,
  );

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="grade-select" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
          Turma / nível
        </label>
        <select
          id="grade-select"
          value={otherActive ? OTHER_VALUE : grade}
          onChange={(e) => handleGradeSelect(e.target.value)}
          className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          aria-invalid={!!errors.grade}
        >
          <option value="">Selecione…</option>
          {(Object.keys(grouped) as GradeGroup[]).map((group) => (
            <optgroup key={group} label={GRADE_GROUP_LABELS[group]}>
              {grouped[group].map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value}
                </option>
              ))}
            </optgroup>
          ))}
          <option value={OTHER_VALUE}>Outro…</option>
        </select>
        {otherActive && (
          <input
            type="text"
            value={grade}
            onChange={(e) =>
              onChange({ grade: e.target.value, schoolYear, teacherName })
            }
            placeholder="Ex.: Turma multidisciplinar"
            maxLength={100}
            className="mt-2 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
            aria-label="Outro nível"
          />
        )}
        {errors.grade && <p className="mt-1 text-xs text-lc-coral">{errors.grade}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="school-year" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
            Ano letivo
          </label>
          <input
            id="school-year"
            type="number"
            min={2024}
            max={2099}
            value={schoolYear}
            onChange={(e) =>
              onChange({
                grade,
                schoolYear: parseInt(e.target.value, 10) || schoolYear,
                teacherName,
              })
            }
            className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
            aria-invalid={!!errors.schoolYear}
          />
          {errors.schoolYear && (
            <p className="mt-1 text-xs text-lc-coral">{errors.schoolYear}</p>
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
              onChange={(e) =>
                onChange({ grade, schoolYear, teacherName: e.target.value })
              }
              placeholder="Nome da titular"
              maxLength={120}
              className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
              aria-invalid={!!errors.teacherName}
            />
            {errors.teacherName && (
              <p className="mt-1 text-xs text-lc-coral">{errors.teacherName}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
