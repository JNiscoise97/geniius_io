// features/family-knowledge/components/FamilyPersonForm.tsx

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { KnownToggleField } from "../../../shared/components/KnownToggleField";

export type FamilyPersonFormValues = {
  id?: string;
  known: boolean;

  firstName: string;
  lastName: string;
  nickname: string;

  sex?: "" | "M" | "F" | "U";

  birthYear?: string;
  deathYear?: string;

  birthPlace?: string;
  currentPlace?: string;
  deathPlace?: string;

  isAlive: "" | "yes" | "no";
  hasPhoto: "" | "yes" | "no";

  confidence?: "" | "low" | "medium" | "high";
  notes?: string;
};

type FamilyPersonFormLabels = {
  knownLabel?: string;
  knownHelp?: string;

  firstNameLabel?: string;
  lastNameLabel?: string;
  nicknameLabel?: string;

  sexLabel?: string;
  birthYearLabel?: string;
  deathYearLabel?: string;

  birthPlaceLabel?: string;
  currentPlaceLabel?: string;
  deathPlaceLabel?: string;

  isAliveLabel?: string;
  hasPhotoLabel?: string;
  confidenceLabel?: string;
  notesLabel?: string;

  chooseLabel?: string;
  yesLabel?: string;
  noLabel?: string;

  advancedSectionLabel?: string;
  advancedSectionHelp?: string;
};

type FamilyPersonFormProps = {
  title: string;
  value: FamilyPersonFormValues;
  onChange: (patch: Partial<FamilyPersonFormValues>) => void;
  onRemove?: () => void;
  labels?: FamilyPersonFormLabels;
  defaultExpanded?: boolean;
  extraFields?: React.ReactNode;
};

const defaultLabels: Required<FamilyPersonFormLabels> = {
  knownLabel: "Personne connue",
  knownHelp: "Décoche si tu ne connais pas encore cette personne.",

  firstNameLabel: "Prénom",
  lastNameLabel: "Nom",
  nicknameLabel: "Surnom",

  sexLabel: "Sexe",
  birthYearLabel: "Année de naissance",
  deathYearLabel: "Année de décès",

  birthPlaceLabel: "Lieu de naissance",
  currentPlaceLabel: "Lieu de vie / domicile",
  deathPlaceLabel: "Lieu de décès",

  isAliveLabel: "Toujours en vie ?",
  hasPhotoLabel: "As-tu une photo ?",
  confidenceLabel: "Niveau de certitude",
  notesLabel: "Notes",

  chooseLabel: "Choisir",
  yesLabel: "Oui",
  noLabel: "Non",

  advancedSectionLabel: "Informations complémentaires",
  advancedSectionHelp: "Ajoute ces détails si tu les connais.",
};

