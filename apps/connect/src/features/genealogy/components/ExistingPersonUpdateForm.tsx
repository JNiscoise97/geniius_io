// ExistingPersonUpdateForm.tsx

import type { ExistingPersonProposal } from "../types/genealogyUpdateTypes";
import { GenealogyPrivacyFields } from "./GenealogyPrivacyFields";

type Props = {
  personLabel: string;
  value: ExistingPersonProposal;
  onChange: (patch: Partial<ExistingPersonProposal>) => void;
};

const fieldOptions = [
  { value: "identity", label: "Identité" },
  { value: "dates", label: "Dates" },
  { value: "places", label: "Lieux" },
  { value: "photo", label: "Photo" },
  { value: "relationship", label: "Lien familial" },
  { value: "other", label: "Autre" },
] as const;

export function ExistingPersonUpdateForm({
  personLabel,
  value,
  onChange,
}: Props) {
  const isCorrection = value.action === "correct_person";

  return (
    <div className="grid gap-3">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-[16px] font-black text-slate-900">
          {isCorrection ? "Signaler une erreur" : "Compléter une fiche"}
        </div>
        <div className="mt-1 text-sm font-bold text-slate-700">
          Tu proposes une mise à jour pour la fiche de <span className="text-slate-900">{personLabel}</span>.
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-slate-800">
              Type d’information concerné
            </span>
            <select
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none"
              value={value.fieldKey}
              onChange={(e) =>
                onChange({
                  fieldKey: e.target.value as ExistingPersonProposal["fieldKey"],
                })
              }
            >
              <option value="">Choisir</option>
              {fieldOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-slate-800">
              {isCorrection
                ? "Quelle est la bonne information ?"
                : "Quelle information veux-tu ajouter ?"}
            </span>
            <textarea
              className="min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 outline-none"
              value={value.proposedValue}
              onChange={(e) => onChange({ proposedValue: e.target.value })}
              placeholder={
                isCorrection
                  ? "Ex. Son année de naissance n’est pas 1958 mais 1960."
                  : "Ex. Il manque son deuxième prénom et son lieu de naissance."
              }
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-slate-800">
              Commentaire / contexte
            </span>
            <textarea
              className="min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 outline-none"
              value={value.note}
              onChange={(e) => onChange({ note: e.target.value })}
              placeholder="Ex. Je suis son fils, je confirme cette information."
            />
          </label>
        </div>
      </section>

      <GenealogyPrivacyFields
        value={value.privacy}
        onChange={(patch) =>
          onChange({
            privacy: { ...value.privacy, ...patch },
          })
        }
      />
    </div>
  );
}