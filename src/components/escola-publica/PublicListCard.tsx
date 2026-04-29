// One list in /escola/:slug — clickable card → /escola/:slug/lista/:listId.

import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type ListRow = Database["public"]["Tables"]["lists"]["Row"];

interface Props {
  schoolSlug: string;
  list: ListRow;
  itemsCount?: number | null;
}

export function PublicListCard({ schoolSlug, list, itemsCount }: Props) {
  return (
    <Link
      to={`/escola/${schoolSlug}/lista/${list.id}`}
      className="block rounded-2xl bg-lc-white border border-lc-border p-5 hover:shadow-lc-md hover:border-lc-mid/40 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold text-lc-ink">
            {list.grade}
            <span className="text-lc-mid font-normal"> · {list.school_year}</span>
          </div>
          {list.teacher_name && (
            <div className="text-sm text-lc-mid mt-0.5">
              Professor(a): {list.teacher_name}
            </div>
          )}
        </div>
        {typeof itemsCount === "number" && (
          <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full bg-lc-blue/10 text-lc-blue border border-lc-blue/20 text-xs font-semibold">
            {itemsCount} {itemsCount === 1 ? "item" : "itens"}
          </span>
        )}
      </div>
    </Link>
  );
}