function SummaryLine({ value }: { value: FamilyPersonFormValues }) {
  const parts = useMemo(() => {
    const items: string[] = [];

    const displayName = [value.firstName?.trim(), value.lastName?.trim()]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (displayName) {
      items.push(displayName);
    } else if (value.nickname?.trim()) {
      items.push(`« ${value.nickname.trim()} »`);
    } else {
      items.push("Informations à compléter");
    }

    if (value.birthYear?.trim()) {
      items.push(`né(e) vers ${value.birthYear.trim()}`);
    }

    if (value.isAlive === "yes") {
      items.push("en vie");
    } else if (value.isAlive === "no") {
      items.push("décédé(e)");
    }

    if (value.hasPhoto === "yes") {
      items.push("photo connue");
    }

    return items;
  }, [value]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600">
      {parts.join(" · ")}
    </div>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-12 rounded-2xl border font-extrabold transition",
        active
          ? "border-indigo-200 bg-indigo-50 text-slate-900"
          : "border-slate-200 bg-white text-slate-700",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export function FamilyPersonForm({
  title,
  value,
  onChange,
  onRemove,
  labels,
  defaultExpanded = false,
  extraFields,
}: FamilyPersonFormProps) {
  const l = { ...defaultLabels, ...labels };
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-black text-slate-900">{title}</div>
          {value.known ? <div className="mt-2"><SummaryLine value={value} /></div> : null}
        </div>

        <div className="flex items-center gap-2">
          {value.known ? (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
              aria-label={
                isExpanded ? "Replier la fiche" : "Déplier la fiche"
              }
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          ) : null}

          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
              aria-label="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <KnownToggleField
          checked={value.known}
          onChange={(checked) => onChange({ known: checked })}
          label={l.knownLabel}
          helpText={l.knownHelp}
        />
      </div>

      {value.known ? (
        <div className="mt-3 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                {l.firstNameLabel}
              </span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.firstName}
                onChange={(e) => onChange({ firstName: e.target.value })}
                placeholder={l.firstNameLabel}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                {l.lastNameLabel}
              </span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.lastName}
                onChange={(e) => onChange({ lastName: e.target.value })}
                placeholder={l.lastNameLabel}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                {l.nicknameLabel}
              </span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.nickname}
                onChange={(e) => onChange({ nickname: e.target.value })}
                placeholder={l.nicknameLabel}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                {l.birthYearLabel}
              </span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.birthYear ?? ""}
                onChange={(e) => onChange({ birthYear: e.target.value })}
                placeholder="Ex. 1958"
                inputMode="numeric"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                {l.isAliveLabel}
              </span>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <ToggleButton
                  active={value.isAlive === "yes"}
                  label={l.yesLabel}
                  onClick={() => onChange({ isAlive: "yes" })}
                />
                <ToggleButton
                  active={value.isAlive === "no"}
                  label={l.noLabel}
                  onClick={() => onChange({ isAlive: "no" })}
                />
              </div>
            </div>

            <div className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                {l.hasPhotoLabel}
              </span>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <ToggleButton
                  active={value.hasPhoto === "yes"}
                  label={l.yesLabel}
                  onClick={() => onChange({ hasPhoto: "yes" })}
                />
                <ToggleButton
                  active={value.hasPhoto === "no"}
                  label={l.noLabel}
                  onClick={() => onChange({ hasPhoto: "no" })}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-900">
                  {l.advancedSectionLabel}
                </div>
                <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                  {l.advancedSectionHelp}
                </div>
              </div>

              <div className="shrink-0 text-slate-500">
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {isExpanded ? (
              <div className="border-t border-slate-200 px-4 py-4">
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs font-extrabold text-slate-800">
                        {l.sexLabel}
                      </span>
                      <select
                        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                        value={value.sex ?? ""}
                        onChange={(e) =>
                          onChange({
                            sex: e.target.value as "" | "M" | "F" | "U",
                          })
                        }
                      >
                        <option value="">{l.chooseLabel}</option>
                        <option value="F">Femme</option>
                        <option value="M">Homme</option>
                        <option value="U">Inconnu / autre</option>
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs font-extrabold text-slate-800">
                        {l.deathYearLabel}
                      </span>
                      <input
                        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                        value={value.deathYear ?? ""}
                        onChange={(e) => onChange({ deathYear: e.target.value })}
                        placeholder="Ex. 2019"
                        inputMode="numeric"
                      />
                    </label>
                  </div>

                  <div className="grid gap-3">
                    <label className="grid gap-2">
                      <span className="text-xs font-extrabold text-slate-800">
                        {l.birthPlaceLabel}
                      </span>
                      <input
                        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                        value={value.birthPlace ?? ""}
                        onChange={(e) => onChange({ birthPlace: e.target.value })}
                        placeholder={l.birthPlaceLabel}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs font-extrabold text-slate-800">
                        {l.currentPlaceLabel}
                      </span>
                      <input
                        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                        value={value.currentPlace ?? ""}
                        onChange={(e) => onChange({ currentPlace: e.target.value })}
                        placeholder={l.currentPlaceLabel}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs font-extrabold text-slate-800">
                        {l.deathPlaceLabel}
                      </span>
                      <input
                        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                        value={value.deathPlace ?? ""}
                        onChange={(e) => onChange({ deathPlace: e.target.value })}
                        placeholder={l.deathPlaceLabel}
                      />
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-xs font-extrabold text-slate-800">
                      {l.confidenceLabel}
                    </span>
                    <select
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      value={value.confidence ?? ""}
                      onChange={(e) =>
                        onChange({
                          confidence: e.target.value as
                            | ""
                            | "low"
                            | "medium"
                            | "high",
                        })
                      }
                    >
                      <option value="">{l.chooseLabel}</option>
                      <option value="high">Je suis sûr</option>
                      <option value="medium">Plutôt sûr</option>
                      <option value="low">Pas totalement sûr</option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-extrabold text-slate-800">
                      {l.notesLabel}
                    </span>
                    <textarea
                      className="min-h-[96px] rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      value={value.notes ?? ""}
                      onChange={(e) => onChange({ notes: e.target.value })}
                      placeholder="Ex. appelé Tito dans la famille, a vécu à Saint-Paul, année approximative…"
                    />
                  </label>

                  {extraFields ? <div className="grid gap-3">{extraFields}</div> : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}