import { AlertTriangle, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RecoverySummaryCard } from "../components/RecoverySummaryCard";
import { accessConfig } from "../config/accessConfig";
import {
  getParticipantByRecoveryToken,
  type RecoveryParticipantPreview,
} from "../api/getParticipantByRecoveryToken";

export function ParticipantRecoverPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const [searchParams] = useSearchParams();

  const [preview, setPreview] = useState<RecoveryParticipantPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("t")?.trim() ?? "";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPreview() {
      if (!token) {
        setError("Lien de reprise incomplet.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getParticipantByRecoveryToken(token);

        if (!isMounted) return;

        if (!result) {
          setError("Ce lien de reprise n’est plus valide ou ne correspond à aucun profil.");
          return;
        }

        setPreview(result);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message ?? "Impossible de retrouver ce profil.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-24">
        {loading ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-700">
              Recherche du profil…
            </div>
          </section>
        ) : null}

        {error ? (
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
                  {error}
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

        {!loading && !error && preview ? (
          <>
            <RecoverySummaryCard
              title={accessConfig.recovery.title}
              subtitle={accessConfig.recovery.subtitle}
              helperTitle={accessConfig.recovery.helperTitle}
              helperText={accessConfig.recovery.helperText}
              displayName={preview.displayName}
            />

            <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
              <div className="c-container">
                <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
                  <button
                    type="button"
                    className="w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 bg-[color:var(--blue)] text-white"
                    onClick={() =>
                      nav(`/e/${slug}/access/recover/confirm?t=${encodeURIComponent(token)}`)
                    }
                  >
                    <ArrowRight size={18} />
                    Continuer
                  </button>
                </div>
              </div>
            </footer>
          </>
        ) : null}
      </main>
    </div>
  );
}