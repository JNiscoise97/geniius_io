import { ArrowRight, type LucideIcon } from "lucide-react";

type AccessChoiceCardProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  icon: LucideIcon;
  onClick?: () => void;
};

export function AccessChoiceCard({
  title,
  subtitle,
  ctaLabel,
  icon: Icon,
  onClick,
}: AccessChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[26px] border border-slate-200 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.995] active:shadow-none"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[17px] font-black text-slate-900">
              {title}
            </div>

            <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
              <ArrowRight size={18} />
            </div>
          </div>

          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
            {subtitle}
          </p>

          <div className="mt-4 text-[12px] font-black text-[color:var(--blue)]">
            {ctaLabel}
          </div>
        </div>
      </div>
    </button>
  );
}