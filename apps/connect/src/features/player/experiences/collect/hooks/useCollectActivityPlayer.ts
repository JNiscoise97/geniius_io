import { useEffect, useMemo, useRef, useState } from "react";
import { completeActivitySession } from "../../../api/completeActivitySession";
import { createActivityCollectPhoto } from "../../../api/createActivityCollectPhoto";
import { createActivityCollectResponse } from "../../../api/createActivityCollectResponse";
import { getOrCreateActivitySession } from "../../../api/getOrCreateActivitySession";
import { loadActivitySessionState } from "../../../api/loadActivitySessionState";
import { resetActivitySession } from "../../../api/restActivitySession";
import { saveActivityAnswer } from "../../../api/saveActivityAnswer";
import { saveActivitySessionProgress } from "../../../api/saveActivitySessionProgress";
import { upsertActivityReviewQueueItem } from "../../../api/upsertActivityReviewQueueItem";
import { getParticipantSession } from "../../../../../lib/participant-session/getActiveParticipant";
import type {
  ActivityDefinition,
  ActivityQuestionDefinition,
  ActivitySectionDefinition,
} from "../../../core/activity/activityTypes";
import { resolveNextQuestionId } from "../../../core/activity/utils/resolveNextQuestionId";
import type {
  LearnAnswerValue,
  LearnPhotoAnswerValue,
} from "../../learn/hooks/useLearnActivityPlayer";

export type CollectFlatQuestionItem = {
  section: ActivitySectionDefinition;
  question: ActivityQuestionDefinition;
  flatIndex: number;
};

function defaultAnswerForQuestion(
  question: ActivityQuestionDefinition,
): LearnAnswerValue {
  switch (question.type) {
    case "qcu":
    case "short":
    case "long":
    case "fill":
    case "date":
    case "numeric":
      return "";
    case "qcm":
      return [];
    case "select":
      return question.multiple ? [] : "";
    case "truefalse":
      return null;
    case "info":
      return "__ack__";
    case "photo":
      return {
        file: null,
        consent: false,
        tierValue:
          question.tier?.options?.[0]?.value !== undefined
            ? question.tier.options[0].value
            : null,
        note: "",
      };
    default:
      return null;
  }
}

function canQuestionBeAnswered(
  question: ActivityQuestionDefinition,
  answer: LearnAnswerValue,
): boolean {
  switch (question.type) {
    case "qcu":
      return typeof answer === "string" && answer.length > 0;

    case "qcm":
      return Array.isArray(answer) && answer.length > 0;

    case "truefalse":
      return answer === true || answer === false;

    case "numeric": {
      const raw = String(answer ?? "").trim().replace(",", ".");
      if (!raw) return false;
      return Number.isFinite(Number(raw));
    }

    case "short":
    case "long":
    case "fill":
    case "date":
      return typeof answer === "string" && answer.trim().length > 0;

    case "select":
      return question.multiple
        ? Array.isArray(answer) && answer.length > 0
        : typeof answer === "string" && answer.length > 0;

    case "info":
      return true;

    case "photo": {
      if (!answer || typeof answer !== "object" || Array.isArray(answer)) {
        return false;
      }

      const photo = answer as LearnPhotoAnswerValue;
      const hasFile = !!photo.file;
      const hasConsent = photo.consent === true;
      const tierOptions = question.tier?.options ?? [];
      const hasTier =
        tierOptions.length > 0 ? typeof photo.tierValue === "number" : true;

      return hasFile && hasConsent && hasTier;
    }

    default:
      return false;
  }
}

function flattenActivityQuestions(
  activity: ActivityDefinition,
): CollectFlatQuestionItem[] {
  const items: CollectFlatQuestionItem[] = [];

  activity.sections.forEach((section) => {
    section.questions.forEach((question) => {
      items.push({
        section,
        question,
        flatIndex: items.length,
      });
    });
  });

  return items;
}

