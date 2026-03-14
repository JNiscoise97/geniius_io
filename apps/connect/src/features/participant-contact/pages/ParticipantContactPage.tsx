import { AlertTriangle, Contact } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ContactForm,
  type ContactFormValues,
} from "../components/ContactForm";
import { contactFormConfig } from "../config/contactFormConfig";
import { saveContact } from "../api/saveContact";
import { getContact } from "../api/getContact";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";



export function ParticipantContactPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<ContactFormValues>({
    phone: "",
    email: "",
    allowContact: false,
    allowPhotosShare: false,
    allowFamilyNews: false,
  });

  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  

  useEffect(() => {
    let isMounted = true;

    async function loadExistingData() {
      const participantSession = getParticipantSession(slug);

      if (!participantSession?.participantId) {
        if (isMounted) {
          setLoadingInitialData(false);
        }
        return;
      }

      try {
        const existing = await getContact({
          participantId: participantSession.participantId,
        });

        if (!isMounted) return;

        if (existing) {
          setValues(existing);
        }
      } catch (e: any) {
        if (!isMounted) return;
        setError(
          e?.message ?? "Impossible de charger les informations existantes.",
        );
      } finally {
        if (isMounted) {
          setLoadingInitialData(false);
        }
      }
    }

    void loadExistingData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  function validate(): string | null {
    if (values.email.trim()) {
      const email = values.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return "Merci de renseigner une adresse email valide.";
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
    if (!participantSession?.participantId) {
      setError(
        "Nous n’avons pas retrouvé ton identification. Merci de commencer par te présenter.",
      );
      return;
    }

    setLoading(true);
    try {
      await saveContact({
        participantId: participantSession.participantId,
        values,
      });

      localStorage.setItem(`connect:${slug}:onboarding:contact`, "done");

      nav(`/e/${slug}/welcome/confirmation?step=contact`, { replace: true });
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
            <Contact size={18} className="text-slate-800" />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-black tracking-tight text-slate-900">
              {contactFormConfig.title}
            </div>
            <div className="text-xs font-bold text-slate-700">
              Tu choisis simplement ce que tu veux partager
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

        {loadingInitialData ? (
          <section className="mt-3 rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-700">
              Chargement de tes informations…
            </div>
          </section>
        ) : (
          <ContactForm
            config={contactFormConfig}
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
        )}
      </main>
    </div>
  );
}