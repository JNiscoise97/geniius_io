import { KeyRound, ShieldCheck } from "lucide-react";

type RecoverySummaryCardProps = {
  title: string;
  subtitle: string;
  helperTitle: string;
  helperText: string;
  displayName: string;
};

export function RecoverySummaryCard({
  title,
  subtitle,
  helperTitle,
  helperText,
  displayName,
}: RecoverySummaryCardProps) {
  return (
    <>
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
            <KeyRound size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-black text-slate-900">{title}</div>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
              {subtitle}
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                Profil retrouvé
              </div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {displayName}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-[24px] border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl bg-white/70 p-2 text-[color:var(--blue)]">
            <ShieldCheck size={18} />
          </div>

          <div>
            <div className="text-sm font-black text-slate-900">{helperTitle}</div>
            <div className="mt-1 text-xs font-bold leading-5 text-slate-700">
              {helperText}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}