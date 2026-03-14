import { ArrowRight } from "lucide-react";
import type { FormEvent } from "react";
import type {
  ContactOrganizerFormConfig,
  OrganizerMessageTopic,
} from "../config/contactOrganizerFormConfig";
import {
  ContactChannelCheckboxGroup,
  type ContactChannel,
} from "../../participant-access/components/ContactChannelCheckboxGroup";

export type ContactOrganizerFormValues = {
  topic: OrganizerMessageTopic | "";
  message: string;
  wantsReply: boolean;
  phone: string;
  email: string;
  hasWhatsapp: boolean;
  messenger: string;
  preferredContactChannels: ContactChannel[];
};

type ContactOrganizerFormProps = {
  config: ContactOrganizerFormConfig;
  value: ContactOrganizerFormValues;
  loading?: boolean;
  error?: string | null;
  onChange: (patch: Partial<ContactOrganizerFormValues>) => void;
  onSubmit: (e: FormEvent) => void;
};

function getEnabledChannels(
  values: ContactOrganizerFormValues,
): ContactChannel[] {
  const channels: ContactChannel[] = [];

  if (values.phone.trim()) {
    channels.push("sms");
  }

  if (values.phone.trim() && values.hasWhatsapp) {
    channels.push("whatsapp");
  }

  if (values.email.trim()) {
    channels.push("email");
  }

  if (values.messenger.trim()) {
    channels.push("messenger");
  }

  return channels;
}

export function ContactOrganizerForm({
  config,
  value,
  loading = false,
  error = null,
  onChange,
  onSubmit,
}: ContactOrganizerFormProps) {
  const enabledChannels = getEnabledChannels(value);

  return (
    <form id="contact-organizer-form" onSubmit={onSubmit} className="mt-3">
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm space-y-4">
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
      </section>

      <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm space-y-4">
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
                  preferredContactChannels: [],
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
            <div className="grid gap-1">
              <label className="text-xs font-extrabold text-slate-800">
                {config.fields.phone.label}
              </label>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder={config.fields.phone.placeholder}
                disabled={loading}
              />
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={value.hasWhatsapp}
                onChange={(e) => {
                  onChange({ hasWhatsapp: e.target.checked });

                  if (!e.target.checked) {
                    onChange({
                      preferredContactChannels:
                        value.preferredContactChannels.filter(
                          (channel) => channel !== "whatsapp",
                        ),
                    });
                  }
                }}
                disabled={loading || !value.phone.trim()}
                className="mt-1"
              />

              <div>
                <div className="text-sm font-black text-slate-900">
                  {config.fields.hasWhatsapp.label}
                </div>
                {config.fields.hasWhatsapp.helpText ? (
                  <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                    {config.fields.hasWhatsapp.helpText}
                  </div>
                ) : null}
              </div>
            </label>

            <div className="grid gap-1">
              <label className="text-xs font-extrabold text-slate-800">
                {config.fields.email.label}
              </label>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.email}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder={config.fields.email.placeholder}
                disabled={loading}
              />
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-extrabold text-slate-800">
                {config.fields.messenger.label}
              </label>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.messenger}
                onChange={(e) => onChange({ messenger: e.target.value })}
                placeholder={config.fields.messenger.placeholder}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-extrabold text-slate-800">
                {config.fields.preferredContactChannels.label}
              </label>

              <ContactChannelCheckboxGroup
                value={value.preferredContactChannels}
                enabledChannels={enabledChannels}
                onChange={(next) =>
                  onChange({ preferredContactChannels: next })
                }
              />

              {config.fields.preferredContactChannels.helpText ? (
                <div className="text-xs font-bold leading-5 text-slate-600">
                  {config.fields.preferredContactChannels.helpText}
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {error ? (
          <div className="text-sm font-bold text-[color:var(--bad)]">
            {error}
          </div>
        ) : null}
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