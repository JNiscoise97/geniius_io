import { CheckCircle2, Home, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

export function OnboardingConfirmationPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const [searchParams] = useSearchParams();

  const step = searchParams.get("step");
  const url =
    step === "identity"
      ? `/e/${slug}/welcome`
      : `/e/${slug}/home`;

  const content = useMemo(() => {
    switch (step) {
      case "identity":
        return {
          title: "Merci, ta présentation est bien enregistrée",
          text: "Cela aidera l’organisateur et la famille à mieux te reconnaître et à mieux te situer.",
        };
      case "profile":
        return {
          title: "Merci, tu as ajouté quelques éléments sur toi",
          text: "Ces informations pourront faciliter les échanges et créer plus facilement du lien.",
        };
      case "contact":
        return {
          title: "Merci, tes coordonnées sont bien enregistrées",
          text: "Tes informations de contact ont bien été prises en compte.",
        };
      case "preferences":
        return {
          title: "Merci, tes préférences ont bien été prises en compte",
          text: "Tes choix concernant l’arbre, les photos, les contacts et certains usages dans l’application sont maintenant enregistrés.",
        };
      case "attendance":
        return {
          title: "Merci pour ta réponse",
          text: "Elle nous aide à préparer la journée dans les meilleures conditions.",
        };
      case "organizer-message":
        return {
          title: "Merci, ton message a bien été envoyé",
          text: "L’organisateur l’a bien reçu. Si besoin, il te répondra via le moyen de contact que tu as indiqué.",
        };
      default:
        return {
          title: "Merci",
          text: "Tes informations ont bien été prises en compte.",
        };
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-6 pb-24">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
          <div className="p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-green-100 bg-green-50">
              <CheckCircle2 size={28} className="text-[color:var(--ok)]" />
            </div>

            <h1 className="mt-4 text-[24px] font-black leading-tight tracking-tight text-slate-900">
              {content.title}
            </h1>

            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
              {content.text}
            </p>

            <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 text-[color:var(--blue)]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">
                    La suite quand tu veux
                  </div>
                  <div className="text-xs font-bold text-slate-700">
                    Tu peux revenir à ton espace pour voir ce qu’il reste à compléter et avancer à ton rythme.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white/95 to-white/0 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="c-container">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-[0_16px_38px_rgba(15,23,42,0.10)] backdrop-blur">
            <button
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--blue)] font-black text-white"
              onClick={() => nav(url, { replace: true })}
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