function getPendingReviewPoints(question: ActivityQuestionDefinition): number {
  const evaluation = question.evaluation;

  if (evaluation.kind !== "manual_review") {
    return 0;
  }

  if (question.type === "photo" && question.tier?.options?.length) {
    return Math.max(...question.tier.options.map((option) => option.points));
  }

  return evaluation.points ?? 0;
}

function getSubmitDelayMs(question: ActivityQuestionDefinition): number {
  if (
    question.type === "photo" ||
    question.type === "short" ||
    question.type === "long" ||
    question.type === "fill"
  ) {
    return 500;
  }

  return 180;
}

function getSubmittingLabel(question: ActivityQuestionDefinition | null): string {
  if (!question) return "Enregistrement...";

  if (question.type === "photo") {
    return "Envoi de la photo...";
  }

  if (
    question.type === "short" ||
    question.type === "long" ||
    question.type === "fill"
  ) {
    return "Enregistrement...";
  }

  if (question.type === "info") {
    return "Chargement...";
  }

  return "Enregistrement...";
}

function getAnswerText(answer: LearnAnswerValue): string | null {
  if (typeof answer === "string") {
    return answer || null;
  }

  if (typeof answer === "number" || typeof answer === "boolean") {
    return String(answer);
  }

  if (Array.isArray(answer)) {
    return answer.map(String).join(", ");
  }

  if (answer && typeof answer === "object") {
    if ("note" in answer && typeof answer.note === "string" && answer.note.trim()) {
      return answer.note.trim();
    }

    if ("file" in answer && answer.file && typeof answer.file.name === "string") {
      return answer.file.name;
    }
  }

  return null;
}

function sanitizeAnswerForStorage(answer: LearnAnswerValue): unknown {
  if (!answer || typeof answer !== "object" || Array.isArray(answer)) {
    return answer;
  }

  if ("file" in answer) {
    const photoAnswer = answer as LearnPhotoAnswerValue;
    return {
      ...photoAnswer,
      file: photoAnswer.file
        ? {
          name: photoAnswer.file.name,
          size: photoAnswer.file.size,
          type: photoAnswer.file.type,
        }
        : null,
    };
  }

  return answer;
}

