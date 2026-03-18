import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { syncLegacyParticipantStorage } from "../../../lib/participant-session/syncLegacyParticipantStorage";
import {
  getParticipantAccessRecoverConfirmPath,
  getParticipantHomePath,
} from "../config/participantAccessRoutes";
import { findParticipantByEmail } from "../api/findParticipantByEmail";

function hasOptionalContact(values: ParticipantAccessCreateValues): boolean {
  return Boolean(values.phone?.trim() || values.messenger?.trim());
}

export function ParticipantAccessCreatePage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const prefilledEmail = searchParams.get("email")?.trim() ?? "";

  const [values, setValues] = useState<ParticipantAccessCreateValues>({
    firstName: "",
    lastName: "",
    birthYear: "",
    phone: "",
    email: prefilledEmail,
    hasWhatsapp: false,
    messenger: "",
    preferredContactChannels: [],
  });

  useEffect(() => {
    if (!prefilledEmail) return;

    setValues((prev) => {
      if (prev.email?.trim()) return prev;
      return { ...prev, email: prefilledEmail };
    });
  }, [prefilledEmail]);

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

    if (!/^\d{4}$/.test(values.birthYear.trim())) {
      return "Merci d’indiquer ton année de naissance sur 4 chiffres.";
    }

    if (!values.email?.trim()) {
      return "Merci d’indiquer ton email. Il est nécessaire pour recevoir ton lien personnel.";
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
      values.preferredContactChannels.includes("messenger") &&
      !values.messenger?.trim()
    ) {
      return "Un identifiant Messenger est nécessaire pour ce canal.";
    }

    if (
      hasOptionalContact(values) &&
      values.preferredContactChannels.length === 0
    ) {
      return "Choisis un moyen de contact à privilégier pour les prochains échanges.";
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
        email: participant.email ?? "",
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

      syncLegacyParticipantStorage(participant.eventSlug, {
        participantId: participant.participantId,
        firstName: participant.firstName,
        lastName: participant.lastName,
        birthYear: participant.birthYear,
        recoveryToken: recovery.recoveryToken,
      });

      navigate(getParticipantHomePath(participant.eventSlug), { replace: true });
    } catch (e: any) {
      const message = e?.message ?? "";

      // 🧠 Cas email déjà existant (duplicate key ou erreur custom)
      if (
        message.toLowerCase().includes("duplicate") ||
        message.toLowerCase().includes("email")
      ) {
        try {
          const existing = await findParticipantByEmail({
            eventSlug: slug,
            email: values.email,
          });

          if (existing.found) {
            navigate(
              `${getParticipantAccessRecoverConfirmPath(existing.eventSlug)}?participantId=${encodeURIComponent(existing.participantId)}`,
              {
                replace: true,
                state: {
                  email: existing.email,
                  maskedDisplayName: existing.maskedDisplayName,
                  fromCreateConflict: true, // 🔥 IMPORTANT
                },
              },
            );
            return;
          }
        } catch (innerError) {
          console.error(innerError);
        }
      }

      setError("Impossible de créer le profil.");
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