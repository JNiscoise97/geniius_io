import { AlertTriangle, ArrowLeft, Users } from "lucide-react";
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
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getMyPersonIdentityClaim } from "../../family-tree/api/getMyPersonIdentityClaim";

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
};

function hasOptionalContact(values: IdentityFormValues): boolean {
  return Boolean(values.phone.trim() || values.messenger.trim());
}

function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function ParticipantIdentityPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<IdentityFormValues>(INITIAL_VALUES);
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [myIdentityClaimStatus, setMyIdentityClaimStatus] = useState<
    "pending" | "approved" | "rejected" | "auto_verified" | null
  >(null);
  const [claimedPersonId, setClaimedPersonId] = useState<string | null>(null);
  const [loadingClaim, setLoadingClaim] = useState(true);

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  useEffect(() => {
    let isMounted = true;

    async function loadIdentityClaim() {
      if (!participantId) {
        if (isMounted) {
          setMyIdentityClaimStatus(null);
          setClaimedPersonId(null);
          setLoadingClaim(false);
        }
        return;
      }

      try {
        const identityClaim = await getMyPersonIdentityClaim({
          eventSlug: slug,
          participantId,
        });

        if (!isMounted) return;

        setMyIdentityClaimStatus(identityClaim?.claim_status ?? null);
        setClaimedPersonId(identityClaim?.person_id ?? null);
      } catch {
        if (!isMounted) return;
        setMyIdentityClaimStatus(null);
        setClaimedPersonId(null);
      } finally {
        if (isMounted) {
          setLoadingClaim(false);
        }
      }
    }

    void loadIdentityClaim();

    return () => {
      isMounted = false;
    };
  }, [participantId, slug]);

  useEffect(() => {
    if (!participantId) return;

    const tracker = createPageTimeTracker({
      participantId,
      eventSlug: slug,
      pageKey: `/e/${slug}/welcome/identity`,
    });

    tracker.start();

    return () => {
      void tracker.stop();
    };
  }, [participantId, slug]);

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
    if (!values.firstName.trim()) {
      return "Merci d’indiquer ton prénom.";
    }

    if (!values.lastName.trim()) {
      return "Merci d’indiquer ton nom.";
    }

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

    if (values.email.trim() && !isEmailValid(values.email)) {
      return "Merci de renseigner une adresse email valide.";
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
      values.preferredContactChannels.includes("messenger") &&
      !values.messenger.trim()
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

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setLoading(true);

    try {
      const participantSession = getParticipantSession(slug);
      const hasVerifiedClaim =
        myIdentityClaimStatus === "approved" ||
        myIdentityClaimStatus === "auto_verified";
      const result = await saveIdentity({
        eventSlug: slug,
        participantId: participantSession?.participantId ?? null,
        values,
        hasVerifiedClaim,
        claimedPersonId,
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
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
              <Users size={14} />
              Identification
            </div>

            <button
              type="button"
              onClick={() => nav(`/e/${slug}/welcome`)}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                Retour
              </span>
            </button>
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            {identityFormConfig.title}
          </h1>

          <p className="mt-2 text-sm font-bold text-slate-700">
            Quelques informations utiles pour compléter ton profil.
          </p>
        </section>

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

        {loadingInitialData || loadingClaim ? (
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
