import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { FormEvent } from "react";
import type { ConsentsFormConfig } from "../config/consentsFormConfig";

export type ConsentValue = boolean | null;

export type ConsentsFormValues = {
  allowFamilyPhotoSharing: ConsentValue;
  allowPhotoDisplayInApp: ConsentValue;
  allowEventPhotoMemory: ConsentValue;

  allowNameInFamilyTree: ConsentValue;
  allowPhotoInFamilyTree: ConsentValue;
  allowInfoInFamilyTree: ConsentValue;

  allowContactDetailsWithFamily: ConsentValue;
  allowFutureFamilyContact: ConsentValue;

  allowGenealogyEnrichment: ConsentValue;
  allowGenealogyContributionStorage: ConsentValue;

  allowNameInEventActivities: ConsentValue;
  allowParticipationInGames: ConsentValue;

  otherPreferences: string;
};

type ConsentsFormProps = {
  config: ConsentsFormConfig;
  value: ConsentsFormValues;
  loading?: boolean;
  onChange: (patch: Partial<ConsentsFormValues>) => void;
  onSubmit: (e: FormEvent) => void;
};

export function ConsentsForm({
  config,
  value,
  loading = false,
  onChange,
  onSubmit,
}: ConsentsFormProps) {
  function getConsentValue(
    key: keyof Omit<ConsentsFormValues, "otherPreferences">,
  ): ConsentValue {
    return value[key];
  }

  function setConsentValue(
    key: keyof Omit<ConsentsFormValues, "otherPreferences">,
    next: ConsentValue,
  ) {
    onChange({ [key]: next });
  }

  return (
    <form id="preferences-form" onSubmit={onSubmit} className="mt-3">
      <section className="rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
        <div className="p-4">
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
            {config.sections.map((section) => (
              <div key={section.key} className="grid gap-3">
                <div className="text-sm font-black text-slate-900">
                  {section.title}
                </div>

                <div className="grid gap-3">
                  {section.fields.map((field) => {
                    const fieldKey = field.key as keyof Omit<
                      ConsentsFormValues,
                      "otherPreferences"
                    >;
                    const currentValue = getConsentValue(fieldKey);

                    return (
                      <div
                        key={field.key}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="text-sm font-black text-slate-900">
                          {field.label}
                        </div>

                        {field.helpText ? (
                          <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                            {field.helpText}
                          </div>
                        ) : null}

                        <div className="mt-3 grid gap-2">
                          <label
                            className={[
                              "flex items-start gap-3 rounded-2xl border p-3 transition",
                              currentValue === true
                                ? "border-indigo-200 bg-indigo-50"
                                : "border-slate-200 bg-white",
                            ].join(" ")}
                          >
                            <input
                              type="radio"
                              name={field.key}
                              checked={currentValue === true}
                              onChange={() => setConsentValue(fieldKey, true)}
                              disabled={loading}
                              className="mt-1 h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-black text-slate-900">
                                Oui, j’accepte
                              </div>
                            </div>
                          </label>

                          <label
                            className={[
                              "flex items-start gap-3 rounded-2xl border p-3 transition",
                              currentValue === false
                                ? "border-indigo-200 bg-indigo-50"
                                : "border-slate-200 bg-white",
                            ].join(" ")}
                          >
                            <input
                              type="radio"
                              name={field.key}
                              checked={currentValue === false}
                              onChange={() => setConsentValue(fieldKey, false)}
                              disabled={loading}
                              className="mt-1 h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-black text-slate-900">
                                Non, je refuse
                              </div>
                            </div>
                          </label>
                        </div>

                        {currentValue === null ? (
                          <div className="mt-3 text-xs font-bold text-amber-700">
                            Aucun choix enregistré pour le moment.
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <label className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                {config.otherPreferences.label}
              </span>

              <textarea
                className="min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 placeholder:text-slate-400 outline-none resize-y focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.otherPreferences}
                onChange={(e) =>
                  onChange({
                    otherPreferences: config.otherPreferences.maxLength
                      ? e.target.value.slice(
                          0,
                          config.otherPreferences.maxLength,
                        )
                      : e.target.value,
                  })
                }
                placeholder={config.otherPreferences.placeholder}
                disabled={loading}
              />

              {config.otherPreferences.helpText ? (
                <div className="text-xs font-bold leading-5 text-slate-600">
                  {config.otherPreferences.helpText}
                </div>
              ) : null}

              {config.otherPreferences.maxLength ? (
                <div className="text-[11px] font-extrabold text-slate-400 text-right">
                  {value.otherPreferences.length}/
                  {config.otherPreferences.maxLength}
                </div>
              ) : null}
            </label>
          </div>
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              type="submit"
              form="preferences-form"
              className={[
                "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                loading
                  ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                  : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
              disabled={loading}
            >
              <ArrowRight size={18} />
              {loading ? "Enregistrement..." : "Enregistrer mes choix"}
            </button>
          </div>
        </div>
      </footer>
    </form>
  );
}