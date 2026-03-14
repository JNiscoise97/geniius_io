import { AlertTriangle, Mail } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ContactOrganizerForm,
  type ContactOrganizerFormValues,
} from "../components/ContactOrganizerForm";
import { contactOrganizerFormConfig } from "../config/contactOrganizerFormConfig";
import { saveOrganizerMessage } from "../api/saveOrganizerMessage";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { getParticipantContactProfile } from "../api/getParticipantContactProfile";

const INITIAL_VALUES: ContactOrganizerFormValues = {
  topic: "",
  message: "",
  wantsReply: false,
  phone: "",
  email: "",
  hasWhatsapp: false,
  messenger: "",
  preferredContactChannels: [],
};

function hasAtLeastOneRequiredContact(values: ContactOrganizerFormValues): boolean {
  return Boolean(values.phone.trim() || values.email.trim());
}

export function ParticipantContactOrganizerPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<ContactOrganizerFormValues>(INITIAL_VALUES);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const participantSession = getParticipantSession(slug);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!participantSession?.participantId) {
        setLoadingProfile(false);
        return;
      }

      try {
        const profile = await getParticipantContactProfile(
          participantSession.participantId,
        );

        if (!mounted || !profile) return;

        const wantsReply = Boolean(
          profile.phone ||
            profile.email ||
            profile.messenger ||
            profile.preferredContactChannels.length > 0,
        );

        setValues((prev) => ({
          ...prev,
          phone: profile.phone ?? "",
          email: profile.email ?? "",
          hasWhatsapp: profile.hasWhatsapp,
          messenger: profile.messenger ?? "",
          preferredContactChannels: profile.preferredContactChannels,
          wantsReply,
        }));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Impossible de charger tes coordonnées.");
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [participantSession?.participantId]);

  function validate(): string | null {
    if (!values.topic) {
      return "Merci de choisir le sujet de ton message.";
    }

    if (!values.message.trim()) {
      return "Merci d’écrire ton message.";
    }

    if (values.message.trim().length < 5) {
      return "Ton message semble un peu trop court.";
    }

    if (values.wantsReply) {
      if (!hasAtLeastOneRequiredContact(values)) {
        return "Merci d’indiquer au moins un contact : téléphone ou email.";
      }

      if (values.preferredContactChannels.length === 0) {
        return "Choisis au moins un moyen de contact à privilégier.";
      }

      if (
        values.preferredContactChannels.includes("sms") &&
        !values.phone.trim()
      ) {
        return "Un numéro de téléphone est nécessaire pour le SMS.";
      }

      if (
        values.preferredContactChannels.includes("whatsapp") &&
        (!values.phone.trim() || !values.hasWhatsapp)
      ) {
        return "Pour WhatsApp, indique un téléphone et active l’option correspondante.";
      }

      if (
        values.preferredContactChannels.includes("email") &&
        !values.email.trim()
      ) {
        return "Une adresse email est nécessaire pour l’envoi par email.";
      }

      if (
        values.preferredContactChannels.includes("messenger") &&
        !values.messenger.trim()
      ) {
        return "Un identifiant Messenger est nécessaire pour ce canal.";
      }

      if (values.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(values.email.trim())) {
          return "Merci de renseigner une adresse email valide.";
        }
      }
    }

    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setLoading(true);
    try {
      await saveOrganizerMessage({
        eventSlug: slug,
        participantId: participantSession?.participantId ?? null,
        senderFirstName: participantSession?.firstName ?? null,
        senderLastName: participantSession?.lastName ?? null,
        values,
      });

      nav(`/e/${slug}/welcome/confirmation?step=organizer-message`, {
        replace: true,
      });
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-4 pb-28">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
            <Mail size={14} />
            Message organisateur
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            {contactOrganizerFormConfig.title}
          </h1>

          <p className="mt-2 text-sm font-bold text-slate-700">
            {contactOrganizerFormConfig.subtitle}
          </p>

          <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
            {contactOrganizerFormConfig.introText}
          </p>
        </section>

        {error ? (
          <div className="mt-4 rounded-[24px] border border-[rgba(220,38,38,0.22)] bg-white p-4 shadow-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 text-[color:var(--bad)]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="font-black text-slate-900">Oups</div>
                <div className="text-sm font-bold text-slate-700">{error}</div>
              </div>
            </div>
          </div>
        ) : null}

        <ContactOrganizerForm
          config={contactOrganizerFormConfig}
          value={values}
          loading={loading || loadingProfile}
          error={error}
          onChange={(patch) =>
            setValues((prev) => ({
              ...prev,
              ...patch,
            }))
          }
          onSubmit={onSubmit}
        />
      </main>
    </div>
  );
}