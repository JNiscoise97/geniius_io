// src/features/player/experiences/learn/hooks/useLearnActivityPlayer.ts

import { useEffect, useMemo, useRef, useState } from "react";
import { completeActivitySession } from "../../../api/completeActivitySession";
import { getOrCreateActivitySession } from "../../../api/getOrCreateActivitySession";
import { loadActivitySessionState } from "../../../api/loadActivitySessionState";
import { saveActivityAnswer } from "../../../api/saveActivityAnswer";
import { saveActivitySessionProgress } from "../../../api/saveActivitySessionProgress";
import { upsertActivityReviewQueueItem } from "../../../api/upsertActivityReviewQueueItem";
import type {
    ActivityDefinition,
    ActivityQuestionDefinition,
    ActivitySectionDefinition,
    QuestionEvaluation,
} from "../../../core/activity/activityTypes";
import { getPenaltyForAttempt } from "../../../core/activity/utils/getPenaltyForAttempt";
import { resolveNextQuestionId } from "../../../core/activity/utils/resolveNextQuestionId";
import { getParticipantSession } from "../../../../../lib/participant-session/getActiveParticipant";
import { resetActivitySession } from "../../../api/restActivitySession";

export type LearnPhotoAnswerValue = {
    file: File | null;
    consent: boolean;
    tierValue?: number | null;
    note?: string;
};

export type LearnAnswerValue =
    | string
    | string[]
    | boolean
    | number
    | null
    | LearnPhotoAnswerValue;

export type LearnQuestionResult = {
    isCorrect: boolean | null;
    isSkipped?: boolean;
    scoreDelta: number;
    cumulativeScoreDelta?: number;
    explanation?: string;
    expectedAnswerLabel?: string;
    retryAllowed?: boolean;
    attemptsLeft?: number;
    maxAttempts?: number;
    appliedPenalty?: number;
    attemptsUsed?: number;
    isManualReview?: boolean;
    reviewLabel?: string;
    submittedTitle?: string;
};

export type LearnFlatQuestionItem = {
    section: ActivitySectionDefinition;
    question: ActivityQuestionDefinition;
    flatIndex: number;
};

