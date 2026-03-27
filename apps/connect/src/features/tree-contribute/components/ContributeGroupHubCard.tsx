// components/tree-contribute/ContributeGroupHubCard.tsx

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ContributeGroupHubCardProps = {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  totalPersons?: number;
  matchedCount?: number;
  missingCount?: number;
  needsReviewCount?: number;
  completed?: boolean;
  onClick?: () => void;
};

export function ContributeGroupHubCard({
  title,
  subtitle,
  icon: Icon = Users,
  totalPersons = 0,
  matchedCount = 0,
  missingCount = 0,
  needsReviewCount = 0,
  completed = false,
  onClick,
}: ContributeGroupHubCardProps) {
  const mainStatus = completed
    ? "Terminé"
    : missingCount > 0
      ? `${missingCount} à créer`
      : needsReviewCount > 0
        ? `${needsReviewCount} à vérifier`
        : "À parcourir";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] active:shadow-none"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-indigo-50 p-3 text-indigo-700">
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[16px] font-black text-slate-900">{title}</div>

            <span
              className={[
                "rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide",
                completed
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-700",
              ].join(" ")}
            >
              {mainStatus}
            </span>
          </div>

          <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
            {subtitle}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill
              icon={Users}
              tone="slate"
              label={`${totalPersons} personne${totalPersons > 1 ? "s" : ""}`}
            />

            <StatusPill
              icon={CheckCircle2}
              tone="emerald"
              label={`${matchedCount} fiche${matchedCount > 1 ? "s" : ""} trouvée${matchedCount > 1 ? "s" : ""}`}
            />

            {missingCount > 0 ? (
              <StatusPill
                icon={Sparkles}
                tone="indigo"
                label={`${missingCount} à créer`}
              />
            ) : null}

            {needsReviewCount > 0 ? (
              <StatusPill
                icon={AlertTriangle}
                tone="amber"
                label={`${needsReviewCount} à vérifier`}
              />
            ) : null}
          </div>
        </div>

        <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
          <ArrowRight size={18} />
        </div>
      </div>
    </button>
  );
}

function StatusPill({
  icon: Icon,
  label,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  tone: "slate" | "emerald" | "indigo" | "amber";
}) {
  const toneClass = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold",
        toneClass,
      ].join(" ")}
    >
      <Icon size={13} />
      {label}
    </span>
  );
}