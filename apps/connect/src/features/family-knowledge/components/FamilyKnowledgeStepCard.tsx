import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Lock,
  type LucideIcon,
} from "lucide-react";
import type { FamilyKnowledgeStepStatus } from "../config/familyKnowledgeStepsConfig";

type FamilyKnowledgeStepCardProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  ctaLabel: string;
  status?: FamilyKnowledgeStepStatus;
  disabled?: boolean;
  highlight?: boolean;
  onClick?: () => void;
};

function getStatusUi(status: FamilyKnowledgeStepStatus) {
  switch (status) {
    case "done":
      return {
        label: "Complété",
        textClass: "text-emerald-700",
        icon: CheckCircle2,
      };
    case "in_progress":
      return {
        label: "En cours",
        textClass: "text-amber-700",
        icon: Clock3,
      };
    case "todo":
    default:
      return {
        label: "À faire",
        textClass: "text-slate-500",
        icon: CircleDashed,
      };
  }
}

export function FamilyKnowledgeStepCard({
  title,
  subtitle,
  icon: Icon,
  ctaLabel,
  status = "todo",
  disabled = false,
  highlight = false,
  onClick,
}: FamilyKnowledgeStepCardProps) {
  const statusUi = getStatusUi(status);
  const StatusIcon = statusUi.icon;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={[
        "w-full rounded-[26px] border p-4 text-left transition-all shadow-sm",
        disabled
          ? "border-slate-200 bg-slate-50 opacity-75"
          : highlight
            ? "border-indigo-200 bg-indigo-50"
            : "border-slate-200 bg-white active:scale-[0.995] active:shadow-none",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 rounded-2xl p-3",
            disabled
              ? "bg-slate-200 text-slate-500"
              : "bg-slate-100 text-slate-900",
          ].join(" ")}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[17px] font-black text-slate-900">{title}</div>

            <div className="shrink-0">
              {disabled ? (
                <div className="rounded-2xl bg-slate-200 p-2 text-slate-500">
                  <Lock size={18} />
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-100 p-2 text-slate-900">
                  <ArrowRight size={18} />
                </div>
              )}
            </div>
          </div>

          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div
          className={[
            "inline-flex items-center gap-1 text-[11px] font-extrabold",
            statusUi.textClass,
          ].join(" ")}
        >
          <StatusIcon size={14} />
          {statusUi.label}
        </div>

        {!disabled ? (
          <div className="text-[12px] font-black text-[color:var(--blue)]">
            {ctaLabel}
          </div>
        ) : (
          <div className="text-[12px] font-black text-slate-400">
            Bientôt disponible
          </div>
        )}
      </div>
    </button>
  );
}