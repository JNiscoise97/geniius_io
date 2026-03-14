import {
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  onboardingStepsConfig,
  type OnboardingStepStatus,
} from "../config/onboardingConfig";
import { OnboardingStepCard } from "../components/OnboardingStepCard";
import { supabase } from "../../../lib/supabase/client";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";

type StepProgressByKey = Record<
  "identity" | "profile" | "preferences",
  OnboardingStepStatus
>;

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
    preferences:
      localStorage.getItem(`connect:${slug}:onboarding:preferences`) === "done"
        ? "done"
        : "todo",
  };
}

export function OnboardingHubPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [progress, setProgress] = useState<StepProgressByKey>({
    identity: "todo",
    profile: "todo",
    preferences: "todo",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      const participantSession = getParticipantSession(slug);

      if (!participantSession?.participantId) {
        if (isMounted) {
          setProgress(getFallbackProgressFromLocalStorage(slug));
        }
        return;
      }

      try {
        const participantId = participantSession.participantId;

        const [identityRes, profileRes, preferencesRes] = await Promise.all([
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
            .from("participant_preferences")
            .select("completed")
            .eq("participant_id", participantId)
            .maybeSingle(),
        ]);

        if (!isMounted) return;

        const nextProgress: StepProgressByKey = {
          identity: identityRes.data?.completed ? "done" : "todo",
          profile: profileRes.data?.completed ? "done" : "todo",
          preferences: preferencesRes.data?.completed ? "done" : "todo",
        };

        setProgress(nextProgress);
      } catch {
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

  const totalCount = onboardingStepsConfig.length;
  const progressPercent = useMemo(
    () => Math.round((completedCount / totalCount) * 100),
    [completedCount, totalCount],
  );

  const participantSession = getParticipantSession(slug);
  const firstName = participantSession?.firstName?.trim();

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-4">
        <section className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
                <ShieldCheck size={14} />
                Ton espace personnel
              </div>

              <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
                {firstName ? `Bienvenue ${firstName}` : "Ton espace dans la cousinade"}
              </h1>

              <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
                Commence par l’essentiel, puis complète seulement ce que tu veux
                partager.
              </p>
            </div>

            <button
              type="button"
              onClick={() => nav(`/e/${slug}/home`)}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                Retour
              </span>
            </button>
          </div>
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[15px] font-black text-slate-900">
                Progression
              </div>
            </div>

            <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
              {completedCount}/{totalCount}
            </div>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[color:var(--blue)] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </section>

        <div className="mt-5 space-y-3">
          <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3'>
              <div className='flex items-start gap-3'>
                <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
                <div className='min-w-0'>
                  <div className='text-sm font-semibold text-amber-900'>Chantiers en cours</div>
                  <div className='mt-0.5 text-xs text-amber-800'>
                    <ol>
                      <li>Revoir le titre</li>
                      <li>Revoir la barre de progression pour qu'elle se base sur la base de données</li>
                      <li>faire une lib qui dit les conditions pour qu'une section soit dite complète</li>
                      <li>revoir les labels des cartes</li>
                      <li>créer une carte pour savoir comment il a entendu parler du pique nique, s'il est déjà venu, sa branche</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          {onboardingStepsConfig.map((step) => (
            <OnboardingStepCard
              key={step.key}
              title={step.title}
              subtitle={step.subtitle}
              icon={step.icon}
              ctaLabel={step.ctaLabel}
              status={progress[step.key]}
              highlight={step.key === "identity" && progress.identity !== "done"}
              onClick={() => nav(`/e/${slug}/welcome/${step.routeSuffix}`)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}