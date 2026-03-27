// components/tree-contribute/ContributeGlobalReviewSection.tsx

import { CheckCircle2, ListChecks } from "lucide-react";
import {
  GroupReviewItemCard,
  type GroupReviewDecisionType,
} from "./GroupReviewItemCard";

export type GlobalReviewGroup = {
  groupKey: string;
  title: string;
  subtitle?: string;
  completedCount?: number;
  totalCount?: number;
  items: Array<{
    id: string;
    roleLabel: string;
    displayName: string;
    decision: GroupReviewDecisionType;
    summary: string;
    comment?: string | null;
    shouldAppearInTree?: boolean | null;
    displayChoiceLabel?: string | null;
    invitationLabel?: string | null;
    onClick?: () => void;
  }>;
};

type ContributeGlobalReviewSectionProps = {
  groups: GlobalReviewGroup[];
  title?: string;
  subtitle?: string;
};

export function ContributeGlobalReviewSection({
  groups,
  title = "Récapitulatif global",
  subtitle = "Retrouve ici l’ensemble des décisions prises sur tes différents groupes familiaux avant l’envoi final.",
}: ContributeGlobalReviewSectionProps) {
  return (
    <section className="grid gap-4">
      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl bg-indigo-50 p-3 text-indigo-700">
            <ListChecks size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-black text-slate-900">
              {title}
            </div>
            <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
              {subtitle}
            </div>
          </div>
        </div>
      </section>

      {groups.map((group) => {
        const completedLabel =
          typeof group.completedCount === "number" &&
          typeof group.totalCount === "number"
            ? `${group.completedCount} sur ${group.totalCount} relu${group.totalCount > 1 ? "s" : ""}`
            : null;

        return (
          <section
            key={group.groupKey}
            className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[18px] font-black text-slate-900">
                  {group.title}
                </div>

                {group.subtitle ? (
                  <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
                    {group.subtitle}
                  </div>
                ) : null}
              </div>

              {completedLabel ? (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-[12px] font-black text-emerald-700">
                  <CheckCircle2 size={15} />
                  {completedLabel}
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3">
              {group.items.map((item) => (
                <GroupReviewItemCard
                  key={item.id}
                  roleLabel={item.roleLabel}
                  displayName={item.displayName}
                  decision={item.decision}
                  summary={item.summary}
                  comment={item.comment}
                  shouldAppearInTree={item.shouldAppearInTree}
                  displayChoiceLabel={item.displayChoiceLabel}
                  invitationLabel={item.invitationLabel}
                  onClick={item.onClick}
                />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}