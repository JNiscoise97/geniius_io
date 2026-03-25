// components/tree-contribute/GroupReviewItemCard.tsx

import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Mail,
  Shield,
  Sparkles,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type GroupReviewDecisionType =
  | "confirm_existing"
  | "complete_existing"
  | "correct_existing"
  | "create_person"
  | "skip_for_now";

type GroupReviewItemCardProps = {
  roleLabel: string;
  displayName: string;
  decision: GroupReviewDecisionType;
  summary: string;
  comment?: string | null;
  shouldAppearInTree?: boolean | null;
  displayChoiceLabel?: string | null;
  invitationLabel?: string | null;
  onClick?: () => void;
};

type DecisionConfig = {
  label: string;
  icon: LucideIcon;
  className: string;
};

function getDecisionConfig(decision: GroupReviewDecisionType): DecisionConfig {
  switch (decision) {
    case "confirm_existing":
      return {
        label: "Fiche confirmée",
        icon: CheckCircle2,
        className: "bg-emerald-50 text-emerald-700",
      };
    case "complete_existing":
      return {
        label: "Fiche à compléter",
        icon: Sparkles,
        className: "bg-indigo-50 text-indigo-700",
      };
    case "correct_existing":
      return {
        label: "Différence signalée",
        icon: TriangleAlert,
        className: "bg-amber-50 text-amber-700",
      };
    case "create_person":
      return {
        label: "Fiche à créer",
        icon: UserPlus,
        className: "bg-fuchsia-50 text-fuchsia-700",
      };
    case "skip_for_now":
    default:
      return {
        label: "En attente",
        icon: CircleDashed,
        className: "bg-slate-100 text-slate-700",
      };
  }
}

export function GroupReviewItemCard({
  roleLabel,
  displayName,
  decision,
  summary,
  comment,
  shouldAppearInTree = null,
  displayChoiceLabel,
  invitationLabel,
  onClick,
}: GroupReviewItemCardProps) {
  const config = getDecisionConfig(decision);
  const Icon = config.icon;

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            {roleLabel}
          </div>

          <div className="mt-1 text-[16px] font-black text-slate-900">
            {displayName}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold",
                config.className,
              ].join(" ")}
            >
              <Icon size={13} />
              {config.label}
            </span>

            {shouldAppearInTree === true ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">
                <CheckCircle2 size={13} />
                À intégrer à l’arbre
              </span>
            ) : shouldAppearInTree === false ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700">
                <Shield size={13} />
                Non ajouté à l’arbre
              </span>
            ) : null}

            {displayChoiceLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700">
                <Shield size={13} />
                {displayChoiceLabel}
              </span>
            ) : null}

            {invitationLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-extrabold text-indigo-700">
                <Mail size={13} />
                {invitationLabel}
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            {summary}
          </p>

          {comment ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                Précision
              </div>
              <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
                {comment}
              </div>
            </div>
          ) : null}
        </div>

        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900"
            aria-label={`Modifier ${displayName}`}
          >
            <ArrowRight size={18} />
          </button>
        ) : null}
      </div>
    </article>
  );
}