import { Trash2 } from "lucide-react";
import { KnownToggleField } from "../../../shared/components/KnownToggleField";

export type FamilyPersonFormValues = {
  known: boolean;
  firstName: string;
  lastName: string;
  nickname: string;
  isAlive: "" | "yes" | "no";
  hasPhoto: "" | "yes" | "no";
};

type FamilyPersonFormLabels = {
  knownLabel?: string;
  knownHelp?: string;
  firstNameLabel?: string;
  lastNameLabel?: string;
  nicknameLabel?: string;
  isAliveLabel?: string;
  hasPhotoLabel?: string;
  chooseLabel?: string;
  yesLabel?: string;
  noLabel?: string;
};

type FamilyPersonFormProps = {
  title: string;
  value: FamilyPersonFormValues;
  onChange: (patch: Partial<FamilyPersonFormValues>) => void;
  onRemove?: () => void;
  labels?: FamilyPersonFormLabels;
};

const defaultLabels: Required<FamilyPersonFormLabels> = {
  knownLabel: "Personne connue",
  knownHelp: "Décoche si tu ne connais pas encore cette personne.",
  firstNameLabel: "Prénom",
  lastNameLabel: "Nom",
  nicknameLabel: "Surnom",
  isAliveLabel: "Toujours en vie ?",
  hasPhotoLabel: "As-tu une photo ?",
  chooseLabel: "Choisir",
  yesLabel: "Oui",
  noLabel: "Non",
};

export function FamilyPersonForm({
  title,
  value,
  onChange,
  onRemove,
  labels,
}: FamilyPersonFormProps) {
  const l = { ...defaultLabels, ...labels };

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[15px] font-black text-slate-900">{title}</div>

        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            <Trash2 size={16} />
          </button>
        ) : null}
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
          <label className="grid gap-3">
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

          <label className="grid gap-3">
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

          <label className="grid gap-3">
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

          <div className="grid grid-cols-1 gap-2">
            <div className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                {l.isAliveLabel}
              </span>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ isAlive: "yes" })}
                  className={[
                    "h-12 rounded-2xl border font-extrabold transition",
                    value.isAlive === "yes"
                      ? "border-indigo-200 bg-indigo-50 text-slate-900"
                      : "border-slate-200 bg-white text-slate-700",
                  ].join(" ")}
                >
                  {l.yesLabel}
                </button>

                <button
                  type="button"
                  onClick={() => onChange({ isAlive: "no" })}
                  className={[
                    "h-12 rounded-2xl border font-extrabold transition",
                    value.isAlive === "no"
                      ? "border-indigo-200 bg-indigo-50 text-slate-900"
                      : "border-slate-200 bg-white text-slate-700",
                  ].join(" ")}
                >
                  {l.noLabel}
                </button>
              </div>
            </div>

            <div className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                {l.hasPhotoLabel}
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
                  {l.yesLabel}
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
                  {l.noLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}