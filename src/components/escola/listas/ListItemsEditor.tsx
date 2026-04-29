// Vertical card-per-item editor. Mobile-first: each card stacks fields in
// a 12-col grid. Add/remove are explicit buttons. Drag-reordering is not
// included in this MVP (position is derived from the array order at submit
// time; LC-005.5 can add drag handles).

import { Plus, Trash2 } from "lucide-react";
import type { ListItemInput } from "@/hooks/useCreateList";

interface Props {
  items: ListItemInput[];
  onChange: (items: ListItemInput[]) => void;
}

const EMPTY_ITEM: ListItemInput = {
  name: "",
  specification: "",
  quantity: 1,
  unit: "",
  notes: "",
};

export function ListItemsEditor({ items, onChange }: Props) {
  const updateAt = (idx: number, patch: Partial<ListItemInput>) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeAt = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    onChange([...items, { ...EMPTY_ITEM }]);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-lc-mid italic">
          Nenhum item ainda. Adicione o primeiro abaixo.
        </p>
      )}
      <ol className="space-y-3">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="rounded-2xl bg-lc-white border border-lc-border p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-lc-mid">
                Item {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                aria-label={`Remover item ${idx + 1}`}
                className="text-lc-mid hover:text-lc-coral transition-colors"
              >
                <Trash2 className="w-4 h-4" aria-hidden />
              </button>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12">
                <label
                  htmlFor={`item-name-${idx}`}
                  className="sr-only"
                >
                  Nome do item
                </label>
                <input
                  id={`item-name-${idx}`}
                  type="text"
                  value={item.name}
                  onChange={(e) => updateAt(idx, { name: e.target.value })}
                  placeholder="Ex.: Caderno espiral 96 folhas"
                  className="w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-surface text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
                />
              </div>
              <div className="col-span-4">
                <label
                  htmlFor={`item-qty-${idx}`}
                  className="sr-only"
                >
                  Quantidade
                </label>
                <input
                  id={`item-qty-${idx}`}
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateAt(idx, {
                      quantity: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  placeholder="Qtd"
                  className="w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-surface text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
                />
              </div>
              <div className="col-span-8">
                <label
                  htmlFor={`item-unit-${idx}`}
                  className="sr-only"
                >
                  Unidade
                </label>
                <input
                  id={`item-unit-${idx}`}
                  type="text"
                  value={item.unit ?? ""}
                  onChange={(e) => updateAt(idx, { unit: e.target.value })}
                  placeholder="Unidade (un, pacote, estojo...)"
                  className="w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-surface text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
                />
              </div>
              <div className="col-span-12">
                <label
                  htmlFor={`item-spec-${idx}`}
                  className="sr-only"
                >
                  Especificação
                </label>
                <input
                  id={`item-spec-${idx}`}
                  type="text"
                  value={item.specification ?? ""}
                  onChange={(e) =>
                    updateAt(idx, { specification: e.target.value })
                  }
                  placeholder="Especificação (opcional)"
                  className="w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-surface text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
                />
              </div>
              <div className="col-span-12">
                <label
                  htmlFor={`item-notes-${idx}`}
                  className="sr-only"
                >
                  Observação
                </label>
                <input
                  id={`item-notes-${idx}`}
                  type="text"
                  value={item.notes ?? ""}
                  onChange={(e) => updateAt(idx, { notes: e.target.value })}
                  placeholder="Observação (opcional)"
                  className="w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-surface text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-lc-white border border-dashed border-lc-mid text-lc-ink text-sm font-semibold hover:bg-lc-surface transition-all"
      >
        <Plus className="w-4 h-4" aria-hidden />
        Adicionar item
      </button>
    </div>
  );
}
