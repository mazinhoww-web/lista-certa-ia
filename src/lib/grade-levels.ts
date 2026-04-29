// Pre-defined grade options + heuristic that decides whether a grade label
// implies a single titular teacher (Educação Infantil + Fundamental I) vs a
// per-subject schedule (Fundamental II + Ensino Médio). The heuristic
// normalizes the input so it absorbs spelling/ordinal variants without
// requiring exact matches.
//
// Follow-up: heuristics is a first cut. Run `SELECT DISTINCT grade FROM
// lists` monthly and adjust patterns as real data accumulates.

export type GradeGroup = "infantil" | "fundamental_i" | "fundamental_ii" | "medio";

export interface GradeOption {
  value: string;
  group: GradeGroup;
  requiresTeacher: boolean;
}

// Dropdown shown in the cadastro form. Mirrors the heuristic exactly:
// every option here must match requiresTeacherName(option.value).
export const GRADE_OPTIONS: GradeOption[] = [
  { value: "Berçário", group: "infantil", requiresTeacher: true },
  { value: "Maternal I", group: "infantil", requiresTeacher: true },
  { value: "Maternal II", group: "infantil", requiresTeacher: true },
  { value: "Pré I", group: "infantil", requiresTeacher: true },
  { value: "Pré II", group: "infantil", requiresTeacher: true },
  { value: "Jardim I", group: "infantil", requiresTeacher: true },
  { value: "Jardim II", group: "infantil", requiresTeacher: true },
  { value: "1º Ano", group: "fundamental_i", requiresTeacher: true },
  { value: "2º Ano", group: "fundamental_i", requiresTeacher: true },
  { value: "3º Ano", group: "fundamental_i", requiresTeacher: true },
  { value: "4º Ano", group: "fundamental_i", requiresTeacher: true },
  { value: "5º Ano", group: "fundamental_i", requiresTeacher: true },
  { value: "6º Ano", group: "fundamental_ii", requiresTeacher: false },
  { value: "7º Ano", group: "fundamental_ii", requiresTeacher: false },
  { value: "8º Ano", group: "fundamental_ii", requiresTeacher: false },
  { value: "9º Ano", group: "fundamental_ii", requiresTeacher: false },
  { value: "1ª Série EM", group: "medio", requiresTeacher: false },
  { value: "2ª Série EM", group: "medio", requiresTeacher: false },
  { value: "3ª Série EM", group: "medio", requiresTeacher: false },
];

export const GRADE_GROUP_LABELS: Record<GradeGroup, string> = {
  infantil: "Educação Infantil",
  fundamental_i: "Fundamental I",
  fundamental_ii: "Fundamental II",
  medio: "Ensino Médio",
};

function normalizeGrade(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")           // strip combining marks (acentos)
    .replace(/[º°ª]/g, "")           // strip typographic ordinal markers
    .replace(/(\d)[oa]\b/g, "$1")    // strip ascii ordinal abbreviation: 5o→5, 1a→1
    .replace(/[\s_-]+/g, " ")
    .trim();
}

const NO_TEACHER_PATTERNS: RegExp[] = [
  /\b6\s*ano\b/,
  /\b7\s*ano\b/,
  /\b8\s*ano\b/,
  /\b9\s*ano\b/,
  /\b1\s*serie\b/,
  /\b2\s*serie\b/,
  /\b3\s*serie\b/,
  /\bensino\s*medio\b/,
  /\bmedio\b/,
  /\bem\b/,
  /\bfund\s*ii\b/,
  /\bfundamental\s*ii\b/,
];

const TEACHER_PATTERNS: RegExp[] = [
  /\bbercario\b/,
  /\bmaternal\b/,
  /\bmini\s*maternal\b/,
  /\bpre\s*i+\b/,
  /\bpre\s*escola\b/,
  /\bjardim\s*i+\b/,
  /\binfantil\b/,
  /\b[1-5]\s*ano\b/,
  /\bg[1-5]\b/,
  /\bfund\s*i\b/,
  /\bfundamental\s*i\b/,
];

/**
 * True when the grade label implies a single titular teacher (Educação
 * Infantil + Fundamental I). False for Fundamental II and Ensino Médio,
 * where teaching is split per subject. Defaults to true on unknown input —
 * safer to ask for the teacher's name than to silently hide the field.
 */
export function requiresTeacherName(grade: string | null | undefined): boolean {
  if (!grade) return true;
  const n = normalizeGrade(grade);
  if (!n) return true;

  for (const re of NO_TEACHER_PATTERNS) {
    if (re.test(n)) return false;
  }
  for (const re of TEACHER_PATTERNS) {
    if (re.test(n)) return true;
  }
  return true;
}
