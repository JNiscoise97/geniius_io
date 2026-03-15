import type { ReactNode } from "react";

type FamilyPeopleListProps<T> = {
  title: string;
  subtitle?: string;
  emptyText: string;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
};

export function FamilyPeopleList<T>({
  title,
  subtitle,
  emptyText,
  items,
  renderItem,
}: FamilyPeopleListProps<T>) {
  return (
    <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
      <div>
        <div className="text-[16px] font-black text-slate-900">{title}</div>
        {subtitle ? (
          <div className="mt-1 text-sm font-bold text-slate-700">
            {subtitle}
          </div>
        ) : null}
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