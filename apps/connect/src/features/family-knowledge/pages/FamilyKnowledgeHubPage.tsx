import { ArrowLeft, BookOpenText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  familyKnowledgeStepsConfig,
  type FamilyKnowledgeStepKey,
  type FamilyKnowledgeStepStatus,
} from "../config/familyKnowledgeStepsConfig";
import { OnboardingStepCard } from "../../onboarding/components/OnboardingStepCard";

type StepProgressByKey = Record<FamilyKnowledgeStepKey, FamilyKnowledgeStepStatus>;

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
    intro:
      localStorage.getItem(`connect:${slug}:family-knowledge:intro`) === "done"
        ? "done"
        : "todo",
    close_family:
      localStorage.getItem(`connect:${slug}:family-knowledge:close_family`) ===
      "done"
        ? "done"
        : "todo",
    grandparents:
      localStorage.getItem(`connect:${slug}:family-knowledge:grandparents`) ===
      "done"
        ? "done"
        : "todo",
    godparents:
      localStorage.getItem(`connect:${slug}:family-knowledge:godparents`) ===
      "done"
        ? "done"
        : "todo",
    current_links:
      localStorage.getItem(`connect:${slug}:family-knowledge:current_links`) ===
      "done"
        ? "done"
        : "todo",
    memory:
      localStorage.getItem(`connect:${slug}:family-knowledge:memory`) === "done"
        ? "done"
        : "todo",
  };
}

export function FamilyKnowledgeHubPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [progress, setProgress] = useState<StepProgressByKey>({
    intro: "todo",
    close_family: "todo",
    grandparents: "todo",
    godparents: "todo",
    current_links: "todo",
    memory: "todo",
  });

  useEffect(() => {
    setProgress(getFallbackProgressFromLocalStorage(slug));
  }, [slug]);

  const completedCount = Object.values(progress).filter(
    (status) => status === "done",
  ).length;

  const totalCount = familyKnowledgeStepsConfig.length;
  const progressPercent = useMemo(
    () => Math.round((completedCount / totalCount) * 100),
    [completedCount, totalCount],
  );

  const participantSession = getLocalParticipantSession(slug);
  const firstName = participantSession?.firstName?.trim();

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-4">
        <section className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
                <BookOpenText size={14} />
                Ce que tu sais sur la famille
              </div>

              <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
                {firstName
                  ? `Merci de partager, ${firstName}`
                  : "Merci de partager ce que tu sais"}
              </h1>

              <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
                Même un petit souvenir ou un nom incomplet peut aider la famille
                à mieux se connaître et à transmettre son histoire.
              </p>
            </div>

            <button
              type="button"
              onClick={() => nav(`/e/${slug}`)}
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
          {familyKnowledgeStepsConfig.map((step) => (
            <OnboardingStepCard
              key={step.key}
              title={step.title}
              subtitle={step.subtitle}
              icon={step.icon}
              ctaLabel={step.ctaLabel}
              status={progress[step.key]}
              highlight={
                (step.key === "intro" || step.key === "close_family") &&
                progress[step.key] !== "done"
              }
              onClick={() =>
                nav(`/e/${slug}/family-knowledge/${step.routeSuffix}`)
              }
            />
          ))}
        </div>
      </main>
    </div>
  );
}