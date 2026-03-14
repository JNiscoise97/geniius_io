import { AlertTriangle, ArrowRight } from "lucide-react";
import type { FormEvent } from "react";
import { BranchesField } from "./BranchesField";
import { PreviousEditionsField } from "./PreviousEditionsField";
import {
  ContactChannelCheckboxGroup,
  type ContactChannel,
} from "../../participant-access/components/ContactChannelCheckboxGroup";
import type { IdentityFormConfig } from "../config/identityFormConfig";

export type IdentityFormValues = {
  firstName: string;
  lastName: string;
  nickname: string;
  birthYear: string;
  phone: string;
  email: string;
  hasWhatsapp: boolean;
  messenger: string;
  preferredContactChannels: ContactChannel[];
  branchKeys: string[];
  previousEditionKeys: string[];
};

type IdentityFormProps = {
  config: IdentityFormConfig;
  value: IdentityFormValues;
  loading?: boolean;
  error?: string | null;
  onChange: (patch: Partial<IdentityFormValues>) => void;
  onSubmit: (e: FormEvent) => void;
};

function getEnabledChannels(values: IdentityFormValues): ContactChannel[] {
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

export function IdentityForm({
  config,
  value,
  loading = false,
  error = null,
  onChange,
  onSubmit,
}: IdentityFormProps) {
  const enabledChannels = getEnabledChannels(value);

  return (
    <><div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3'>
      <div className='flex items-start gap-3'>
        <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
        <div className='min-w-0'>
          <div className='text-sm font-semibold text-amber-900'>Chantiers en cours</div>
          <div className='mt-0.5 text-xs text-amber-800'>
            <ol>
              <li>Revoir le titre plutôt "Infos générales"</li>
              <li>Sortir les champs branche familiale et déjà venu</li>
              <li>Ajouter un bouton retour permettant de revenir au hub</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
      <form id="identity-form" onSubmit={onSubmit} className="mt-3">
        <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <div className="grid gap-1">
            <span className="text-xs font-extrabold text-slate-800">
              {config.fields.firstName.label}
              {config.fields.firstName.required ? " *" : ""}
            </span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              value={value.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              placeholder={config.fields.firstName.placeholder}
              disabled={loading} />
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-extrabold text-slate-800">
              {config.fields.lastName.label}
              {config.fields.lastName.required ? " *" : ""}
            </span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              value={value.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              onBlur={(e) => onChange({ lastName: e.target.value.trim().toUpperCase() })}
              placeholder={config.fields.lastName.placeholder}
              disabled={loading} />
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-extrabold text-slate-800">
              {config.fields.nickname.label}
              {config.fields.nickname.required ? " *" : ""}
            </span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              value={value.nickname}
              onChange={(e) => onChange({ nickname: e.target.value })}
              placeholder={config.fields.nickname.placeholder}
              disabled={loading} />
            {config.fields.nickname.helpText ? (
              <div className="text-xs font-bold leading-5 text-slate-600">
                {config.fields.nickname.helpText}
              </div>
            ) : null}
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-extrabold text-slate-800">
              {config.fields.birthYear.label}
              {config.fields.birthYear.required ? " *" : ""}
            </span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              value={value.birthYear}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                onChange({ birthYear: digits });
              }}
              inputMode="numeric"
              pattern="\d*"
              maxLength={4}
              placeholder={config.fields.birthYear.placeholder}
              disabled={loading} />
            {config.fields.birthYear.helpText ? (
              <div className="text-xs font-bold leading-5 text-slate-600">
                {config.fields.birthYear.helpText}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <div className="text-[16px] font-black text-slate-900">
            Coordonnées
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-extrabold text-slate-800">
              {config.fields.phone.label}
            </span>
            <input
              value={value.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              className="h-12 rounded-2xl border border-slate-200 px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              placeholder={config.fields.phone.placeholder}
              inputMode="tel"
              disabled={loading} />
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={value.hasWhatsapp}
              onChange={(e) => {
                onChange({ hasWhatsapp: e.target.checked });

                if (!e.target.checked) {
                  onChange({
                    preferredContactChannels: value.preferredContactChannels.filter(
                      (channel) => channel !== "whatsapp"
                    ),
                  });
                }
              }}
              disabled={loading || !value.phone.trim()}
              className="mt-1" />
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
            <span className="text-xs font-extrabold text-slate-800">
              {config.fields.email.label}
            </span>
            <input
              value={value.email}
              onChange={(e) => onChange({ email: e.target.value })}
              className="h-12 rounded-2xl border border-slate-200 px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              placeholder={config.fields.email.placeholder}
              inputMode="email"
              disabled={loading} />
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-extrabold text-slate-800">
              {config.fields.messenger.label}
            </span>
            <input
              value={value.messenger}
              onChange={(e) => onChange({ messenger: e.target.value })}
              className="h-12 rounded-2xl border border-slate-200 px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              placeholder={config.fields.messenger.placeholder}
              disabled={loading} />
          </div>

          <div className="grid gap-2">
            <span className="text-xs font-extrabold text-slate-800">
              {config.fields.preferredContactChannels.label}
            </span>

            <ContactChannelCheckboxGroup
              value={value.preferredContactChannels}
              enabledChannels={enabledChannels}
              onChange={(next) => onChange({ preferredContactChannels: next })} />

            {config.fields.preferredContactChannels.helpText ? (
              <div className="text-xs font-bold leading-5 text-slate-600">
                {config.fields.preferredContactChannels.helpText}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <BranchesField
            label={config.fields.branches.label}
            helpText={config.fields.branches.helpText}
            options={config.fields.branches.options}
            value={value.branchKeys}
            disabled={loading}
            onChange={(next) => onChange({ branchKeys: next })} />

          <PreviousEditionsField
            label={config.fields.previousEditions.label}
            helpText={config.fields.previousEditions.helpText}
            options={config.fields.previousEditions.options}
            value={value.previousEditionKeys}
            disabled={loading}
            onChange={(next) => onChange({ previousEditionKeys: next })} />

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
                form="identity-form"
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
      </form></>
  );
}