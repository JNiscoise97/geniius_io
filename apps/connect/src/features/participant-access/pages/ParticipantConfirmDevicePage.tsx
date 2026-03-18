import { AlertTriangle, Smartphone } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RecoveryBirthYearForm } from "../components/RecoveryBirthYearForm";
import { accessConfig } from "../config/accessConfig";
import {
  getStoredParticipantProfiles,
  type StoredParticipantProfile,
} from "../../../lib/participant-session/getStoredParticipantProfiles";
import { confirmStoredParticipantAccess } from "../api/confirmStoredParticipantAccess";
import { addStoredParticipantProfile } from "../../../lib/participant-session/addStoredParticipantProfile";
import { syncLegacyParticipantStorage } from "../../../lib/participant-session/syncLegacyParticipantStorage";
import {
  getParticipantAccessRecoverPath,
  getParticipantHomePath,
} from "../config/participantAccessRoutes";
import { sendParticipantConnection } from "../api/sendParticipantConnection";

function getProfileDisplayName(profile: StoredParticipantProfile | null): string {
  if (!profile) return "Profil familial";
  if (profile.label?.trim()) return profile.label.trim();

  const parts = [profile.firstName?.trim(), profile.lastName?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Profil familial";
}

export function ParticipantConfirmDevicePage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const [searchParams] = useSearchParams();

  const participantId = searchParams.get("participantId")?.trim() ?? "";
  const [birthYear, setBirthYear] = useState("");
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const deviceState = useMemo(() => getStoredParticipantProfiles(slug), [slug]);

  const profile = useMemo(
    () =>
      deviceState.profiles.find((item) => item.participantId === participantId) ??
      null,
    [deviceState.profiles, participantId],
  );

  function validate(): string | null {
    if (!participantId || !profile) {
      return "Impossible de retrouver le profil enregistré sur cet appareil.";
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
      const result = await confirmStoredParticipantAccess({
        participantId,
        birthYear,
      });

      if (!result) {
        nav(getParticipantAccessRecoverPath(slug), {
          replace: true,
          state: { reason: "birth-year-mismatch" },
        });
        return;
      }

      addStoredParticipantProfile(result.eventSlug, {
        participantId: result.participantId,
        firstName: result.firstName,
        lastName: result.lastName,
        birthYear: result.birthYear,
        recoveryToken: result.recoveryToken,
        remembered: true,
        setAsActive: true,
      });

      syncLegacyParticipantStorage(result.eventSlug, {
        participantId: result.participantId,
        firstName: result.firstName,
        lastName: result.lastName,
        birthYear: result.birthYear,
        recoveryToken: result.recoveryToken,
      });

      await sendParticipantConnection({
        eventSlug: result.eventSlug,
        participantId: result.participantId,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        source: "device",
      });

      nav(getParticipantHomePath(result.eventSlug), { replace: true });
    } catch (e: any) {
      setFormError(e?.message ?? "Impossible de confirmer l’ouverture du profil.");
    } finally {
      setLoadingConfirm(false);
    }
  }

  if (!participantId || !profile) {
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
                  Profil introuvable
                </div>
                <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
                  Impossible de retrouver le profil enregistré sur cet appareil.
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => nav(getParticipantAccessRecoverPath(slug))}
                className="w-full rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white"
              >
                Continuer autrement
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
        <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
              <Smartphone size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-black text-slate-900">
                Profil retrouvé sur cet appareil
              </div>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                Nous avons retrouvé un profil déjà enregistré sur ce téléphone.
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                  Profil retrouvé
                </div>
                <div className="mt-1 text-sm font-black text-slate-900">
                  {getProfileDisplayName(profile)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[24px] border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
          <div className="text-sm font-black text-slate-900">
            Vérification rapide
          </div>
          <div className="mt-1 text-xs font-bold leading-5 text-slate-700">
            Indique l’année de naissance associée à ce profil pour confirmer l’ouverture sur cet appareil.
          </div>
        </section>

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
      </main>
    </div>
  );
}