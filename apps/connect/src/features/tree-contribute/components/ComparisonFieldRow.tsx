// components/tree-contribute/ComparisonFieldRow.tsx

import { ArrowRightLeft } from "lucide-react";
import {
  ComparisonBadge,
  type ComparisonBadgeStatus,
} from "./ComparisonBadge";

export type ComparisonFieldRowData = {
  fieldKey: string;
  label: string;
  familyKnowledgeValue: string | null | undefined;
  treeValue: string | null | undefined;
  status: ComparisonBadgeStatus;
  helpText?: string;
};

type ComparisonFieldRowProps = {
  field: ComparisonFieldRowData;
};

function renderValue(value: string | null | undefined) {
  if (value === null || value === undefined || value.trim() === "") {
    return (
      <span className="italic text-slate-400">Non renseigné</span>
    );
  }

  return <span className="text-slate-900">{value}</span>;
}

export function ComparisonFieldRow({
  field,
}: ComparisonFieldRowProps) {
  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[14px] font-black text-slate-900">
            {field.label}
          </div>

          {field.helpText ? (
            <div className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
              {field.helpText}
            </div>
          ) : null}
        </div>

        <ComparisonBadge status={field.status} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Tes informations
          </div>
          <div className="mt-2 text-sm font-bold leading-6">
            {renderValue(field.familyKnowledgeValue)}
          </div>
        </div>

        <div className="hidden items-center justify-center md:flex">
          <div className="rounded-2xl bg-slate-100 p-2 text-slate-500">
            <ArrowRightLeft size={16} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Arbre familial
          </div>
          <div className="mt-2 text-sm font-bold leading-6">
            {renderValue(field.treeValue)}
          </div>
        </div>
      </div>
    </article>
  );
}