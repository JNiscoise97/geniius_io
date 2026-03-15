import { ArrowLeft, BookOpenText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  familyKnowledgeStepsConfig,
  type FamilyKnowledgeStepKey,
  type FamilyKnowledgeStepStatus,
} from "../config/familyKnowledgeStepsConfig";
import { OnboardingStepCard } from "../../onboarding/components/OnboardingStepCard";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import {
  getFamilyKnowledgeCompletionRules,
  isCompletionRuleComplete,
} from "../../../lib/completion/sectionCompletion";
import { loadCompletionData } from "../../../lib/completion/loadCompletionData";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";

type StepProgressByKey = Record<
  FamilyKnowledgeStepKey,
  FamilyKnowledgeStepStatus
>;

export function FamilyKnowledgeHubPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const [progress, setProgress] = useState<StepProgressByKey>({
    close_family: "todo",
    grandparents: "todo",
    godparents: "todo",
    current_links: "todo",
    memory: "todo",
    photos: "todo",
  });

  const familyKnowledgeRules = useMemo(
    () => getFamilyKnowledgeCompletionRules(),
    [],
  );

  useEffect(() => {
    if (!participantId) return;

    const tracker = createPageTimeTracker({
      participantId,
      eventSlug: slug,
      pageKey: `/e/${slug}/family-knowledge`,
    });

    tracker.start();

    return () => {
      void tracker.stop();
    };
  }, [participantId, slug]);

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      const participantSession = getParticipantSession(slug);

      if (!participantSession?.participantId) {
        return;
      }

      try {
        const rowsByTable = await loadCompletionData(
          participantSession.participantId,
          familyKnowledgeRules,
        );

        if (!isMounted) return;

        const nextProgress: StepProgressByKey = {
          close_family: "todo",
          grandparents: "todo",
          godparents: "todo",
          current_links: "todo",
          memory: "todo",
          photos: "todo",
        };

        for (const rule of familyKnowledgeRules) {
          if (!rule.familyKnowledgeKey) continue;

          const row = rule.table ? rowsByTable[rule.table] : null;

          nextProgress[rule.familyKnowledgeKey] = isCompletionRuleComplete(
            rule,
            row,
            rowsByTable,
          )
            ? "done"
            : "todo";
        }

        setProgress(nextProgress);
      } catch {
        if (isMounted) {
          setProgress({
            close_family: "todo",
            grandparents: "todo",
            godparents: "todo",
            current_links: "todo",
            memory: "todo",
            photos: "todo",
          });
        }
      }
    }

    void loadProgress();

    return () => {
      isMounted = false;
    };
  }, [slug, familyKnowledgeRules]);

  const completedCount = Object.values(progress).filter(
    (status) => status === "done",
  ).length;

  const totalCount = familyKnowledgeStepsConfig.length;
  const progressPercent = useMemo(
    () => Math.round((completedCount / totalCount) * 100),
    [completedCount, totalCount],
  );

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-4">
        <section className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
                <BookOpenText size={14} />
                Ce que tu sais sur ta famille
              </div>

              <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
                Ta contribution à l’histoire de la famille
              </h1>

              <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
                Partage ce que tu sais sur ta famille : les personnes autour de toi, les générations passées, les liens actuels et les souvenirs qui méritent d’être transmis.
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
          {familyKnowledgeStepsConfig.map((step) => (
            <OnboardingStepCard
              key={step.key}
              title={step.title}
              subtitle={step.subtitle}
              icon={step.icon}
              ctaLabel={step.ctaLabel}
              status={progress[step.key]}
              highlight={
                step.key === "close_family" &&
                progress.close_family !== "done"
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