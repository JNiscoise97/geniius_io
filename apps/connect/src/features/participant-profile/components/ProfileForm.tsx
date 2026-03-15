import { AlertTriangle, ArrowRight } from "lucide-react";
import type { FormEvent } from "react";
import type { ProfileFormConfig } from "../config/profileQuestionsConfig";

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
  allowInfoInFamilyTree: boolean;
  onChangeAllowInfoInFamilyTree: (next: boolean) => void;
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
    <>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-700" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-amber-900">
              Chantiers en cours
            </div>
            <div className="mt-0.5 text-xs text-amber-800">
              <ol>
                <li>Envoi d'une notif par mail à l'organisateur</li>
                <li>Revoir les labels du titre</li>
                <li>Transformer boolean de preferences en yes/no/null</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <form id="profile-form" onSubmit={onSubmit} className="mt-3">
        <section className="rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
          <div className="p-4">
           
           <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={allowInfoInFamilyTree}
                onChange={(e) =>
                  onChangeAllowInfoInFamilyTree(e.target.checked)
                }
                disabled={loading}
                className="mt-1"
              />

              <div>
                <div className="text-sm font-black text-slate-900">
                  Afficher ces informations dans l’arbre généalogique
                </div>
                <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                  Si tu coches cette case, les informations remplies dans ce
                  formulaire pourront apparaître dans l’arbre généalogique de la
                  famille, si tu souhaites y figurer.
                </div>
              </div>
            </label>

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
    </>
  );
}