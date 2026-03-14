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

export function ParticipantContactOrganizerPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<ContactOrganizerFormValues>({
    topic: "",
    message: "",
    wantsReply: false,
    replyPreference: "",
    email: "",
    phone: "",
    whatsapp: "",
    messenger: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  

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
      if (!values.replyPreference) {
        return "Merci de choisir le moyen de contact que tu préfères.";
      }

      const hasAnyContact =
        values.email.trim() ||
        values.phone.trim() ||
        values.whatsapp.trim() ||
        values.messenger.trim();

      if (!hasAnyContact) {
        return "Merci d’indiquer au moins un moyen de contact.";
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

    const participantSession = getParticipantSession(slug);

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
      <main className="c-container pt-3 pb-28">
        <div className="flex items-center gap-3 px-1">
          <div className="h-11 w-11 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
            <Mail size={18} className="text-slate-800" />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-black tracking-tight text-slate-900">
              {contactOrganizerFormConfig.title}
            </div>
            <div className="text-xs font-bold text-slate-700">
              Une question pratique ou un besoin particulier ?
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-2xl bg-white shadow-sm border border-[rgba(220,38,38,0.22)] p-3">
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
          loading={loading}
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