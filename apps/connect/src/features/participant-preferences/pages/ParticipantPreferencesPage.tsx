import { AlertTriangle, ArrowLeft, Settings } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PreferencesForm,
  type PreferencesFormValues,
} from "../components/PreferencesForm";
import { preferencesFormConfig } from "../config/preferencesFormConfig";
import { savePreferences } from "../api/savePreferences";
import { getPreferences } from "../api/getPreferences";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";



export function ParticipantPreferencesPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<PreferencesFormValues>({
    allowFamilyPhotoSharing: false,
    allowNameInFamilyTree: true,
    allowPhotoInFamilyTree: false,
    allowInfoInFamilyTree: false,
    allowCousinsContact: false,
    allowFamilyNews: false,
    allowEventPhotosReceive: false,
    allowFutureEvents: false,
    otherPreferences: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  

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
        const existing = await getPreferences({
          participantId: participantSession.participantId,
        });

        if (!isMounted) return;

        if (existing) {
          setValues(existing);
        }
      } catch (e: any) {
        if (!isMounted) return;
        setError(
          e?.message ?? "Impossible de charger les préférences existantes.",
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
      await savePreferences({
        participantId: participantSession.participantId,
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
            Choisis ce que la famille peut afficher ou partager
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
              Chargement de tes préférences…
            </div>
          </section>
        ) : (
          <PreferencesForm
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