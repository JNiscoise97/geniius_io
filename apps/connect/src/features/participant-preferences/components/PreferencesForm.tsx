import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import type { FormEvent } from "react";
import type { PreferencesFormConfig } from "../config/preferencesFormConfig";

export type PreferencesFormValues = {
  allowFamilyPhotoSharing: boolean;
  allowNameInFamilyTree: boolean;
  allowPhotoInFamilyTree: boolean;
  allowInfoInFamilyTree: boolean;
  allowCousinsContact: boolean;
  allowFamilyNews: boolean;
  allowEventPhotosReceive: boolean;
  allowFutureEvents: boolean;
  otherPreferences: string;
};

type PreferencesFormProps = {
  config: PreferencesFormConfig;
  value: PreferencesFormValues;
  loading?: boolean;
  onChange: (patch: Partial<PreferencesFormValues>) => void;
  onSubmit: (e: FormEvent) => void;
};

export function PreferencesForm({
  config,
  value,
  loading = false,
  onChange,
  onSubmit,
}: PreferencesFormProps) {
  function getBooleanValue(key: string): boolean {
    switch (key) {
      case "allowFamilyPhotoSharing":
        return value.allowFamilyPhotoSharing;
      case "allowNameInFamilyTree":
        return value.allowNameInFamilyTree;
      case "allowPhotoInFamilyTree":
        return value.allowPhotoInFamilyTree;
      case "allowInfoInFamilyTree":
        return value.allowInfoInFamilyTree;
      case "allowCousinsContact":
        return value.allowCousinsContact;
      case "allowFamilyNews":
        return value.allowFamilyNews;
      case "allowEventPhotosReceive":
        return value.allowEventPhotosReceive;
      case "allowFutureEvents":
        return value.allowFutureEvents;
      default:
        return false;
    }
  }

  function setBooleanValue(key: string, checked: boolean) {
    switch (key) {
      case "allowFamilyPhotoSharing":
        onChange({ allowFamilyPhotoSharing: checked });
        break;
      case "allowNameInFamilyTree":
        onChange({ allowNameInFamilyTree: checked });
        break;
      case "allowPhotoInFamilyTree":
        onChange({ allowPhotoInFamilyTree: checked });
        break;
      case "allowInfoInFamilyTree":
        onChange({ allowInfoInFamilyTree: checked });
        break;
      case "allowCousinsContact":
        onChange({ allowCousinsContact: checked });
        break;
      case "allowFamilyNews":
        onChange({ allowFamilyNews: checked });
        break;
      case "allowEventPhotosReceive":
        onChange({ allowEventPhotosReceive: checked });
        break;
      case "allowFutureEvents":
        onChange({ allowFutureEvents: checked });
        break;
    }
  }

  return (

    <><div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3'>
      <div className='flex items-start gap-3'>
        <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
        <div className='min-w-0'>
          <div className='text-sm font-semibold text-amber-900'>Chantiers en cours</div>
          <div className='mt-0.5 text-xs text-amber-800'>
            <ol>
              <li>Ajouter un bouton retour</li>
              <li>Revoir toutes les préférences</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
    <form id="preferences-form" onSubmit={onSubmit} className="mt-3">
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
              {config.sections.map((section) => (
                <div key={section.key} className="grid gap-2">
                  <div className="text-sm font-black text-slate-900">
                    {section.title}
                  </div>

                  <div className="grid gap-2">
                    {section.fields.map((field) => {
                      const checked = getBooleanValue(field.key);

                      return (
                        <label
                          key={field.key}
                          className={[
                            "flex items-start gap-3 rounded-2xl border p-3 transition",
                            checked
                              ? "border-indigo-200 bg-indigo-50"
                              : "border-slate-200 bg-white",
                            loading ? "opacity-70" : "",
                          ].join(" ")}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={checked}
                            onChange={(e) => setBooleanValue(field.key, e.target.checked)}
                            disabled={loading} />

                          <div className="min-w-0">
                            <div className="text-sm font-black text-slate-900">
                              {field.label}
                            </div>
                            {field.helpText ? (
                              <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                                {field.helpText}
                              </div>
                            ) : null}
                          </div>
                        </label>
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
                  onChange={(e) => onChange({
                    otherPreferences: config.otherPreferences.maxLength
                      ? e.target.value.slice(0, config.otherPreferences.maxLength)
                      : e.target.value,
                  })}
                  placeholder={config.otherPreferences.placeholder}
                  disabled={loading} />

                {config.otherPreferences.helpText ? (
                  <div className="text-xs font-bold leading-5 text-slate-600">
                    {config.otherPreferences.helpText}
                  </div>
                ) : null}

                {config.otherPreferences.maxLength ? (
                  <div className="text-[11px] font-extrabold text-slate-400 text-right">
                    {value.otherPreferences.length}/{config.otherPreferences.maxLength}
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
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </footer>
      </form></>
  );
}