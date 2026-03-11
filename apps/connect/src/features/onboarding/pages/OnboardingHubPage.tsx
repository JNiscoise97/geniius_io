import {
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  onboardingStepsConfig,
  type OnboardingStepStatus,
} from "../config/onboardingConfig";
import { OnboardingStepCard } from "../components/OnboardingStepCard";
import { supabase } from "../../../lib/supabase/client";

type StepProgressByKey = Record<
  "identity" | "profile" | "contact",
  OnboardingStepStatus
>;

type LocalParticipantSession = {
  participantId: string;
  firstName?: string;
  lastName?: string;
};

function getLocalParticipantSession(slug: string): LocalParticipantSession | null {
  const raw = localStorage.getItem(`connect:${slug}:participant`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LocalParticipantSession;
  } catch {
    return null;
  }
}

function getFallbackProgressFromLocalStorage(slug: string): StepProgressByKey {
  return {
    identity:
      localStorage.getItem(`connect:${slug}:onboarding:identity`) === "done"
        ? "done"
        : "todo",
    profile:
      localStorage.getItem(`connect:${slug}:onboarding:profile`) === "done"
        ? "done"
        : "todo",
    contact:
      localStorage.getItem(`connect:${slug}:onboarding:contact`) === "done"
        ? "done"
        : "todo",
  };
}

export function OnboardingHubPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  /**
   * À brancher plus tard sur Supabase / localStorage / profil participant.
   * Pour l’instant on simule l’état d’avancement.
   */
  const [progress, setProgress] = useState<StepProgressByKey>({
  identity: "todo",
  profile: "todo",
  contact: "todo",
});

useEffect(() => {
  let isMounted = true;

  async function loadProgress() {
    const participantSession = getLocalParticipantSession(slug);

    // 1) pas d'identifiant participant → fallback local
    if (!participantSession?.participantId) {
      if (isMounted) {
        setProgress(getFallbackProgressFromLocalStorage(slug));
      }
      return;
    }

    try {
      const participantId = participantSession.participantId;

      const [identityRes, profileRes, contactRes] = await Promise.all([
        supabase
          .from("participant_identity")
          .select("completed")
          .eq("participant_id", participantId)
          .maybeSingle(),

        supabase
          .from("participant_profile")
          .select("completed")
          .eq("participant_id", participantId)
          .maybeSingle(),

        supabase
          .from("participant_contact")
          .select("completed")
          .eq("participant_id", participantId)
          .maybeSingle(),
      ]);

      if (!isMounted) return;

      const nextProgress: StepProgressByKey = {
        identity: identityRes.data?.completed ? "done" : "todo",
        profile: profileRes.data?.completed ? "done" : "todo",
        contact: contactRes.data?.completed ? "done" : "todo",
      };

      setProgress(nextProgress);
    } catch {
      // 2) si la DB échoue → fallback local
      if (isMounted) {
        setProgress(getFallbackProgressFromLocalStorage(slug));
      }
    }
  }

  void loadProgress();

  return () => {
    isMounted = false;
  };
}, [slug]);

  const completedCount = Object.values(progress).filter(
    (status) => status === "done",
  ).length;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-4">
        {/* HERO */}
        <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#312e81_100%)] text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
          <div className="p-5">
            <h1 className="mt-4 text-[30px] leading-[1.02] font-black tracking-tight">
              Ton espace dans
              <br />
              la cousinade
            </h1>

            <p className="mt-3 max-w-[38rem] text-sm font-bold leading-6 text-white/88">
              Avance à ton rythme. Tu peux commencer par l’essentiel, puis
              compléter seulement ce que tu souhaites partager avec la famille.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <HeroMiniCard
                title="Simple"
                text="Quelques informations suffisent pour commencer."
                icon={ShieldCheck}
              />
              <HeroMiniCard
                title="Utile"
                text="Chaque réponse aide à créer plus de lien entre cousins."
                icon={Sparkles}
              />
              <HeroMiniCard
                title="Progressif"
                text="Tu peux compléter ton espace petit à petit."
                icon={Users}
              />
            </div>
          </div>
        </section>

        {/* MESSAGE D’ORIENTATION */}
        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-700">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-[16px] font-black text-slate-900">
                Par où commencer ?
              </div>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
                Le plus simple est de commencer par{" "}
                <span className="text-slate-900">te présenter</span>.  
                Ensuite, tu peux ajouter quelques informations sur toi et, si tu
                le souhaites, laisser un moyen de rester en contact.
              </p>
            </div>
          </div>
        </section>

        {/* PROGRESSION */}
        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[15px] font-black text-slate-900">
                Progression
              </div>
              <div className="mt-1 text-xs font-bold text-slate-700">
                {completedCount} étape{completedCount > 1 ? "s" : ""} complétée
                {completedCount > 1 ? "s" : ""} sur {onboardingStepsConfig.length}
              </div>
            </div>

            <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
              {completedCount}/{onboardingStepsConfig.length}
            </div>
          </div>
        </section>

        {/* CARTES */}
        <div className="mt-5 space-y-3">
          {onboardingStepsConfig.map((step) => (
            <OnboardingStepCard
              key={step.key}
              title={step.title}
              subtitle={step.subtitle}
              why={step.why}
              icon={step.icon}
              ctaLabel={step.ctaLabel}
              status={progress[step.key]}
              onClick={() => nav(`/e/${slug}/welcome/${step.routeSuffix}`)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function HeroMiniCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-white/15 p-2">
          <Icon size={16} />
        </div>
        <div className="text-sm font-black">{title}</div>
      </div>
      <div className="mt-2 text-xs font-bold leading-5 text-white/85">
        {text}
      </div>
    </div>
  );
}