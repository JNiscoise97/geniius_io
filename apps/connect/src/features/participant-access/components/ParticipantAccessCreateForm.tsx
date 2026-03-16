import { ArrowRight } from "lucide-react";
import type { FormEvent } from "react";
import {
  ContactChannelCheckboxGroup,
  type ContactChannel,
} from "./ContactChannelCheckboxGroup";
import type { ParticipantAccessCreateValues } from "../api/saveParticipantAccessProfile";

type ParticipantAccessCreateFormProps = {
  values: ParticipantAccessCreateValues;
  loading?: boolean;
  error?: string | null;
  onChange: (patch: Partial<ParticipantAccessCreateValues>) => void;
  onSubmit: (e: FormEvent) => void;
};

function getEnabledChannels(
  values: ParticipantAccessCreateValues,
): ContactChannel[] {
  const channels: ContactChannel[] = [];

  if (values.phone?.trim()) {
    channels.push("sms");
  }

  if (values.phone?.trim() && values.hasWhatsapp) {
    channels.push("whatsapp");
  }

  if (values.messenger?.trim()) {
    channels.push("messenger");
  }

  return channels;
}

export function ParticipantAccessCreateForm({
  values,
  loading = false,
  error = null,
  onChange,
  onSubmit,
}: ParticipantAccessCreateFormProps) {
  const enabledChannels = getEnabledChannels(values);

  return (
    <form onSubmit={onSubmit}>
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="grid gap-1">
          <label className="text-xs font-extrabold text-slate-800">
            Prénom *
          </label>
          <input
            value={values.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className="h-12 rounded-2xl border border-slate-200 px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            placeholder="Ex : Jordan"
            disabled={loading}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-xs font-extrabold text-slate-800">
            Nom *
          </label>
          <input
            value={values.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            onBlur={(e) =>
              onChange({ lastName: e.target.value.trim().toUpperCase() })
            }
            className="h-12 rounded-2xl border border-slate-200 px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            placeholder="Ex : TANJAMA"
            disabled={loading}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-xs font-extrabold text-slate-800">
            Année de naissance
          </label>
          <input
            value={values.birthYear}
            onChange={(e) =>
              onChange({
                birthYear: e.target.value.replace(/\D/g, "").slice(0, 4),
              })
            }
            className="h-12 rounded-2xl border border-slate-200 px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            placeholder="Ex : 1988"
            inputMode="numeric"
            maxLength={4}
            disabled={loading}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-xs font-extrabold text-slate-800">
            Email personnel *
          </label>
          <input
            value={values.email ?? ""}
            onChange={(e) => onChange({ email: e.target.value })}
            className="h-12 rounded-2xl border border-slate-200 px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            placeholder="Ex : toi@email.com"
            inputMode="email"
            disabled={loading}
          />
          <p className="text-xs font-bold leading-5 text-slate-500">
            Cet email est obligatoire. Il sert à t’envoyer ton lien personnel
            d’accès à l’espace famille.
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="text-[16px] font-black text-slate-900">
          Pour les prochains échanges
        </div>

        <div className="text-xs font-bold leading-5 text-slate-600">
          Tu peux indiquer ici les moyens les plus pratiques pour te recontacter
          ensuite au sujet de la cousinade.
        </div>

        <div className="grid gap-1">
          <label className="text-xs font-extrabold text-slate-800">
            Téléphone
          </label>
          <input
            value={values.phone ?? ""}
            onChange={(e) => onChange({ phone: e.target.value })}
            className="h-12 rounded-2xl border border-slate-200 px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            placeholder="Ex : 0692..."
            inputMode="tel"
            disabled={loading}
          />
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="checkbox"
            checked={values.hasWhatsapp}
            onChange={(e) => {
              const checked = e.target.checked;

              onChange({ hasWhatsapp: checked });

              if (!checked) {
                onChange({
                  preferredContactChannels: values.preferredContactChannels.filter(
                    (channel) => channel !== "whatsapp",
                  ),
                });
              }
            }}
            disabled={loading || !values.phone?.trim()}
            className="mt-1"
          />

          <div>
            <div className="text-sm font-black text-slate-900">
              Ce numéro a aussi WhatsApp
            </div>
            <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
              Active cette option seulement si le numéro indiqué pour le
              téléphone peut aussi être utilisé sur WhatsApp.
            </div>
          </div>
        </label>

        <div className="grid gap-1">
          <label className="text-xs font-extrabold text-slate-800">
            Messenger
          </label>
          <input
            value={values.messenger ?? ""}
            onChange={(e) => onChange({ messenger: e.target.value })}
            className="h-12 rounded-2xl border border-slate-200 px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            placeholder="Lien ou identifiant"
            disabled={loading}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-extrabold text-slate-800">
            Moyen à privilégier pour les prochains échanges
          </label>

          <ContactChannelCheckboxGroup
            value={values.preferredContactChannels}
            enabledChannels={enabledChannels}
            onChange={(next) => onChange({ preferredContactChannels: next })}
          />
        </div>

        <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
          <div className="text-xs font-black text-slate-900">
            Envoi du lien personnel
          </div>
          <div className="mt-1 text-xs font-bold leading-5 text-slate-700">
            Le lien personnel d’accès est envoyé par email. Le téléphone,
            WhatsApp et Messenger servent uniquement pour les prochains échanges
            liés à la cousinade.
          </div>
        </section>

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
              disabled={loading}
              className={[
                "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                loading
                  ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                  : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
            >
              <ArrowRight size={18} />
              {loading ? "Création du profil..." : "Créer mon profil"}
            </button>
          </div>
        </div>
      </footer>
    </form>
  );
}