function normalizeText(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

function getQuestionPoints(evaluation: QuestionEvaluation): number {
    if (
        evaluation.kind === "auto_correct" ||
        evaluation.kind === "submit_only" ||
        evaluation.kind === "manual_review"
    ) {
        return evaluation.points ?? 0;
    }

    return 0;
}

function defaultAnswerForQuestion(
    question: ActivityQuestionDefinition
): LearnAnswerValue {
    switch (question.type) {
        case "qcu":
        case "short":
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

function getExpectedAnswerLabel(
    question: ActivityQuestionDefinition
): string | undefined {
    const evaluation = question.evaluation;

    if (evaluation.kind !== "auto_correct") return undefined;

    switch (question.type) {
        case "qcu": {
            const expected = String(evaluation.answer);
            const option = question.options.find((opt) => opt.value === expected);
            return option?.label ?? expected;
        }

        case "qcm": {
            const expectedValues = Array.isArray(evaluation.answer)
                ? evaluation.answer.map(String)
                : [];
            const labels = question.options
                .filter((opt) => expectedValues.includes(opt.value))
                .map((opt) => opt.label);

            return labels.length > 0 ? labels.join(", ") : expectedValues.join(", ");
        }

        case "truefalse":
            return Boolean(evaluation.answer) ? "Vrai" : "Faux";

        case "short":
        case "fill":
        case "date":
        case "numeric":
            return String(evaluation.answer ?? "");

        case "select": {
            if (question.multiple) {
                const expectedValues = Array.isArray(evaluation.answer)
                    ? evaluation.answer.map(String)
                    : [];
                const labels = question.options
                    .filter((opt) => expectedValues.includes(opt.value))
                    .map((opt) => opt.label);

                return labels.length > 0 ? labels.join(", ") : expectedValues.join(", ");
            }

            const expected = String(evaluation.answer ?? "");
            const option = question.options.find((opt) => opt.value === expected);
            return option?.label ?? expected;
        }

        default:
            return undefined;
    }
}

function getAttemptMeta(question: ActivityQuestionDefinition): {
    retryEnabled: boolean;
    maxAttempts?: number;
} {
    const evaluation = question.evaluation;

    if (evaluation.kind !== "auto_correct") {
        return { retryEnabled: false, maxAttempts: 1 };
    }

    if (!evaluation.retry) {
        return { retryEnabled: false, maxAttempts: 1 };
    }

    return {
        retryEnabled: true,
        maxAttempts: evaluation.maxAttempts,
    };
}

function canQuestionBeAnswered(
    question: ActivityQuestionDefinition,
    answer: LearnAnswerValue
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

function evaluateQuestion(
    question: ActivityQuestionDefinition,
    answer: LearnAnswerValue,
    attemptsUsedAfterSubmit: number,
    previousCumulativeScoreDelta: number
): LearnQuestionResult {
    const evaluation = question.evaluation;
    const expectedAnswerLabel =
        question.feedback?.expectedAnswerLabel || getExpectedAnswerLabel(question);

    if (evaluation.kind === "none") {
        return {
            isCorrect: null,
            scoreDelta: 0,
            cumulativeScoreDelta: previousCumulativeScoreDelta,
            explanation: question.feedback?.explanationMarkdown,
            expectedAnswerLabel,
            retryAllowed: false,
            attemptsLeft: 0,
            maxAttempts: 1,
            appliedPenalty: 0,
            attemptsUsed: attemptsUsedAfterSubmit,
            submittedTitle: question.feedback?.submittedTitle,
        };
    }

    if (evaluation.kind === "submit_only") {
        const scoreDelta = getQuestionPoints(evaluation);

        return {
            isCorrect: null,
            scoreDelta,
            cumulativeScoreDelta: previousCumulativeScoreDelta + scoreDelta,
            explanation: question.feedback?.explanationMarkdown,
            expectedAnswerLabel,
            retryAllowed: false,
            attemptsLeft: 0,
            maxAttempts: 1,
            appliedPenalty: 0,
            attemptsUsed: attemptsUsedAfterSubmit,
            isManualReview: false,
            submittedTitle: question.feedback?.submittedTitle,
        };
    }

    if (evaluation.kind === "manual_review") {
        return {
            isCorrect: null,
            scoreDelta: 0,
            cumulativeScoreDelta: previousCumulativeScoreDelta,
            explanation: question.feedback?.explanationMarkdown,
            expectedAnswerLabel,
            retryAllowed: false,
            attemptsLeft: 0,
            maxAttempts: 1,
            appliedPenalty: 0,
            attemptsUsed: attemptsUsedAfterSubmit,
            isManualReview: true,
            reviewLabel: evaluation.reviewLabel,
            submittedTitle: question.feedback?.submittedTitle,
        };
    }

    let isCorrect = false;

    switch (question.type) {
        case "qcu":
            isCorrect = String(answer) === String(evaluation.answer);
            break;

        case "qcm": {
            const actual = Array.isArray(answer) ? answer.map(String) : [];
            const expected = Array.isArray(evaluation.answer)
                ? evaluation.answer.map(String)
                : [];

            const actualSet = new Set(actual);
            const expectedSet = new Set(expected);

            isCorrect =
                actualSet.size === expectedSet.size &&
                [...actualSet].every((item) => expectedSet.has(item));
            break;
        }

        case "truefalse":
            isCorrect = Boolean(answer) === Boolean(evaluation.answer);
            break;

        case "numeric": {
            const actual = Number(String(answer ?? "").replace(",", "."));
            const expected = Number(evaluation.answer);
            const tolerance = evaluation.tolerance ?? 0;

            isCorrect =
                Number.isFinite(actual) &&
                Number.isFinite(expected) &&
                Math.abs(actual - expected) <= tolerance;
            break;
        }

        case "short":
        case "fill": {
            const compareMode = evaluation.compareMode ?? "normalized";
            const actual = String(answer ?? "");
            const expected = String(evaluation.answer ?? "");

            isCorrect =
                compareMode === "exact"
                    ? actual === expected
                    : normalizeText(actual) === normalizeText(expected);
            break;
        }

        case "date": {
            const actual = String(answer ?? "").trim();
            const expected = String(evaluation.answer ?? "").trim();
            const compareMode = evaluation.compareMode ?? "exact";

            isCorrect =
                compareMode === "normalized"
                    ? normalizeText(actual) === normalizeText(expected)
                    : actual === expected;
            break;
        }

        case "select": {
            if (question.multiple) {
                const actual = Array.isArray(answer) ? answer.map(String) : [];
                const expected = Array.isArray(evaluation.answer)
                    ? evaluation.answer.map(String)
                    : [];

                const actualSet = new Set(actual);
                const expectedSet = new Set(expected);

                isCorrect =
                    actualSet.size === expectedSet.size &&
                    [...actualSet].every((item) => expectedSet.has(item));
            } else {
                isCorrect = String(answer) === String(evaluation.answer);
            }
            break;
        }

        default:
            isCorrect = false;
            break;
    }

    const attemptMeta = getAttemptMeta(question);

    const attemptsLeft =
        attemptMeta.maxAttempts !== undefined
            ? Math.max(attemptMeta.maxAttempts - attemptsUsedAfterSubmit, 0)
            : undefined;

    const retryAllowed =
        !isCorrect &&
        attemptMeta.retryEnabled &&
        (attemptMeta.maxAttempts === undefined ||
            attemptsUsedAfterSubmit < attemptMeta.maxAttempts);

    if (isCorrect) {
        const scoreDelta = evaluation.points ?? 0;

        return {
            isCorrect: true,
            scoreDelta,
            cumulativeScoreDelta: previousCumulativeScoreDelta + scoreDelta,
            explanation:
                question.feedback?.correctExplanationMarkdown ||
                question.feedback?.explanationMarkdown,
            expectedAnswerLabel,
            retryAllowed: false,
            attemptsLeft: 0,
            maxAttempts: attemptMeta.maxAttempts ?? 1,
            appliedPenalty: 0,
            attemptsUsed: attemptsUsedAfterSubmit,
        };
    }

    const penalty = getPenaltyForAttempt(evaluation, attemptsUsedAfterSubmit);
    const scoreDelta = penalty > 0 ? -penalty : 0;

    return {
        isCorrect: false,
        scoreDelta,
        cumulativeScoreDelta: previousCumulativeScoreDelta + scoreDelta,
        explanation:
            question.feedback?.incorrectExplanationMarkdown ||
            question.feedback?.explanationMarkdown,
        expectedAnswerLabel,
        retryAllowed,
        attemptsLeft,
        maxAttempts: attemptMeta.maxAttempts ?? 1,
        appliedPenalty: penalty,
        attemptsUsed: attemptsUsedAfterSubmit,
    };
}

function flattenActivityQuestions(
    activity: ActivityDefinition
): LearnFlatQuestionItem[] {
    const items: LearnFlatQuestionItem[] = [];

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

export function useLearnActivityPlayer(
    activity: ActivityDefinition,
    eventSlug: string
) {
    const items = useMemo(() => flattenActivityQuestions(activity), [activity]);

    const questionIndexById = useMemo(() => {
        const indexMap: Record<string, number> = {};
        items.forEach((item, index) => {
            indexMap[item.question.id] = index;
        });
        return indexMap;
    }, [items]);

    const immediateFeedbackEnabled = activity.feedback.kind === "immediate";
    const deferredFeedbackEnabled = activity.feedback.kind === "deferred";
    const feedbackEnabled = immediateFeedbackEnabled;
    const canSkip = activity.navigation.allowSkip === true;
    const canGoBack = activity.navigation.allowBack === true;

    const [isBootstrapping, setIsBootstrapping] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [participantId, setParticipantId] = useState<string | null>(null);

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
    const [resultsByQuestionId, setResultsByQuestionId] = useState<
        Record<string, LearnQuestionResult>
    >({});
    const [attemptsByQuestionId, setAttemptsByQuestionId] = useState<
        Record<string, number>
    >({});
    const [scoreDeltaByQuestionId, setScoreDeltaByQuestionId] = useState<
        Record<string, number>
    >({});
    const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
    const [score, setScore] = useState(0);
    const [historyStack, setHistoryStack] = useState<number[]>([]);

    const hasCompletedRef = useRef(false);

    const currentItem = items[currentIndex] ?? null;
    const currentQuestion = currentItem?.question ?? null;
    const currentSection = currentItem?.section ?? null;

    const isComplete = hasStarted && currentIndex >= items.length;
    const totalQuestions = items.length;

    const currentAnswer = currentQuestion
        ? answersByQuestionId[currentQuestion.id] ??
        defaultAnswerForQuestion(currentQuestion)
        : null;

    const currentResult = currentQuestion
        ? resultsByQuestionId[currentQuestion.id] ?? null
        : null;

    const currentAttemptMeta = currentQuestion
        ? getAttemptMeta(currentQuestion)
        : null;

    const currentAttemptsUsed = currentQuestion
        ? attemptsByQuestionId[currentQuestion.id] ?? 0
        : 0;

    const currentMaxAttempts = currentAttemptMeta?.maxAttempts;
    const currentRetryEnabled = currentAttemptMeta?.retryEnabled ?? false;

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
                setHasStarted(
                    loaded.session.has_started ? true : !activity.introMarkdown
                );
                setCurrentIndex(
                    typeof loaded.session.current_index === "number"
                        ? Math.min(loaded.session.current_index, items.length)
                        : 0
                );
                setScore(loaded.session.score ?? 0);

                const nextAnswers: Record<string, LearnAnswerValue> = {};
                const nextResults: Record<string, LearnQuestionResult> = {};
                const nextAttempts: Record<string, number> = {};
                const nextScoreDeltas: Record<string, number> = {};

                items.forEach(({ question }) => {
                    nextAnswers[question.id] = defaultAnswerForQuestion(question);
                });

                loaded.answers.forEach((answerRow) => {
                    if (answerRow.question_id in nextAnswers) {
                        nextAnswers[answerRow.question_id] =
                            (answerRow.answer_json as LearnAnswerValue) ??
                            nextAnswers[answerRow.question_id];
                    }

                    nextAttempts[answerRow.question_id] = answerRow.attempts_used ?? 0;
                    nextScoreDeltas[answerRow.question_id] = answerRow.score_delta ?? 0;

                    if (answerRow.is_skipped) {
                        nextResults[answerRow.question_id] = {
                            isCorrect: null,
                            isSkipped: true,
                            scoreDelta: 0,
                            cumulativeScoreDelta: answerRow.score_delta ?? 0,
                            retryAllowed: false,
                            attemptsLeft: 0,
                            maxAttempts: 1,
                            appliedPenalty: 0,
                            attemptsUsed: answerRow.attempts_used ?? 0,
                        };
                        return;
                    }

                    if (answerRow.is_answered) {
                        nextResults[answerRow.question_id] = {
                            isCorrect: answerRow.is_correct,
                            scoreDelta: answerRow.score_delta ?? 0,
                            cumulativeScoreDelta: answerRow.score_delta ?? 0,
                            retryAllowed: false,
                            attemptsLeft: 0,
                            maxAttempts: 1,
                            appliedPenalty:
                                answerRow.score_delta < 0 ? Math.abs(answerRow.score_delta) : 0,
                            attemptsUsed: answerRow.attempts_used ?? 0,
                            isManualReview: answerRow.is_manual_review ?? false,
                        };
                    }
                });

                setAnswersByQuestionId(nextAnswers);
                setResultsByQuestionId(nextResults);
                setAttemptsByQuestionId(nextAttempts);
                setScoreDeltaByQuestionId(nextScoreDeltas);
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
            score,
            pendingReviewScore: 0,
        });
    }, [isComplete, score, sessionId]);

    async function start() {
        if (isBootstrapping || !sessionId) return;

        setHasStarted(true);

        await saveActivitySessionProgress({
            sessionId,
            currentQuestionId: currentQuestion?.id ?? null,
            currentSectionId: currentSection?.id ?? null,
            currentIndex,
            score,
            pendingReviewScore: 0,
            hasStarted: true,
        });
    }

    function setAnswer(value: LearnAnswerValue) {
        if (!currentQuestion || isBootstrapping) return;

        setAnswersByQuestionId((prev) => ({
            ...prev,
            [currentQuestion.id]: value,
        }));
    }

    function canSubmitCurrent(): boolean {
        if (!currentQuestion) return false;
        if (isFeedbackVisible || isBootstrapping) return false;

        if (!canQuestionBeAnswered(currentQuestion, currentAnswer)) {
            return false;
        }

        if (
            currentRetryEnabled &&
            currentMaxAttempts !== undefined &&
            currentAttemptsUsed >= currentMaxAttempts
        ) {
            return false;
        }

        return true;
    }

    async function persistProgress(nextIndex: number, nextScore: number) {
        if (!sessionId) return;

        const nextItem = items[nextIndex] ?? null;

        await saveActivitySessionProgress({
            sessionId,
            currentQuestionId: nextItem?.question.id ?? null,
            currentSectionId: nextItem?.section.id ?? null,
            currentIndex: nextIndex,
            score: nextScore,
            pendingReviewScore: 0,
        });
    }

    async function goToResolvedNextQuestion(nextScore = score) {
        if (!currentQuestion) {
            setCurrentIndex(items.length);
            setIsFeedbackVisible(false);
            return;
        }

        let nextIndex = items.length;

        const resolvedNextQuestionId = resolveNextQuestionId(
            currentQuestion,
            currentAnswer
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
        setIsFeedbackVisible(false);
        await persistProgress(nextIndex, nextScore);
    }

    async function submitCurrent() {
        if (!currentQuestion || !currentSection || !sessionId || !participantId) {
            return;
        }

        if (!canQuestionBeAnswered(currentQuestion, currentAnswer)) return;

        if (
            currentRetryEnabled &&
            currentMaxAttempts !== undefined &&
            currentAttemptsUsed >= currentMaxAttempts
        ) {
            return;
        }

        const attemptsUsedAfterSubmit = currentAttemptsUsed + 1;
        const previousCumulativeScoreDelta =
            scoreDeltaByQuestionId[currentQuestion.id] ?? 0;

        setAttemptsByQuestionId((prev) => ({
            ...prev,
            [currentQuestion.id]: attemptsUsedAfterSubmit,
        }));

        const result = evaluateQuestion(
            currentQuestion,
            currentAnswer,
            attemptsUsedAfterSubmit,
            previousCumulativeScoreDelta
        );

        const nextScore = score + result.scoreDelta;

        setResultsByQuestionId((prev) => ({
            ...prev,
            [currentQuestion.id]: result,
        }));

        setScoreDeltaByQuestionId((prev) => ({
            ...prev,
            [currentQuestion.id]:
                result.cumulativeScoreDelta ?? previousCumulativeScoreDelta,
        }));

        setScore(nextScore);

        const savedAnswer = await saveActivityAnswer({
            sessionId,
            eventSlug,
            activitySlug: activity.slug,
            participantId,
            questionId: currentQuestion.id,
            sectionId: currentSection.id,
            questionType: currentQuestion.type,
            answerJson: sanitizeAnswerForStorage(currentAnswer),
            answerText: getAnswerText(currentAnswer),
            isAnswered: true,
            isSkipped: false,
            attemptsUsed: attemptsUsedAfterSubmit,
            isCorrect: result.isCorrect,
            isManualReview: result.isManualReview === true,
            scoreDelta: result.scoreDelta,
            pendingReviewScore: 0,
        });

        if (result.isManualReview) {
            await upsertActivityReviewQueueItem({
                sessionId,
                answerId: savedAnswer.id,
                eventSlug,
                activitySlug: activity.slug,
                participantId,
                questionId: currentQuestion.id,
            });
        }

        if (immediateFeedbackEnabled) {
            setIsFeedbackVisible(true);
            await persistProgress(currentIndex, nextScore);
            return;
        }

        if (result.retryAllowed) {
            setIsFeedbackVisible(false);
            await persistProgress(currentIndex, nextScore);
            return;
        }

        await goToResolvedNextQuestion(nextScore);
    }

    async function skipCurrent() {
        if (
            !currentQuestion ||
            !currentSection ||
            !sessionId ||
            !participantId ||
            !canSkip ||
            isFeedbackVisible
        ) {
            return;
        }

        setResultsByQuestionId((prev) => ({
            ...prev,
            [currentQuestion.id]: {
                isCorrect: null,
                isSkipped: true,
                scoreDelta: 0,
                cumulativeScoreDelta: scoreDeltaByQuestionId[currentQuestion.id] ?? 0,
                retryAllowed: false,
                attemptsLeft: 0,
                maxAttempts: currentMaxAttempts ?? 1,
                appliedPenalty: 0,
                attemptsUsed: currentAttemptsUsed,
            },
        }));

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
            attemptsUsed: currentAttemptsUsed,
            isCorrect: null,
            isManualReview: false,
            scoreDelta: 0,
            pendingReviewScore: 0,
        });

        if (feedbackEnabled) {
            setIsFeedbackVisible(true);
            await persistProgress(currentIndex, score);
            return;
        }

        await goToResolvedNextQuestion(score);
    }

    async function next() {
        if (currentResult?.retryAllowed) {
            setIsFeedbackVisible(false);
            await persistProgress(currentIndex, score);
            return;
        }

        await goToResolvedNextQuestion(score);
    }

    async function goBack() {
        if (!canGoBack || isFeedbackVisible || isBootstrapping) return;
        if (historyStack.length === 0) return;

        const previousIndex = historyStack[historyStack.length - 1] ?? 0;

        setHistoryStack((prev) => prev.slice(0, -1));
        setCurrentIndex(previousIndex);
        setIsFeedbackVisible(false);
        await persistProgress(previousIndex, score);
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
        setResultsByQuestionId({});
        setAttemptsByQuestionId({});
        setScoreDeltaByQuestionId({});
        setIsFeedbackVisible(false);
        setScore(0);
        setHistoryStack([]);

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
        currentResult,
        isFeedbackVisible,
        isComplete,
        hasStarted,
        canSkip,
        canGoBack,
        score,
        totalQuestions,
        currentAttemptsUsed,
        currentMaxAttempts,
        currentRetryEnabled,
        feedbackEnabled,
        immediateFeedbackEnabled,
        deferredFeedbackEnabled,
        isBootstrapping,
        start,
        setAnswer,
        canSubmitCurrent: canSubmitCurrent(),
        submitCurrent,
        skipCurrent,
        next,
        goBack,
        restart,
        sessionId,
    };
}