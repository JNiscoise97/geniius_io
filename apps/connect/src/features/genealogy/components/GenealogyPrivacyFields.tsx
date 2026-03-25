// GenealogyPrivacyFields.tsx

import type { GenealogyPrivacyFlags, LivingStatus } from "../types/genealogyUpdateTypes";

type Props = {
  value: GenealogyPrivacyFlags;
  onChange: (patch: Partial<GenealogyPrivacyFlags>) => void;
};

function ToggleButtons({
  label,
  value,
  onChange,
}: {
  label: string;
  value: LivingStatus;
  onChange: (value: LivingStatus) => void;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-extrabold text-slate-800">{label}</span>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange("yes")}
          className={[
            "h-12 rounded-2xl border font-extrabold transition",
            value === "yes"
              ? "border-indigo-200 bg-indigo-50 text-slate-900"
              : "border-slate-200 bg-white text-slate-700",
          ].join(" ")}
        >
          Oui
        </button>

        <button
          type="button"
          onClick={() => onChange("no")}
          className={[
            "h-12 rounded-2xl border font-extrabold transition",
            value === "no"
              ? "border-indigo-200 bg-indigo-50 text-slate-900"
              : "border-slate-200 bg-white text-slate-700",
          ].join(" ")}
        >
          Non
        </button>
      </div>
    </div>
  );
}

export function GenealogyPrivacyFields({ value, onChange }: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[16px] font-black text-slate-900">
        Confidentialité
      </div>
      <div className="mt-1 text-sm font-bold text-slate-700">
        Ces informations servent à enrichir l’arbre familial global. Elles ne
        seront pas forcément visibles par tous les participants.
      </div>

      <div className="mt-4 grid gap-4">
        <ToggleButtons
          label="Cette personne est-elle vivante ?"
          value={value.personIsLiving}
          onChange={(personIsLiving) => onChange({ personIsLiving })}
        />

        <ToggleButtons
          label="Cette personne est-elle mineure ?"
          value={value.personIsMinor}
          onChange={(personIsMinor) => onChange({ personIsMinor })}
        />

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300"
            checked={value.hasConsentToShare}
            onChange={(e) =>
              onChange({ hasConsentToShare: e.target.checked })
            }
          />
          <div>
            <div className="text-sm font-black text-slate-900">
              J’ai le droit de transmettre ces informations
            </div>
            <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
              Coche uniquement si tu es légitime pour partager ces éléments.
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300"
            checked={value.allowDisplayToFamily}
            onChange={(e) =>
              onChange({ allowDisplayToFamily: e.target.checked })
            }
          />
          <div>
            <div className="text-sm font-black text-slate-900">
              Cette fiche peut être affichée dans l’arbre partagé
            </div>
            <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
              Cette demande reste soumise à validation, surtout pour les
              personnes vivantes ou mineures.
            </div>
          </div>
        </label>
      </div>
    </section>
  );
}