export function useCollectActivityPlayer(
  activity: ActivityDefinition,
  eventSlug: string,
) {
  const items = useMemo(() => flattenActivityQuestions(activity), [activity]);

  const questionIndexById = useMemo(() => {
    const map: Record<string, number> = {};

    items.forEach((item, index) => {
      map[item.question.id] = index;
    });

    return map;
  }, [items]);

  const canSkip = activity.navigation.allowSkip === true;
  const canGoBack = activity.navigation.allowBack === true;

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(!activity.introMarkdown);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answersByQuestionId, setAnswersByQuestionId] = useState<
    Record<string, LearnAnswerValue>
  >(() => {
    const initial: Record<string, LearnAnswerValue> = {};
    items.forEach(({ question }) => {
      initial[question.id] = defaultAnswerForQuestion(question);
    });
    return initial;
  });

  const [submittedQuestionIds, setSubmittedQuestionIds] = useState<
    Record<string, true>
  >({});

  const [pendingReviewScore, setPendingReviewScore] = useState(0);
  const [historyStack, setHistoryStack] = useState<number[]>([]);

  const hasCompletedRef = useRef(false);

  const currentItem = items[currentIndex] ?? null;
  const currentQuestion = currentItem?.question ?? null;
  const currentSection = currentItem?.section ?? null;

  const totalQuestions = items.length;
  const isComplete = hasStarted && currentIndex >= items.length;

  const currentAnswer = currentQuestion
    ? answersByQuestionId[currentQuestion.id] ??
    defaultAnswerForQuestion(currentQuestion)
    : null;

  const currentPendingReviewPoints = currentQuestion
    ? getPendingReviewPoints(currentQuestion)
    : 0;

  const submittingLabel = getSubmittingLabel(currentQuestion);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setIsBootstrapping(true);

        const participantSession = getParticipantSession(eventSlug);
        if (!participantSession?.participantId) {
          if (!cancelled) {
            setIsBootstrapping(false);
          }
          return;
        }

        const resolvedParticipantId = participantSession.participantId;

        if (!cancelled) {
          setParticipantId(resolvedParticipantId);
        }

        const session = await getOrCreateActivitySession({
          eventSlug,
          activitySlug: activity.slug,
          participantId: resolvedParticipantId,
          mode: activity.mode,
          hasStarted: !activity.introMarkdown,
        });

        const loaded = await loadActivitySessionState(session.id);

        if (cancelled) return;

        setSessionId(session.id);
        setHasStarted(loaded.session.has_started ? true : !activity.introMarkdown);

        const isCompletedSession = loaded.session.status === "completed";

        if (isCompletedSession && session.id) {
          await saveActivitySessionProgress({
            sessionId: session.id,
            currentQuestionId: items[0]?.question.id ?? null,
            currentSectionId: items[0]?.section.id ?? null,
            currentIndex: 0,
            score: 0,
            pendingReviewScore: loaded.session.pending_review_score ?? 0,
            hasStarted: true,
          });
        }

        setCurrentIndex(
          isCompletedSession
            ? 0
            : typeof loaded.session.current_index === "number"
              ? Math.min(loaded.session.current_index, items.length)
              : 0,
        );

        setPendingReviewScore(loaded.session.pending_review_score ?? 0);

        const nextAnswers: Record<string, LearnAnswerValue> = {};
        items.forEach(({ question }) => {
          nextAnswers[question.id] = defaultAnswerForQuestion(question);
        });

        const nextSubmitted: Record<string, true> = {};

        loaded.answers.forEach((answerRow) => {
          if (answerRow.question_id in nextAnswers) {
            nextAnswers[answerRow.question_id] =
              (answerRow.answer_json as LearnAnswerValue) ??
              nextAnswers[answerRow.question_id];
          }

          if (answerRow.is_answered) {
            nextSubmitted[answerRow.question_id] = true;
          }
        });

        setAnswersByQuestionId(nextAnswers);
        setSubmittedQuestionIds(nextSubmitted);
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [activity.introMarkdown, activity.mode, activity.slug, eventSlug, items]);

  useEffect(() => {
    if (!isComplete || !sessionId || hasCompletedRef.current) {
      return;
    }

    hasCompletedRef.current = true;

    void completeActivitySession({
      sessionId,
      pendingReviewScore,
    });
  }, [isComplete, pendingReviewScore, sessionId]);

  async function start() {
    if (isBootstrapping || !sessionId) return;

    setHasStarted(true);

    await saveActivitySessionProgress({
      sessionId,
      currentQuestionId: currentQuestion?.id ?? null,
      currentSectionId: currentSection?.id ?? null,
      currentIndex,
      score: 0,
      pendingReviewScore,
      hasStarted: true,
    });
  }

  function setAnswer(value: LearnAnswerValue) {
    if (!currentQuestion || isSubmitting || isBootstrapping) return;

    setAnswersByQuestionId((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  }

  function canSubmitCurrent(): boolean {
    if (!currentQuestion) return false;
    if (isSubmitting || isBootstrapping) return false;
    return canQuestionBeAnswered(currentQuestion, currentAnswer);
  }

  async function persistProgress(
    nextIndex: number,
    nextPendingReviewScore = pendingReviewScore,
  ) {
    if (!sessionId) return;

    const nextItem = items[nextIndex] ?? null;

    await saveActivitySessionProgress({
      sessionId,
      currentQuestionId: nextItem?.question.id ?? null,
      currentSectionId: nextItem?.section.id ?? null,
      currentIndex: nextIndex,
      score: 0,
      pendingReviewScore: nextPendingReviewScore,
    });
  }

  async function goToResolvedNextQuestion(
    nextPendingReviewScore = pendingReviewScore,
  ) {
    if (!currentQuestion) {
      setCurrentIndex(items.length);
      return;
    }

    let nextIndex = items.length;

    const resolvedNextQuestionId = resolveNextQuestionId(
      currentQuestion,
      currentAnswer,
    );

    if (resolvedNextQuestionId) {
      const resolvedNextIndex = questionIndexById[resolvedNextQuestionId];
      if (resolvedNextIndex !== undefined) {
        nextIndex = resolvedNextIndex;
      }
    } else if (currentIndex < items.length - 1) {
      nextIndex = currentIndex + 1;
    }

    setHistoryStack((prev) => [...prev, currentIndex]);
    setCurrentIndex(nextIndex);
    await persistProgress(nextIndex, nextPendingReviewScore);
  }

  async function submitCurrent() {
    if (!currentQuestion || !currentSection || !sessionId || !participantId) {
      return;
    }

    if (!canQuestionBeAnswered(currentQuestion, currentAnswer) || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const alreadySubmitted = submittedQuestionIds[currentQuestion.id] === true;

    try {
      let sanitizedAnswer = sanitizeAnswerForStorage(currentAnswer);
      let answerText = getAnswerText(currentAnswer);
      const pendingDelta =
        !alreadySubmitted && currentQuestion.evaluation.kind === "manual_review"
          ? getPendingReviewPoints(currentQuestion)
          : 0;

      const nextPendingReviewScore = pendingReviewScore + pendingDelta;

      let photoStoragePath: string | null = null;
      let photoCaption: string | null = null;
      let photoConsentObtained: boolean | null = null;

      if (currentQuestion.type === "photo") {
        const photoAnswer = currentAnswer as LearnPhotoAnswerValue;

        if (!photoAnswer.file) {
          setIsSubmitting(false);
          return;
        }

        const uploadResult = await createActivityCollectPhoto({
          eventSlug,
          activitySlug: activity.slug,
          participantId,
          questionId: currentQuestion.id,
          file: photoAnswer.file,
        });

        photoStoragePath = uploadResult.storagePath;
        photoCaption = photoAnswer.note?.trim() || null;
        photoConsentObtained = photoAnswer.consent;

        sanitizedAnswer = {
          consent: photoAnswer.consent,
          tierValue: photoAnswer.tierValue ?? null,
          note: photoAnswer.note ?? "",
          file: null,
          storagePath: uploadResult.storagePath,
          publicUrl: uploadResult.publicUrl,
        };

        answerText = photoCaption || photoAnswer.file.name;
      }

      const savedAnswer = await saveActivityAnswer({
        sessionId,
        eventSlug,
        activitySlug: activity.slug,
        participantId,
        questionId: currentQuestion.id,
        sectionId: currentSection.id,
        questionType: currentQuestion.type,
        answerJson: sanitizedAnswer,
        answerText,
        isAnswered: true,
        isSkipped: false,
        attemptsUsed: 1,
        isCorrect: null,
        isManualReview: currentQuestion.evaluation.kind === "manual_review",
        scoreDelta: 0,
        pendingReviewScore: pendingDelta,
      });

      if (currentQuestion.evaluation.kind === "manual_review") {
        await upsertActivityReviewQueueItem({
          sessionId,
          answerId: savedAnswer.id,
          eventSlug,
          activitySlug: activity.slug,
          participantId,
          questionId: currentQuestion.id,
        });
      }

      await createActivityCollectResponse({
        eventSlug,
        activitySlug: activity.slug,
        sessionId,
        participantId,
        questionId: currentQuestion.id,
        sectionId: currentSection.id,
        questionType: currentQuestion.type,
        answerJson: sanitizedAnswer,
        answerText,
        photoStoragePath,
        photoCaption,
        photoConsentObtained,
      });

      setSubmittedQuestionIds((prev) => ({
        ...prev,
        [currentQuestion.id]: true,
      }));

      if (pendingDelta > 0) {
        setPendingReviewScore(nextPendingReviewScore);
      }

      window.setTimeout(() => {
        void goToResolvedNextQuestion(nextPendingReviewScore).finally(() => {
          setIsSubmitting(false);
        });
      }, getSubmitDelayMs(currentQuestion));
    } catch (error) {
      console.error("Impossible d'enregistrer la réponse collect", error);
      setIsSubmitting(false);
    }
  }

  async function skipCurrent() {
    if (
      !currentQuestion ||
      !currentSection ||
      !sessionId ||
      !participantId ||
      !canSkip ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      await saveActivityAnswer({
        sessionId,
        eventSlug,
        activitySlug: activity.slug,
        participantId,
        questionId: currentQuestion.id,
        sectionId: currentSection.id,
        questionType: currentQuestion.type,
        answerJson: sanitizeAnswerForStorage(currentAnswer),
        answerText: getAnswerText(currentAnswer),
        isAnswered: false,
        isSkipped: true,
        attemptsUsed: 0,
        isCorrect: null,
        isManualReview: false,
        scoreDelta: 0,
        pendingReviewScore: 0,
      });

      await createActivityCollectResponse({
        eventSlug,
        activitySlug: activity.slug,
        sessionId,
        participantId,
        questionId: currentQuestion.id,
        sectionId: currentSection.id,
        questionType: currentQuestion.type,
        answerJson: sanitizeAnswerForStorage(currentAnswer),
        answerText: getAnswerText(currentAnswer),
        photoStoragePath: null,
        photoCaption: null,
        photoConsentObtained: null,
      });

      await goToResolvedNextQuestion();
    } catch (error) {
      console.error("Impossible de passer la question collect", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function goBack() {
    if (!canGoBack || isSubmitting || isBootstrapping) return;
    if (historyStack.length === 0) return;

    const previousIndex = historyStack[historyStack.length - 1] ?? 0;

    setHistoryStack((prev) => prev.slice(0, -1));
    setCurrentIndex(previousIndex);
    await persistProgress(previousIndex);
  }

  function goNext() {
    if (!canSubmitCurrent) return;
    submitCurrent();
  }

  async function editAnswers() {
    if (!sessionId) return;

    setHasStarted(true);
    setCurrentIndex(0);
    hasCompletedRef.current = false;

    await saveActivitySessionProgress({
      sessionId,
      currentQuestionId: items[0]?.question.id ?? null,
      currentSectionId: items[0]?.section.id ?? null,
      currentIndex: 0,
      score: 0,
      pendingReviewScore,
      hasStarted: true,
    });
  }

  async function restart() {
    const initialAnswers: Record<string, LearnAnswerValue> = {};

    items.forEach(({ question }) => {
      initialAnswers[question.id] = defaultAnswerForQuestion(question);
    });

    hasCompletedRef.current = false;

    setHasStarted(!activity.introMarkdown);
    setCurrentIndex(0);
    setAnswersByQuestionId(initialAnswers);
    setSubmittedQuestionIds({});
    setPendingReviewScore(0);
    setHistoryStack([]);
    setIsSubmitting(false);

    if (!sessionId) return;

    await resetActivitySession({ sessionId });

    if (!activity.introMarkdown) {
      await saveActivitySessionProgress({
        sessionId,
        currentQuestionId: items[0]?.question.id ?? null,
        currentSectionId: items[0]?.section.id ?? null,
        currentIndex: 0,
        score: 0,
        pendingReviewScore: 0,
        hasStarted: true,
      });
    }
  }

  return {
    activity,
    currentIndex,
    currentQuestion,
    currentSection,
    currentAnswer,
    isComplete,
    hasStarted,
    totalQuestions,
    pendingReviewScore,
    currentPendingReviewPoints,
    canSkip,
    canGoBack,
    isSubmitting,
    isBootstrapping,
    submittingLabel,
    start,
    setAnswer,
    canSubmitCurrent: canSubmitCurrent(),
    submitCurrent,
    skipCurrent,
    goBack,
    goNext,
    restart,
    editAnswers,
    answersByQuestionId,
    submittedQuestionIds,
    sessionId,
  };
}