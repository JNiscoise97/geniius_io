import { AlertTriangle } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RecoveryBirthYearForm } from "../components/RecoveryBirthYearForm";
import { RecoverySummaryCard } from "../components/RecoverySummaryCard";
import { accessConfig } from "../config/accessConfig";
import { confirmParticipantRecoveryByParticipantId } from "../api/confirmParticipantRecoveryByParticipantId";
import { addStoredParticipantProfile } from "../../../lib/participant-session/addStoredParticipantProfile";
import { syncLegacyParticipantStorage } from "../../../lib/participant-session/syncLegacyParticipantStorage";
import { createRecoveryLink } from "../api/createRecoveryLink";
import {
  getParticipantAccessRecoverPath,
  getParticipantHomePath,
} from "../config/participantAccessRoutes";
import { resendParticipantRecoveryLink } from "../api/resendParticipantRecoveryLink";
import { sendParticipantConnection } from "../api/sendParticipantConnection";

type RecoverConfirmLocationState = {
  email?: string;
  maskedDisplayName?: string;
  fromCreateConflict?: boolean;
} | null;

export function ParticipantRecoverConfirmPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const state = (location.state as RecoverConfirmLocationState) ?? null;

  const [searchParams] = useSearchParams();
  const participantId = searchParams.get("participantId")?.trim() ?? "";
  const email = state?.email?.trim() ?? "";
  const maskedDisplayName = state?.maskedDisplayName?.trim() ?? "Profil familial";
  const fromCreateConflict = state?.fromCreateConflict === true;

  const [birthYear, setBirthYear] = useState("");
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const pageError = useMemo(() => {
    if (!participantId) {
      return "Impossible de poursuivre la récupération de ce profil.";
    }
    return null;
  }, [participantId]);

  function validate(): string | null {
    if (!participantId) {
      return "Impossible de poursuivre la récupération de ce profil.";
    }

    if (!/^\d{4}$/.test(birthYear.trim())) {
      return "Merci d’indiquer une année de naissance sur 4 chiffres.";
    }

    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setLoadingConfirm(true);

    try {
      const result = await confirmParticipantRecoveryByParticipantId({
        participantId,
        birthYear,
      });

      if (!result) {
        setFormError("L’année de naissance ne correspond pas à ce profil.");
        return;
      }

      let recoveryToken = result.recoveryToken;
      let recoveryLink: string | undefined;

      if (!recoveryToken) {
        const recovery = await createRecoveryLink({
          participantId: result.participantId,
          eventSlug: result.eventSlug,
        });
        recoveryToken = recovery.recoveryToken;
        recoveryLink = recovery.recoveryLink;
      } else {
        const recovery = await createRecoveryLink({
          participantId: result.participantId,
          eventSlug: result.eventSlug,
        });
        recoveryLink = recovery.recoveryLink;
      }

      await resendParticipantRecoveryLink({
        eventSlug: result.eventSlug,
        participantId: result.participantId,
        recoveryLink: recoveryLink,
        firstName: result.firstName,
        lastName: result.lastName,
        email: email || result.email || "",
      });

      addStoredParticipantProfile(result.eventSlug, {
        participantId: result.participantId,
        firstName: result.firstName,
        lastName: result.lastName,
        birthYear: result.birthYear,
        recoveryToken,
        remembered: true,
        defaultGedcomPersonId: result.defaultGedcomPersonId,
        setAsActive: true,
      });

      syncLegacyParticipantStorage(result.eventSlug, {
        participantId: result.participantId,
        firstName: result.firstName,
        lastName: result.lastName,
        birthYear: result.birthYear,
        recoveryToken,
        defaultGedcomPersonId: result.defaultGedcomPersonId
      });

      await sendParticipantConnection({
        eventSlug: result.eventSlug,
        participantId: result.participantId,
        firstName: result.firstName,
        lastName: result.lastName,
        email: email || result.email,
        source: "email-recovery",
      });

      nav(getParticipantHomePath(result.eventSlug), { replace: true });
    } catch (e: any) {
      setFormError(e?.message ?? "Impossible de confirmer l’ouverture du profil.");
    } finally {
      setLoadingConfirm(false);
    }
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pt-3 pb-24">
          <section className="rounded-[24px] border border-[rgba(220,38,38,0.18)] bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-[color:var(--bad)]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">
                  Impossible de poursuivre
                </div>
                <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
                  {pageError}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => nav(getParticipantAccessRecoverPath(slug))}
                className="w-full rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white"
              >
                Retour à la récupération
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-28">
        {fromCreateConflict ? (
          <section className="mb-4 rounded-[24px] border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="text-sm font-black text-slate-900">
              Profil déjà existant
            </div>

            <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
              Cette adresse email est déjà associée à un profil existant.
              Pour continuer en toute sécurité, confirme l’année de naissance liée à ce profil.
            </div>
          </section>
        ) : null}
        <RecoverySummaryCard
          title="Profil retrouvé"
          subtitle="Nous avons retrouvé un profil correspondant à cette adresse email."
          helperTitle="Vérification rapide"
          helperText="Indique l’année de naissance associée à ce profil pour ouvrir directement l’espace famille."
          displayName={maskedDisplayName}
        />

        <RecoveryBirthYearForm
          value={birthYear}
          loading={loadingConfirm}
          error={formError}
          label={accessConfig.recovery.birthYearLabel}
          placeholder={accessConfig.recovery.birthYearPlaceholder}
          submitLabel="Confirmer et ouvrir le profil"
          onChange={setBirthYear}
          onSubmit={onSubmit}
        />
      </main>
    </div>
  );
}