import { AlertTriangle, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  IdentityForm,
  type IdentityFormValues,
} from "../components/IdentityForm";
import { identityFormConfig } from "../config/identityFormConfig";
import { saveIdentity } from "../api/saveIdentity";
import { getIdentity } from "../api/getIdentity";
import { addStoredParticipantProfile } from "../../../lib/participant-session/addStoredParticipantProfile";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";

const INITIAL_VALUES: IdentityFormValues = {
  firstName: "",
  lastName: "",
  nickname: "",
  birthYear: "",
  phone: "",
  email: "",
  hasWhatsapp: false,
  messenger: "",
  preferredContactChannels: [],
  branchKeys: [],
  previousEditionKeys: [],
};

function hasAtLeastOneRequiredContact(values: IdentityFormValues): boolean {
  return Boolean(values.phone.trim() || values.email.trim());
}

export function ParticipantIdentityPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<IdentityFormValues>(INITIAL_VALUES);
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
        const existing = await getIdentity({
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
    if (!values.firstName.trim()) return "Merci d’indiquer ton prénom.";
    if (!values.lastName.trim()) return "Merci d’indiquer ton nom.";

    if (values.birthYear.trim()) {
      if (!/^\d{4}$/.test(values.birthYear.trim())) {
        return "L’année de naissance doit contenir 4 chiffres.";
      }

      const year = Number(values.birthYear);
      const currentYear = new Date().getFullYear();

      if (!Number.isFinite(year) || year < 1900 || year > currentYear) {
        return "Merci de renseigner une année de naissance valide.";
      }
    }

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
      const participantSession = getParticipantSession(slug);

      const result = await saveIdentity({
        eventSlug: slug,
        participantId: participantSession?.participantId ?? null,
        values,
      });

      addStoredParticipantProfile(slug, {
        participantId: result.participantId,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        birthYear: values.birthYear,
        recoveryToken: result.recoveryToken ?? undefined,
        remembered: true,
        setAsActive: true,
      });

      localStorage.setItem(
        `connect:${slug}:participant`,
        JSON.stringify({
          participantId: result.participantId,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          birthYear: values.birthYear,
          recoveryToken: result.recoveryToken ?? undefined,
        }),
      );

      localStorage.setItem(`connect:${slug}:onboarding:identity`, "done");

      nav(`/e/${slug}/welcome/confirmation?step=identity`, { replace: true });
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
            <Users size={18} className="text-slate-800" />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-black tracking-tight text-slate-900">
              {identityFormConfig.title}
            </div>
            <div className="text-xs font-bold text-slate-700">
              Quelques informations simples pour commencer
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
          <IdentityForm
            config={identityFormConfig}
            value={values}
            loading={loading}
            error={error}
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