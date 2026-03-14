import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import {
  saveParticipantAccessProfile,
  type ParticipantAccessCreateValues,
} from "../api/saveParticipantAccessProfile";
import { createRecoveryLink } from "../api/createRecoveryLink";
import { sendParticipantRecoveryLink } from "../api/sendParticipantRecoveryLink";
import { ParticipantAccessCreateForm } from "../components/ParticipantAccessCreateForm";
import { createProfileConfig } from "../config/createProfileConfig";
import { addStoredParticipantProfile } from "../../../lib/participant-session/addStoredParticipantProfile";

const INITIAL_VALUES: ParticipantAccessCreateValues = {
  firstName: "",
  lastName: "",
  birthYear: "",
  phone: "",
  email: "",
  hasWhatsapp: false,
  messenger: "",
  preferredContactChannels: [],
};

function hasAtLeastOneRequiredContact(
  values: ParticipantAccessCreateValues,
): boolean {
  return Boolean(values.phone?.trim() || values.email?.trim());
}

export function ParticipantAccessCreatePage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] =
    useState<ParticipantAccessCreateValues>(INITIAL_VALUES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patchValues(patch: Partial<ParticipantAccessCreateValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
  }

  function validate(): string | null {
    if (!values.firstName.trim()) {
      return "Merci d’indiquer ton prénom.";
    }

    if (!values.lastName.trim()) {
      return "Merci d’indiquer ton nom.";
    }

    if (!hasAtLeastOneRequiredContact(values)) {
      return "Merci d’indiquer au moins un contact : téléphone ou email.";
    }

    if (values.preferredContactChannels.length === 0) {
      return "Choisis au moins un moyen de contact à privilégier.";
    }

    if (
      values.preferredContactChannels.includes("sms") &&
      !values.phone?.trim()
    ) {
      return "Un numéro de téléphone est nécessaire pour le SMS.";
    }

    if (
      values.preferredContactChannels.includes("whatsapp") &&
      (!values.phone?.trim() || !values.hasWhatsapp)
    ) {
      return "Pour WhatsApp, indique un téléphone et active l’option correspondante.";
    }

    if (
      values.preferredContactChannels.includes("email") &&
      !values.email?.trim()
    ) {
      return "Une adresse email est nécessaire pour l’envoi par email.";
    }

    if (
      values.preferredContactChannels.includes("messenger") &&
      !values.messenger?.trim()
    ) {
      return "Un identifiant Messenger est nécessaire pour ce canal.";
    }

    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const participant = await saveParticipantAccessProfile({
        eventSlug: slug,
        values,
      });

      const recovery = await createRecoveryLink({
        participantId: participant.participantId,
        eventSlug: participant.eventSlug,
      });

      await sendParticipantRecoveryLink({
        eventSlug: participant.eventSlug,
        participantId: participant.participantId,
        recoveryLink: recovery.recoveryLink,
        firstName: participant.firstName,
        lastName: participant.lastName,
        phone: participant.phone,
        email: participant.email,
        hasWhatsapp: participant.hasWhatsapp,
        messenger: participant.messenger,
        preferredContactChannels: participant.preferredContactChannels,
      });

      addStoredParticipantProfile(participant.eventSlug, {
        participantId: participant.participantId,
        firstName: participant.firstName,
        lastName: participant.lastName,
        birthYear: participant.birthYear,
        recoveryToken: recovery.recoveryToken,
        remembered: true,
        setAsActive: true,
      });

      localStorage.setItem(
        `connect:${participant.eventSlug}:participant`,
        JSON.stringify({
          participantId: participant.participantId,
          firstName: participant.firstName,
          lastName: participant.lastName,
          birthYear: participant.birthYear,
          recoveryToken: recovery.recoveryToken,
        }),
      );

      navigate(`/e/${participant.eventSlug}/home`, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Impossible de créer le profil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-4 pb-28">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
            <ShieldCheck size={14} />
            {createProfileConfig.badge}
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            {createProfileConfig.title}
          </h1>

          <p className="mt-2 text-sm font-bold text-slate-700">
            {createProfileConfig.subtitle}
          </p>

          <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
            {createProfileConfig.helper}
          </p>
        </section>

        <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-black text-slate-900">
            {createProfileConfig.contactTitle}
          </div>

          <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
            {createProfileConfig.contactHelper}
          </p>
        </section>

        <div className="mt-4">
          <ParticipantAccessCreateForm
            values={values}
            loading={loading}
            error={error}
            onChange={patchValues}
            onSubmit={onSubmit}
          />
        </div>
      </main>
    </div>
  );
}