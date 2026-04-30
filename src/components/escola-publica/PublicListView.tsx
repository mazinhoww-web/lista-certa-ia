// Renders one published list to a public viewer (parent). Header links
// back to the school. Items are stacked vertically with a quantity pill.
// Footer offers "Compartilhar" (WhatsApp deep link) and "Baixar PDF"
// (only when raw_file_url is present). Both actions require auth — if
// the user is not logged in, LoginRequiredModal pops up.

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Download, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";
import { useStudentOwnedItems } from "@/hooks/useStudentOwnedItems";
import { useToggleOwnedItem } from "@/hooks/useToggleOwnedItem";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

type ListRow = Database["public"]["Tables"]["lists"]["Row"];
type ListItemRow = Database["public"]["Tables"]["list_items"]["Row"];
type School = Database["public"]["Tables"]["schools"]["Row"];

interface Props {
  school: School;
  list: ListRow;
  items: ListItemRow[];
  // When set, the view operates in "interactive mode": toggles per item,
  // remaining counter in the header. Owner is the parent of studentId.
  studentId?: string;
}

export function PublicListView({ school, list, items, studentId }: Props) {
  const { user } = useAuth();
  const [pendingAction, setPendingAction] = useState<null | "share" | "download">(
    null,
  );
  const owned = useStudentOwnedItems(studentId);
  const toggle = useToggleOwnedItem();

  const ownedCount = useMemo(() => {
    if (!studentId || !owned.data) return 0;
    return items.filter((it) => owned.data!.has(it.id)).length;
  }, [items, owned.data, studentId]);
  const remaining = items.length - ownedCount;

  const sharePayload = encodeURIComponent(
    `Lista de material — ${school.trade_name} — ${list.grade} (${list.school_year})\n` +
      `${window.location.origin}/escola/${school.slug}/lista/${list.id}`,
  );
  const shareHref = `https://wa.me/?text=${sharePayload}`;

  const onShare = () => {
    if (!user) {
      setPendingAction("share");
      return;
    }
    window.open(shareHref, "_blank", "noopener,noreferrer");
  };

  const onDownload = async () => {
    if (!user) {
      setPendingAction("download");
      return;
    }
    if (!list.raw_file_url) return;
    const { data, error } = await supabase.storage
      .from("school-lists")
      .createSignedUrl(list.raw_file_url, 60);
    if (error || !data?.signedUrl) {
      console.error("[public-list] signed url failed", {
        list_id: list.id,
        message: error?.message,
      });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <header>
        <Link
          to={`/escola/${school.slug}`}
          className="text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors"
        >
          ← {school.trade_name}
        </Link>
        <h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight text-lc-ink">
          {list.grade}
          <span className="text-lc-mid font-normal"> · {list.school_year}</span>
        </h1>
        {list.teacher_name && (
          <p className="mt-1 text-sm text-lc-mid">
            Professor(a): {list.teacher_name}
          </p>
        )}
        {studentId && items.length > 0 && (
          <div className="mt-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              {remaining} de {items.length} restantes
            </span>
          </div>
        )}
      </header>

      <section className="mt-8 rounded-2xl bg-lc-white border border-lc-border p-5 md:p-6">
        <h2 className="text-base font-bold text-lc-ink">
          Itens ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-lc-mid italic">
            Esta lista ainda não tem itens digitalizados.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {items.map((it) => {
              const isOwned = !!(studentId && owned.data?.has(it.id));
              return (
                <li
                  key={it.id}
                  className={`flex items-start gap-3 text-sm transition-opacity ${
                    isOwned ? "opacity-60" : ""
                  }`}
                >
                  {studentId ? (
                    <button
                      type="button"
                      onClick={() =>
                        toggle.mutate({ studentId, listItemId: it.id })
                      }
                      aria-pressed={isOwned}
                      aria-label={
                        isOwned
                          ? `Marcar ${it.name} como não comprado`
                          : `Marcar ${it.name} como já tenho em casa`
                      }
                      className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md border transition-all ${
                        isOwned
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-lc-white border-lc-border text-lc-mid hover:border-lc-blue"
                      }`}
                    >
                      {isOwned && <Check className="w-3.5 h-3.5" aria-hidden />}
                    </button>
                  ) : (
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-lc-blue/10 text-lc-blue border border-lc-blue/20 text-xs font-semibold">
                      {it.quantity}
                      {it.unit ? ` ${it.unit}` : "x"}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-semibold text-lc-ink ${
                        isOwned ? "line-through" : ""
                      }`}
                    >
                      {studentId ? `${it.quantity}${it.unit ? ` ${it.unit}` : "x"} · ` : ""}
                      {it.name}
                    </div>
                    {it.specification && (
                      <div className="text-xs text-lc-mid">
                        {it.specification}
                      </div>
                    )}
                    {it.notes && (
                      <div className="text-xs text-lc-mid italic">{it.notes}</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <footer className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onShare}
          className="h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-all"
        >
          <Share2 className="w-4 h-4" aria-hidden />
          Compartilhar via WhatsApp
        </button>
        {list.raw_file_url && (
          <button
            type="button"
            onClick={onDownload}
            className="h-11 px-5 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold inline-flex items-center gap-2 hover:bg-lc-surface transition-all"
          >
            <Download className="w-4 h-4" aria-hidden />
            Baixar PDF
          </button>
        )}
      </footer>

      <LoginRequiredModal
        open={pendingAction !== null}
        reason={
          pendingAction === "download"
            ? "Para baixar o PDF da lista, faça login com sua conta Google."
            : "Para compartilhar a lista no WhatsApp, faça login com sua conta Google."
        }
        onClose={() => setPendingAction(null)}
      />
    </div>
  );
}
