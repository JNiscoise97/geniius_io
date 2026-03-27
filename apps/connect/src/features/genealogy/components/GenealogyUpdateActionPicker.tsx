// GenealogyUpdateActionPicker.tsx

import { Plus, PencilLine, TriangleAlert } from "lucide-react";
import type { GenealogyUpdateAction } from "../types/genealogyUpdateTypes";

type Props = {
  value: GenealogyUpdateAction | null;
  onChange: (value: GenealogyUpdateAction) => void;
};

const options: Array<{
  value: GenealogyUpdateAction;
  title: string;
  text: string;
  icon: typeof Plus;
}> = [
  {
    value: "add_missing_person",
    title: "Ajouter une personne manquante",
    text: "Exemple : un enfant, un conjoint, un frère ou une sœur absent(e) de l’arbre.",
    icon: Plus,
  },
  {
    value: "complete_person",
    title: "Compléter une fiche",
    text: "Exemple : il manque un prénom, une date, un lieu, une photo ou un lien familial.",
    icon: PencilLine,
  },
  {
    value: "correct_person",
    title: "Signaler une erreur",
    text: "Exemple : une information semble incorrecte ou incomplète.",
    icon: TriangleAlert,
  },
];

export function GenealogyUpdateActionPicker({ value, onChange }: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[16px] font-black text-slate-900">
        Que veux-tu faire ?
      </div>
      <div className="mt-1 text-sm font-bold text-slate-700">
        Choisis le type de mise à jour que tu veux proposer.
      </div>

      <div className="mt-4 grid gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={[
                "rounded-3xl border p-4 text-left transition",
                active
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-900 border border-slate-200">
                  <Icon size={18} />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-900">
                    {option.title}
                  </div>
                  <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                    {option.text}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}