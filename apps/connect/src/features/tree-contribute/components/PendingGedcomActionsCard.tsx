// components/tree-contribute/PendingGedcomActionsCard.tsx

import {
  CheckCircle2,
  Link2,
  PenSquare,
  Sparkles,
  UserPlus,
} from "lucide-react";

export type PendingGedcomActionsCounts = {
  confirmCount?: number;
  completeCount?: number;
  correctCount?: number;
  createPersonCount?: number;
  createRelationCount?: number;
};

type PendingGedcomActionsCardProps = {
  counts: PendingGedcomActionsCounts;
  title?: string;
  subtitle?: string;
};

export function PendingGedcomActionsCard({
  counts,
  title = "Ce que cela impliquera côté arbre",
  subtitle = "Ce récapitulatif t’indique les actions qui devront ensuite être traitées sur l’arbre généalogique.",
}: PendingGedcomActionsCardProps) {
  const items = [
    {
      key: "confirm",
      label: "Fiches confirmées",
      count: counts.confirmCount ?? 0,
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "complete",
      label: "Fiches à compléter",
      count: counts.completeCount ?? 0,
      icon: Sparkles,
      className: "bg-indigo-50 text-indigo-700",
    },
    {
      key: "correct",
      label: "Corrections à vérifier",
      count: counts.correctCount ?? 0,
      icon: PenSquare,
      className: "bg-amber-50 text-amber-700",
    },
    {
      key: "create-person",
      label: "Individus à créer",
      count: counts.createPersonCount ?? 0,
      icon: UserPlus,
      className: "bg-fuchsia-50 text-fuchsia-700",
    },
    {
      key: "create-relation",
      label: "Liens familiaux à créer",
      count: counts.createRelationCount ?? 0,
      icon: Link2,
      className: "bg-sky-50 text-sky-700",
    },
  ].filter((item) => item.count > 0);

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <div className="text-[16px] font-black text-slate-900">{title}</div>
        <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
          {subtitle}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
            Aucune action GEDCOM particulière n’a été identifiée pour le moment.
          </div>
        ) : (
          items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={[
                      "rounded-xl p-2",
                      item.className,
                    ].join(" ")}
                  >
                    <Icon size={16} />
                  </div>

                  <div className="min-w-0 text-sm font-black text-slate-900">
                    {item.label}
                  </div>
                </div>

                <div className="rounded-full bg-white px-3 py-1 text-[12px] font-black text-slate-900">
                  {item.count}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}