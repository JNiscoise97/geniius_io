import { ArrowRight } from "lucide-react";
import type { FormEvent } from "react";
import type {
  ContactOrganizerFormConfig,
  OrganizerMessageTopic,
  ReplyPreference,
} from "../config/contactOrganizerFormConfig";

export type ContactOrganizerFormValues = {
  topic: OrganizerMessageTopic | "";
  message: string;
  wantsReply: boolean;
  replyPreference: ReplyPreference | "";
  email: string;
  phone: string;
  whatsapp: string;
  messenger: string;
};

type ContactOrganizerFormProps = {
  config: ContactOrganizerFormConfig;
  value: ContactOrganizerFormValues;
  loading?: boolean;
  onChange: (patch: Partial<ContactOrganizerFormValues>) => void;
  onSubmit: (e: FormEvent) => void;
};

export function ContactOrganizerForm({
  config,
  value,
  loading = false,
  onChange,
  onSubmit,
}: ContactOrganizerFormProps) {
  return (
    <form id="contact-organizer-form" onSubmit={onSubmit} className="mt-3">
      <section className="rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
        <div className="p-4">
          <div className="mt-4 grid gap-4">
            <label className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                {config.fields.topic.label}
              </span>

              <select
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.topic}
                onChange={(e) =>
                  onChange({
                    topic: e.target.value as OrganizerMessageTopic | "",
                  })
                }
                disabled={loading}
              >
                <option value="">Choisir</option>
                {config.topicOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>

              {config.fields.topic.helpText ? (
                <div className="text-xs font-bold leading-5 text-slate-600">
                  {config.fields.topic.helpText}
                </div>
              ) : null}
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                {config.fields.message.label}
              </span>

              <textarea
                className="min-h-[140px] rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 placeholder:text-slate-400 outline-none resize-y focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.message}
                onChange={(e) =>
                  onChange({
                    message: config.fields.message.maxLength
                      ? e.target.value.slice(0, config.fields.message.maxLength)
                      : e.target.value,
                  })
                }
                placeholder={config.fields.message.placeholder}
                disabled={loading}
              />

              {config.fields.message.helpText ? (
                <div className="text-xs font-bold leading-5 text-slate-600">
                  {config.fields.message.helpText}
                </div>
              ) : null}

              {config.fields.message.maxLength ? (
                <div className="text-[11px] font-extrabold text-slate-400 text-right">
                  {value.message.length}/{config.fields.message.maxLength}
                </div>
              ) : null}
            </label>

            <div className="grid gap-2">
              <div className="text-xs font-extrabold text-slate-800">
                {config.fields.wantsReply.label}
              </div>

              {config.fields.wantsReply.helpText ? (
                <div className="text-xs font-bold leading-5 text-slate-600">
                  {config.fields.wantsReply.helpText}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={[
                    "h-12 rounded-2xl border font-extrabold transition",
                    value.wantsReply
                      ? "border-indigo-200 bg-indigo-50 text-slate-900"
                      : "border-slate-200 bg-white text-slate-700",
                  ].join(" ")}
                  onClick={() => onChange({ wantsReply: true })}
                  disabled={loading}
                >
                  Oui
                </button>

                <button
                  type="button"
                  className={[
                    "h-12 rounded-2xl border font-extrabold transition",
                    !value.wantsReply
                      ? "border-indigo-200 bg-indigo-50 text-slate-900"
                      : "border-slate-200 bg-white text-slate-700",
                  ].join(" ")}
                  onClick={() =>
                    onChange({
                      wantsReply: false,
                      replyPreference: "",
                      email: "",
                      phone: "",
                      whatsapp: "",
                      messenger: "",
                    })
                  }
                  disabled={loading}
                >
                  Non
                </button>
              </div>
            </div>

            {value.wantsReply ? (
              <>
                <label className="grid gap-1">
                  <span className="text-xs font-extrabold text-slate-800">
                    {config.fields.replyPreference.label}
                  </span>

                  <select
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    value={value.replyPreference}
                    onChange={(e) =>
                      onChange({
                        replyPreference: e.target.value as ReplyPreference | "",
                      })
                    }
                    disabled={loading}
                  >
                    <option value="">Choisir</option>
                    {config.replyPreferenceOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {config.fields.replyPreference.helpText ? (
                    <div className="text-xs font-bold leading-5 text-slate-600">
                      {config.fields.replyPreference.helpText}
                    </div>
                  ) : null}
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-extrabold text-slate-800">
                    {config.fields.email.label}
                  </span>
                  <input
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    value={value.email}
                    onChange={(e) => onChange({ email: e.target.value })}
                    placeholder={config.fields.email.placeholder}
                    disabled={loading}
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-extrabold text-slate-800">
                    {config.fields.phone.label}
                  </span>
                  <input
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    value={value.phone}
                    onChange={(e) => onChange({ phone: e.target.value })}
                    placeholder={config.fields.phone.placeholder}
                    disabled={loading}
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-extrabold text-slate-800">
                    {config.fields.whatsapp.label}
                  </span>
                  <input
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    value={value.whatsapp}
                    onChange={(e) => onChange({ whatsapp: e.target.value })}
                    placeholder={config.fields.whatsapp.placeholder}
                    disabled={loading}
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-extrabold text-slate-800">
                    {config.fields.messenger.label}
                  </span>
                  <input
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    value={value.messenger}
                    onChange={(e) => onChange({ messenger: e.target.value })}
                    placeholder={config.fields.messenger.placeholder}
                    disabled={loading}
                  />
                </label>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              type="submit"
              form="contact-organizer-form"
              className={[
                "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                loading
                  ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                  : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
              disabled={loading}
            >
              <ArrowRight size={18} />
              {loading ? "Envoi..." : "Envoyer le message"}
            </button>
          </div>
        </div>
      </footer>
    </form>
  );
}