import { AlertTriangle } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RecoveryBirthYearForm } from "../components/RecoveryBirthYearForm";
import { RecoverySummaryCard } from "../components/RecoverySummaryCard";
import { accessConfig } from "../config/accessConfig";
import {
  getParticipantByRecoveryToken,
  type RecoveryParticipantPreview,
} from "../api/getParticipantByRecoveryToken";
import {
  confirmParticipantRecovery,
} from "../api/confirmParticipantRecovery";
import { addStoredParticipantProfile } from "../../../lib/participant-session/addStoredParticipantProfile";

export function ParticipantRecoverConfirmPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const [searchParams] = useSearchParams();

  const [preview, setPreview] = useState<RecoveryParticipantPreview | null>(null);
  const [birthYear, setBirthYear] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const token = searchParams.get("t")?.trim() ?? "";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPreview() {
      if (!token) {
        setPageError("Lien de reprise incomplet.");
        setLoadingPreview(false);
        return;
      }

      setLoadingPreview(true);
      setPageError(null);

      try {
        const result = await getParticipantByRecoveryToken(token);

        if (!isMounted) return;

        if (!result) {
          setPageError("Ce lien de reprise n’est plus valide ou ne correspond à aucun profil.");
          return;
        }

        setPreview(result);
      } catch (e: any) {
        if (!isMounted) return;
        setPageError(e?.message ?? "Impossible de charger ce profil.");
      } finally {
        if (isMounted) {
          setLoadingPreview(false);
        }
      }
    }

    void loadPreview();

    return () => {
      isMounted = false;
    };
  }, [token]);

  function validate(): string | null {
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
      const result = await confirmParticipantRecovery({
        recoveryToken: token,
        birthYear,
      });

      if (!result) {
        setFormError("L’année de naissance ne correspond pas à ce profil.");
        return;
      }

      addStoredParticipantProfile(result.eventSlug, {
        participantId: result.participantId,
        firstName: result.firstName,
        lastName: result.lastName,
        birthYear: result.birthYear,
        recoveryToken: token,
        remembered: true,
        setAsActive: true,
      });

      localStorage.setItem(
        `connect:${result.eventSlug}:participant`,
        JSON.stringify({
          participantId: result.participantId,
          firstName: result.firstName,
          lastName: result.lastName,
          birthYear: result.birthYear,
          recoveryToken: token,
        }),
      );

      nav(`/e/${result.eventSlug}/home`, { replace: true });
    } catch (e: any) {
      setFormError(e?.message ?? "Impossible de confirmer l’ouverture du profil.");
    } finally {
      setLoadingConfirm(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-28">
        {loadingPreview ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-700">
              Vérification du profil…
            </div>
          </section>
        ) : null}

        {pageError ? (
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
                onClick={() => nav(`/e/${slug}/access`)}
                className="w-full rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white"
              >
                Retour à l’accès au profil
              </button>
            </div>
          </section>
        ) : null}

        {!loadingPreview && !pageError && preview ? (
          <>
            <RecoverySummaryCard
              title={accessConfig.recovery.confirmTitle}
              subtitle={accessConfig.recovery.confirmSubtitle}
              helperTitle={accessConfig.recovery.helperTitle}
              helperText={accessConfig.recovery.helperText}
              displayName={preview.displayName}
            />

            <RecoveryBirthYearForm
              value={birthYear}
              loading={loadingConfirm}
              error={formError}
              label={accessConfig.recovery.birthYearLabel}
              placeholder={accessConfig.recovery.birthYearPlaceholder}
              submitLabel={accessConfig.recovery.submitLabel}
              onChange={setBirthYear}
              onSubmit={onSubmit}
            />
          </>
        ) : null}
      </main>
    </div>
  );
}