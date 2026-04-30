// Shown when the student has no list_id yet — typically because the
// auto-link in register_student found 0 or 2+ matches and the parent
// hasn't picked one in /meus-alunos/:id/lista yet. Pushes to that page.

import { Link } from "react-router-dom";
import { ListChecks } from "lucide-react";

interface Props {
  studentId: string;
  studentFirstName: string;
}

export function EmptyCartState({ studentId, studentFirstName }: Props) {
  return (
    <div className="rounded-2xl bg-lc-white border border-lc-border p-8 text-center">
      <ListChecks className="w-12 h-12 text-lc-mid/60 mx-auto" aria-hidden />
      <h2 className="mt-4 text-lg font-bold text-lc-ink">
        {studentFirstName} ainda não tem uma lista vinculada
      </h2>
      <p className="mt-2 text-sm text-lc-mid">
        Sem lista, não conseguimos montar o carrinho. Vincule a lista da turma
        antes.
      </p>
      <Link
        to={`/meus-alunos/${studentId}/lista`}
        className="mt-6 inline-flex h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold items-center justify-center hover:opacity-90 transition-all"
      >
        Vincular lista
      </Link>
    </div>
  );
}
