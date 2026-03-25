// components/tree-contribute/ComparisonFieldList.tsx

import { ComparisonFieldRow, type ComparisonFieldRowData } from "../components/ComparisonFieldRow";



type ComparisonFieldListProps = {
  title?: string;
  subtitle?: string;
  fields: ComparisonFieldRowData[];
};

export function ComparisonFieldList({
  title = "Comparaison détaillée",
  subtitle = "Compare les informations que tu as déjà partagées avec celles présentes dans l’arbre.",
  fields,
}: ComparisonFieldListProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <div className="text-[16px] font-black text-slate-900">{title}</div>
        <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
          {subtitle}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {fields.map((field) => (
          <ComparisonFieldRow
            key={field.fieldKey}
            field={field}
          />
        ))}
      </div>
    </section>
  );
}