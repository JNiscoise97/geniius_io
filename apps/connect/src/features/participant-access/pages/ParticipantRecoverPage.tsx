import { AlertTriangle, ArrowRight, Mail } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { findParticipantByEmail } from "../api/findParticipantByEmail";
import {
  getParticipantAccessCreatePath,
  getParticipantAccessRecoverConfirmPath,
} from "../config/participantAccessRoutes";

type RecoverLocationState = {
  reason?: string;
  emailPrefill?: string;
} | null;

export function ParticipantRecoverPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const locationState = (location.state as RecoverLocationState) ?? null;

  const [email, setEmail] = useState(locationState?.emailPrefill ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (locationState?.reason === "birth-year-mismatch") {
      setError(
        "Nous n’avons pas pu confirmer le profil. Réessaie avec ton adresse email.",
      );
    }
  }, [locationState?.reason]);

  function validate(): string | null {
    const value = email.trim().toLowerCase();
    if (!value) {
      return "Merci d’indiquer ton adresse email.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Merci d’indiquer une adresse email valide.";
    }

    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const result = await findParticipantByEmail({
        eventSlug: slug,
        email,
      });

      if (result.found) {
        nav(
          `${getParticipantAccessRecoverConfirmPath(result.eventSlug)}?participantId=${encodeURIComponent(result.participantId)}`,
          {
            replace: true,
            state: {
              email: result.email,
              maskedDisplayName: result.maskedDisplayName,
            },
          },
        );
        return;
      }

      nav(`${getParticipantAccessCreatePath(slug)}?email=${encodeURIComponent(email.trim())}`, {
        replace: true,
      });
    } catch (e: any) {
      setError(e?.message ?? "Impossible de retrouver ce profil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-28">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
            <Mail size={14} />
            Récupération du profil
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            Retrouver mon profil
          </h1>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            Indique ton adresse email pour retrouver ton profil ou créer un nouvel accès si nécessaire.
          </p>
        </section>

        <form onSubmit={onSubmit} className="mt-4">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <label className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                Adresse email
              </span>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                placeholder="Ex : toi@email.com"
                inputMode="email"
                disabled={loading}
              />
            </label>

            {error ? (
              <div className="mt-3 flex items-start gap-2 text-sm font-bold text-[color:var(--bad)]">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
          </section>

          <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
            <div className="c-container">
              <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
                <button
                  type="submit"
                  className={[
                    "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                    loading
                      ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                      : "bg-[color:var(--blue)] text-white",
                  ].join(" ")}
                  disabled={loading}
                >
                  <ArrowRight size={18} />
                  {loading ? "Recherche..." : "Continuer"}
                </button>
              </div>
            </div>
          </footer>
        </form>
      </main>
    </div>
  );
}