import { Plus } from "lucide-react";
import type { ReactNode } from "react";

type FamilyPeopleListProps<T> = {
  title: string;
  subtitle?: string;
  addLabel?: string;
  emptyText: string;
  items: T[];
  onAdd: () => void;
  renderItem: (item: T, index: number) => ReactNode;
};

export function FamilyPeopleList<T>({
  title,
  subtitle,
  addLabel = "Ajouter",
  emptyText,
  items,
  onAdd,
  renderItem,
}: FamilyPeopleListProps<T>) {
  return (
    <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[16px] font-black text-slate-900">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-sm font-bold text-slate-700">
              {subtitle}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="h-10 px-3 rounded-xl font-extrabold text-sm inline-flex items-center gap-2 border bg-indigo-50 text-slate-900 border-indigo-100"
        >
          <Plus size={16} />
          {addLabel}
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
            {emptyText}
          </div>
        ) : null}

        {items.map((item, index) => renderItem(item, index))}
      </div>
    </section>
  );
}