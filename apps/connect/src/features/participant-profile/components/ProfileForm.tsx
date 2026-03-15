import { ArrowRight } from "lucide-react";
import type { FormEvent } from "react";
import type { ProfileFormConfig } from "../config/profileQuestionsConfig";
import type { ProfileTreePreference } from "../types/profileTreePreference";

export type ProfileFormValues = {
  city: string;
  occupation: string;
  interests: string;
  freeShare: string;
};

type ProfileFormProps = {
  config: ProfileFormConfig;
  value: ProfileFormValues;
  loading?: boolean;
  error?: string | null;
  allowInfoInFamilyTree: ProfileTreePreference;
  onChangeAllowInfoInFamilyTree: (next: ProfileTreePreference) => void;
  onChange: (patch: Partial<ProfileFormValues>) => void;
  onSubmit: (e: FormEvent) => void;
};

export function ProfileForm({
  config,
  value,
  loading = false,
  error = null,
  allowInfoInFamilyTree,
  onChangeAllowInfoInFamilyTree,
  onChange,
  onSubmit,
}: ProfileFormProps) {
  function getValue(key: string) {
    switch (key) {
      case "city":
        return value.city;
      case "occupation":
        return value.occupation;
      case "interests":
        return value.interests;
      case "free_share":
        return value.freeShare;
      default:
        return "";
    }
  }

  function setValue(key: string, next: string) {
    switch (key) {
      case "city":
        onChange({ city: next });
        break;
      case "occupation":
        onChange({ occupation: next });
        break;
      case "interests":
        onChange({ interests: next });
        break;
      case "free_share":
        onChange({ freeShare: next });
        break;
    }
  }

  return (
    <form id="profile-form" onSubmit={onSubmit} className="mt-3">
      <section className="rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
        <div className="p-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-black text-slate-900">
              Afficher ces informations dans l’arbre généalogique ?
            </div>
            <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
              Tu peux autoriser ou refuser l’affichage de ces réponses dans
              l’arbre. Tant que tu n’as pas choisi, rien n’est considéré comme
              accepté.
            </div>

            <div className="mt-3 grid gap-2">
              <label
                className={[
                  "flex items-start gap-3 rounded-2xl border p-3 transition",
                  allowInfoInFamilyTree === true
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-slate-200 bg-white",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="allow-info-in-family-tree"
                  checked={allowInfoInFamilyTree === true}
                  onChange={() => onChangeAllowInfoInFamilyTree(true)}
                  disabled={loading}
                  className="mt-1 h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-900">
                    Oui, j’accepte
                  </div>
                  <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                    Ces informations pourront apparaître dans l’arbre familial.
                  </div>
                </div>
              </label>

              <label
                className={[
                  "flex items-start gap-3 rounded-2xl border p-3 transition",
                  allowInfoInFamilyTree === false
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-slate-200 bg-white",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="allow-info-in-family-tree"
                  checked={allowInfoInFamilyTree === false}
                  onChange={() => onChangeAllowInfoInFamilyTree(false)}
                  disabled={loading}
                  className="mt-1 h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-900">
                    Non, je préfère ne pas les afficher
                  </div>
                  <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                    Tes réponses resteront privées dans ce cadre.
                  </div>
                </div>
              </label>
            </div>

            {allowInfoInFamilyTree === null ? (
              <div className="mt-3 text-xs font-bold text-amber-700">
                Aucune préférence choisie pour le moment.
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4">
            {config.questions.map((question) => (
              <label key={question.key} className="grid gap-1">
                <span className="text-xs font-extrabold text-slate-800">
                  {question.label}
                </span>

                {question.type === "textarea" ? (
                  <textarea
                    className="min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 placeholder:text-slate-400 outline-none resize-y focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    value={getValue(question.key)}
                    onChange={(e) =>
                      setValue(
                        question.key,
                        question.maxLength
                          ? e.target.value.slice(0, question.maxLength)
                          : e.target.value,
                      )
                    }
                    placeholder={question.placeholder}
                    disabled={loading}
                  />
                ) : (
                  <input
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    value={getValue(question.key)}
                    onChange={(e) =>
                      setValue(
                        question.key,
                        question.maxLength
                          ? e.target.value.slice(0, question.maxLength)
                          : e.target.value,
                      )
                    }
                    placeholder={question.placeholder}
                    disabled={loading}
                  />
                )}

                {question.helpText ? (
                  <div className="text-xs font-bold leading-5 text-slate-600">
                    {question.helpText}
                  </div>
                ) : null}

                {question.maxLength ? (
                  <div className="text-[11px] font-extrabold text-slate-400 text-right">
                    {getValue(question.key).length}/{question.maxLength}
                  </div>
                ) : null}
              </label>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-3 text-sm font-bold text-[color:var(--bad)]">
          {error}
        </div>
      ) : null}

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              type="submit"
              form="profile-form"
              className={[
                "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                loading
                  ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                  : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
              disabled={loading}
            >
              <ArrowRight size={18} />
              {loading ? "Enregistrement..." : "Continuer"}
            </button>
          </div>
        </div>
      </footer>
    </form>
  );
}