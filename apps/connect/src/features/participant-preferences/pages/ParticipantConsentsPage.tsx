import { AlertTriangle, ArrowLeft, Settings } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ConsentsForm,
  type ConsentsFormValues,
} from "../components/ConsentsForm";
import { preferencesFormConfig } from "../config/consentsFormConfig";
import { saveConsents } from "../api/saveConsents";
import { getConsents } from "../api/getConsents";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";

export function ParticipantConsentsPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<ConsentsFormValues>({
    allowFamilyPhotoSharing: null,
    allowPhotoDisplayInApp: null,
    allowEventPhotoMemory: null,

    allowNameInFamilyTree: null,
    allowPhotoInFamilyTree: null,
    allowInfoInFamilyTree: null,

    allowContactDetailsWithFamily: null,
    allowFutureFamilyContact: null,

    allowGenealogyEnrichment: null,
    allowGenealogyContributionStorage: null,

    allowNameInEventActivities: null,
    allowParticipationInGames: null,

    otherPreferences: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  useEffect(() => {
    if (!participantId) return;

    const tracker = createPageTimeTracker({
      participantId,
      eventSlug: slug,
      pageKey: `/e/${slug}/welcome/preferences`,
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
        const existing = await getConsents({
          participantId: participantSession.participantId,
          eventSlug: slug,
        });

        if (!isMounted) return;

        if (existing) {
          setValues(existing);
        }
      } catch (e: any) {
        if (!isMounted) return;
        setError(
          e?.message ?? "Impossible de charger les consentements existants.",
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
      await saveConsents({
        participantId: participantSession.participantId,
        eventSlug: slug,
        values,
      });

      nav(`/e/${slug}/welcome/confirmation?step=preferences`, { replace: true });
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
              <Settings size={14} />
              Configuration
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
            {preferencesFormConfig.title}
          </h1>

          <p className="mt-2 text-sm font-bold text-slate-700">
            Choisis ce que la famille peut voir, afficher ou réutiliser
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
              Chargement de tes consentements…
            </div>
          </section>
        ) : (
          <ConsentsForm
            config={preferencesFormConfig}
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