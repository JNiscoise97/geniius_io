// MissingPersonRequestForm.tsx

import { GenealogyPrivacyFields } from "./GenealogyPrivacyFields";
import type { MissingPersonProposal } from "../types/genealogyUpdateTypes";

type Props = {
  value: MissingPersonProposal;
  onChange: (patch: Partial<MissingPersonProposal>) => void;
};

const relativeOptions = [
  { value: "child", label: "Enfant" },
  { value: "sibling", label: "Frère / sœur" },
  { value: "partner", label: "Conjoint / conjointe" },
  { value: "parent", label: "Parent" },
  { value: "other", label: "Autre" },
] as const;

export function MissingPersonRequestForm({ value, onChange }: Props) {
  return (
    <div className="grid gap-3">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-[16px] font-black text-slate-900">
          Personne manquante
        </div>
        <div className="mt-1 text-sm font-bold text-slate-700">
          Ajoute une personne qui manque dans l’arbre sur cette branche.
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-slate-800">
              Quel lien familial ?
            </span>
            <select
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none"
              value={value.relativeKind}
              onChange={(e) =>
                onChange({
                  relativeKind: e.target.value as MissingPersonProposal["relativeKind"],
                })
              }
            >
              <option value="">Choisir</option>
              {relativeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-slate-800">Prénom</span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none"
              value={value.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              placeholder="Prénom"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-slate-800">Nom</span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none"
              value={value.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              placeholder="Nom"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-slate-800">Surnom</span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none"
              value={value.nickname}
              onChange={(e) => onChange({ nickname: e.target.value })}
              placeholder="Surnom"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-slate-800">
              Année de naissance
            </span>
            <input
              inputMode="numeric"
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none"
              value={value.birthYear}
              onChange={(e) => onChange({ birthYear: e.target.value })}
              placeholder="Ex. 2008"
            />
          </label>

          <div className="grid gap-1">
            <span className="text-xs font-extrabold text-slate-800">
              As-tu une photo ?
            </span>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ hasPhoto: "yes" })}
                className={[
                  "h-12 rounded-2xl border font-extrabold transition",
                  value.hasPhoto === "yes"
                    ? "border-indigo-200 bg-indigo-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700",
                ].join(" ")}
              >
                Oui
              </button>

              <button
                type="button"
                onClick={() => onChange({ hasPhoto: "no" })}
                className={[
                  "h-12 rounded-2xl border font-extrabold transition",
                  value.hasPhoto === "no"
                    ? "border-indigo-200 bg-indigo-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700",
                ].join(" ")}
              >
                Non
              </button>
            </div>
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-slate-800">
              Précision utile
            </span>
            <textarea
              className="min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 outline-none"
              value={value.note}
              onChange={(e) => onChange({ note: e.target.value })}
              placeholder="Ex. Il manque mon deuxième fils. Il est né après la création de l’arbre."
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