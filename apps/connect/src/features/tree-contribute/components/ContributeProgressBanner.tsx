// components/tree-contribute/ContributeProgressBanner.tsx

import { CheckCircle2, Clock3, ListChecks } from "lucide-react";

type ContributeProgressBannerProps = {
  totalGroups: number;
  completedGroups: number;
  reviewedPersons?: number;
  totalPersons?: number;
};

export function ContributeProgressBanner({
  totalGroups,
  completedGroups,
  reviewedPersons,
  totalPersons,
}: ContributeProgressBannerProps) {
  const safeTotalGroups = Math.max(1, totalGroups);
  const clampedCompleted = Math.min(Math.max(0, completedGroups), safeTotalGroups);
  const percent = Math.round((clampedCompleted / safeTotalGroups) * 100);

  const personsText =
    typeof reviewedPersons === "number" && typeof totalPersons === "number"
      ? `${reviewedPersons} sur ${totalPersons} personne${totalPersons > 1 ? "s" : ""} relue${reviewedPersons > 1 ? "s" : ""}`
      : null;

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-indigo-50 p-3 text-indigo-700">
          <ListChecks size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[16px] font-black text-slate-900">
              Avancement de ta contribution
            </div>

            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">
              {percent}%
            </span>
          </div>

          <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
            {clampedCompleted} groupe{safeTotalGroups > 1 ? "s" : ""} terminé
            {safeTotalGroups > 1 ? "s" : ""} sur {safeTotalGroups}.
          </p>

          {personsText ? (
            <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
              {personsText}
            </p>
          ) : null}

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[color:var(--blue)] transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-extrabold">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
              <CheckCircle2 size={13} />
              Groupes validés
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
              <Clock3 size={13} />
              À poursuivre
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}