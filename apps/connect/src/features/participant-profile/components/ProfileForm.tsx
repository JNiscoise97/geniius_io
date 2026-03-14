import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { FormEvent } from "react";
import type { ProfileFormConfig } from "../config/profileQuestionsConfig";

export type ProfileFormValues = {
  city: string;
  occupation: string;
  interests: string;
  personalityWord: string;
  cousinadeExpectation: string;
  freeShare: string;
};

type ProfileFormProps = {
  config: ProfileFormConfig;
  value: ProfileFormValues;
  loading?: boolean;
  onChange: (patch: Partial<ProfileFormValues>) => void;
  onSubmit: (e: FormEvent) => void;
};

export function ProfileForm({
  config,
  value,
  loading = false,
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
      case "personality_word":
        return value.personalityWord;
      case "cousinade_expectation":
        return value.cousinadeExpectation;
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
      case "personality_word":
        onChange({ personalityWord: next });
        break;
      case "cousinade_expectation":
        onChange({ cousinadeExpectation: next });
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
          <div className="text-[16px] font-black text-slate-900">
            {config.title}
          </div>
          <div className="mt-1 text-sm font-bold text-slate-700">
            {config.subtitle}
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 text-[color:var(--ok)]">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">
                  {config.introTitle}
                </div>
                <div className="text-xs font-bold leading-5 text-slate-700">
                  {config.introText}
                </div>
              </div>
            </div>
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

            <div className="mt-2 px-1 text-[11px] font-extrabold text-slate-700 flex items-center justify-between">
              <span>Étape 2 sur 3</span>
              <span className="text-slate-900">{loading ? "…" : "Prêt"}</span>
            </div>
          </div>
        </div>
      </footer>
    </form>
  );
}