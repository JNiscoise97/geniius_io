import { AlertTriangle, ArrowLeft, MessageCircleHeart } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ProfileForm,
  type ProfileFormValues,
} from "../components/ProfileForm";
import { profileQuestionsConfig } from "../config/profileQuestionsConfig";
import { saveProfile } from "../api/saveProfile";
import { getProfile } from "../api/getProfile";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { getProfileTreePreference } from "../api/getProfileTreePreference";
import { saveProfileTreePreference } from "../api/saveProfileTreePreference";

export function ParticipantProfilePage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<ProfileFormValues>({
    city: "",
    occupation: "",
    interests: "",
    freeShare: "",
  });

  const [allowInfoInFamilyTree, setAllowInfoInFamilyTree] = useState(false);
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
        const [existingProfile, treePreference] = await Promise.all([
          getProfile({
            participantId: participantSession.participantId,
          }),
          getProfileTreePreference({
            participantId: participantSession.participantId,
          }),
        ]);

        if (!isMounted) return;

        if (existingProfile) {
          setValues(existingProfile);
        }

        setAllowInfoInFamilyTree(treePreference);
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
      await Promise.all([
        saveProfile({
          participantId: participantSession.participantId,
          values,
        }),
        saveProfileTreePreference({
          participantId: participantSession.participantId,
          allowInfoInFamilyTree,
        }),
      ]);

      localStorage.setItem(`connect:${slug}:onboarding:profile`, "done");
      nav(`/e/${slug}/welcome/confirmation?step=profile`, { replace: true });
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
              <MessageCircleHeart size={14} />
              Interview
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
            {profileQuestionsConfig.title}
          </h1>

          <p className="mt-2 text-sm font-bold text-slate-700">
            Quelques réponses pour aider les cousins à mieux te connaître
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

        {loadingInitialData ? (
          <section className="mt-3 rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-700">
              Chargement de tes informations…
            </div>
          </section>
        ) : (
          <ProfileForm
            config={profileQuestionsConfig}
            value={values}
            loading={loading}
            error={error}
            allowInfoInFamilyTree={allowInfoInFamilyTree}
            onChangeAllowInfoInFamilyTree={setAllowInfoInFamilyTree}
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