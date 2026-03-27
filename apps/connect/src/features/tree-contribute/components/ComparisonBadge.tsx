// components/tree-contribute/ComparisonBadge.tsx

import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ComparisonBadgeStatus =
  | "same"
  | "missing_in_tree"
  | "different"
  | "missing_in_family_knowledge"
  | "not_provided";

type ComparisonBadgeProps = {
  status: ComparisonBadgeStatus;
  label?: string;
};

type BadgeConfig = {
  label: string;
  icon: LucideIcon;
  className: string;
};

function getBadgeConfig(status: ComparisonBadgeStatus): BadgeConfig {
  switch (status) {
    case "same":
      return {
        label: "Identique",
        icon: CheckCircle2,
        className: "bg-emerald-50 text-emerald-700",
      };

    case "missing_in_tree":
      return {
        label: "À compléter",
        icon: Sparkles,
        className: "bg-indigo-50 text-indigo-700",
      };

    case "different":
      return {
        label: "Différent",
        icon: AlertTriangle,
        className: "bg-amber-50 text-amber-700",
      };

    case "missing_in_family_knowledge":
      return {
        label: "Absent de tes infos",
        icon: CircleDashed,
        className: "bg-slate-100 text-slate-700",
      };

    case "not_provided":
    default:
      return {
        label: "Non renseigné",
        icon: CircleDashed,
        className: "bg-slate-100 text-slate-600",
      };
  }
}

export function ComparisonBadge({
  status,
  label,
}: ComparisonBadgeProps) {
  const config = getBadgeConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold",
        config.className,
      ].join(" ")}
    >
      <Icon size={13} />
      {label ?? config.label}
    </span>
  );
}