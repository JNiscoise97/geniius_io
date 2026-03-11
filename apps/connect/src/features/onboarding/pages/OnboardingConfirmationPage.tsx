import { CheckCircle2, Home, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

export function OnboardingConfirmationPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const [searchParams] = useSearchParams();

  const step = searchParams.get("step");

  const content = useMemo(() => {
    switch (step) {
      case "identity":
        return {
          title: "Merci, ta présentation a bien été enregistrée",
          text: "Les cousins pourront mieux savoir qui tu es et te situer plus facilement dans la famille.",
        };
      case "profile":
        return {
          title: "Merci, ton profil a bien été complété",
          text: "Ces informations aideront les cousins à mieux te connaître et à créer plus facilement du lien.",
        };
      case "contact":
        return {
          title: "Merci, tes préférences ont bien été enregistrées",
          text: "Tes coordonnées et autorisations ont bien été prises en compte.",
        };
      default:
        return {
          title: "Merci",
          text: "Tes informations ont bien été enregistrées.",
        };
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-6 pb-24">
        <section className="rounded-3xl bg-white shadow-[0_16px_38px_rgba(15,23,42,0.08)] border border-slate-200 overflow-hidden">
          <div className="p-5">
            <div className="h-14 w-14 rounded-[20px] bg-green-50 border border-green-100 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-[color:var(--ok)]" />
            </div>

            <h1 className="mt-4 text-[24px] leading-tight font-black tracking-tight text-slate-900">
              {content.title}
            </h1>

            <p className="mt-2 text-sm font-bold text-slate-700 leading-6">
              {content.text}
            </p>

            <div className="mt-4 rounded-2xl bg-indigo-50 border border-indigo-100 p-3">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 text-[color:var(--blue)]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">
                    Tu peux revenir à ton espace
                  </div>
                  <div className="text-xs font-bold text-slate-700">
                    Tu verras l’avancement de tes réponses et tu pourras compléter les autres étapes à ton rythme.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              className="w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 bg-[color:var(--blue)] text-white"
              onClick={() => nav(`/e/${slug}/welcome`, { replace: true })}
            >
              <Home size={18} />
              Retour à mon espace
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}