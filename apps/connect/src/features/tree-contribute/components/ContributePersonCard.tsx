// components/tree-contribute/ContributePersonCard.tsx

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Mail,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MatchStatus = "matched" | "missing" | "uncertain";
type ComparisonStatus =
  | "up_to_date"
  | "needs_completion"
  | "has_differences"
  | "not_started";

type ContributePersonCardProps = {
  roleLabel: string;
  displayName: string;
  matchStatus: MatchStatus;
  comparisonStatus: ComparisonStatus;
  isLiving?: boolean | null;
  isMinor?: boolean | null;
  invitationPossible?: boolean;
  onClick?: () => void;
  icon?: LucideIcon;
};

export function ContributePersonCard({
  roleLabel,
  displayName,
  matchStatus,
  comparisonStatus,
  isLiving = null,
  isMinor = null,
  invitationPossible = false,
  onClick,
  icon: Icon = User,
}: ContributePersonCardProps) {
  const matchBadge = getMatchBadge(matchStatus);
  const comparisonBadge = getComparisonBadge(comparisonStatus);

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
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            {roleLabel}
          </div>

          <div className="mt-1 text-[16px] font-black text-slate-900">
            {displayName}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={matchBadge.tone} icon={matchBadge.icon} label={matchBadge.label} />
            <Badge
              tone={comparisonBadge.tone}
              icon={comparisonBadge.icon}
              label={comparisonBadge.label}
            />

            {invitationPossible ? (
              <Badge tone="indigo" icon={Mail} label="Invitation possible" />
            ) : null}

            {isMinor === true ? (
              <Badge tone="amber" icon={Shield} label="Mineur" />
            ) : null}

            {isLiving === true && isMinor !== true ? (
              <Badge tone="slate" icon={Shield} label="Personne vivante" />
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

function getMatchBadge(status: MatchStatus) {
  if (status === "matched") {
    return {
      label: "Fiche trouvée",
      tone: "emerald" as const,
      icon: CheckCircle2,
    };
  }

  if (status === "missing") {
    return {
      label: "Aucune fiche trouvée",
      tone: "indigo" as const,
      icon: Sparkles,
    };
  }

  return {
    label: "Correspondance incertaine",
    tone: "amber" as const,
    icon: AlertTriangle,
  };
}

function getComparisonBadge(status: ComparisonStatus) {
  if (status === "up_to_date") {
    return {
      label: "Informations cohérentes",
      tone: "emerald" as const,
      icon: CheckCircle2,
    };
  }

  if (status === "needs_completion") {
    return {
      label: "Informations à compléter",
      tone: "indigo" as const,
      icon: Sparkles,
    };
  }

  if (status === "has_differences") {
    return {
      label: "Différences détectées",
      tone: "amber" as const,
      icon: AlertTriangle,
    };
  }

  return {
    label: "Comparaison à faire",
    tone: "slate" as const,
    icon: User,
  };
}

function Badge({
  tone,
  icon: Icon,
  label,
}: {
  tone: "slate" | "emerald" | "indigo" | "amber";
  icon: LucideIcon;
  label: string;
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