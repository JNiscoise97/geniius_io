import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { FormEvent } from "react";
import type { ContactFormConfig } from "../config/contactFormConfig";
import { ConsentField } from "./ConsentField";

export type ContactFormValues = {
  phone: string;
  email: string;
  allowContact: boolean;
  allowPhotosShare: boolean;
  allowFamilyNews: boolean;
};

type ContactFormProps = {
  config: ContactFormConfig;
  value: ContactFormValues;
  loading?: boolean;
  onChange: (patch: Partial<ContactFormValues>) => void;
  onSubmit: (e: FormEvent) => void;
};

export function ContactForm({
  config,
  value,
  loading = false,
  onChange,
  onSubmit,
}: ContactFormProps) {
  return (
    <form id="contact-form" onSubmit={onSubmit} className="mt-3">
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

          <div className="mt-4 grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                {config.fields.phone.label}
                {config.fields.phone.required ? "*" : ""}
              </span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder={config.fields.phone.placeholder}
                disabled={loading}
                inputMode="tel"
                autoComplete="tel"
              />
              {config.fields.phone.helpText ? (
                <div className="text-xs font-bold leading-5 text-slate-600">
                  {config.fields.phone.helpText}
                </div>
              ) : null}
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                {config.fields.email.label}
                {config.fields.email.required ? "*" : ""}
              </span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.email}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder={config.fields.email.placeholder}
                disabled={loading}
                inputMode="email"
                autoComplete="email"
              />
              {config.fields.email.helpText ? (
                <div className="text-xs font-bold leading-5 text-slate-600">
                  {config.fields.email.helpText}
                </div>
              ) : null}
            </label>

            <div className="grid gap-2 pt-1">
              {config.consents.map((option) => (
                <ConsentField
                  key={option.key}
                  option={option}
                  checked={
                    option.key === "allow_contact"
                      ? value.allowContact
                      : option.key === "allow_photos_share"
                        ? value.allowPhotosShare
                        : value.allowFamilyNews
                  }
                  disabled={loading}
                  onChange={(checked) => {
                    if (option.key === "allow_contact") {
                      onChange({ allowContact: checked });
                      return;
                    }
                    if (option.key === "allow_photos_share") {
                      onChange({ allowPhotosShare: checked });
                      return;
                    }
                    onChange({ allowFamilyNews: checked });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              type="submit"
              form="contact-form"
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

            <div className="mt-2 px-1 text-[11px] font-extrabold text-slate-700 flex items-center justify-between">
              <span>Étape 3 sur 3</span>
              <span className="text-slate-900">{loading ? "…" : "Prêt"}</span>
            </div>
          </div>
        </div>
      </footer>
    </form>
  );
}