// reducer.ts
import { evaluateAnswer } from "./scoring";
import type { ZoneContent, AnyQuestion } from "./types";

export type FeedbackKind = "success" | "fail" | "retry" | "submitted";

export type GameState = {
  zone: ZoneContent;
  step: "intro" | "question" | "feedback" | "zone_end";
  qIndex: number;
  score: number;
  startedAt: number;
  feedback?: {
    kind: FeedbackKind;
    correct: boolean;
    delta: number;
  };

  // historique tentatives par question (dans cette zone)
  attemptsByQ: Record<string, number>;

  // ✅ tentatives "système" pour la question courante (UI-friendly)
  maxAttempts: number;
  triesLeft: number;
};

export type GameAction =
  | { type: "START_ZONE" }
  | { type: "ANSWER"; answer: any }
  | { type: "NEXT" }
  | { type: "RETRY" };

function currentQuestion(state: GameState): AnyQuestion | null {
  return state.zone.questions[state.qIndex] ?? null;
}

// Règle centrale : retry => 2 essais max, sinon 1
function maxAttemptsForQuestion(q: AnyQuestion): number {
  // tu peux faire évoluer ça plus tard (ex: q.maxAttempts)
  return q.retry ? 2 : 1;
}

function computeTriesLeft(q: AnyQuestion, attemptsUsed: number): { maxAttempts: number; triesLeft: number } {
  const maxAttempts = maxAttemptsForQuestion(q);
  const triesLeft = Math.max(0, maxAttempts - attemptsUsed);
  return { maxAttempts, triesLeft };
}

export function createInitialState(zone: ZoneContent): GameState {
  const q0 = zone.questions[0] ?? null;
  const maxAttempts = q0 ? maxAttemptsForQuestion(q0) : 1;

  return {
    zone,
    step: "intro",
    qIndex: 0,
    score: 0,
    startedAt: Date.now(),
    feedback: undefined,
    attemptsByQ: {},

    // ✅ initialisés même en intro (utile pour UI)
    maxAttempts,
    triesLeft: maxAttempts,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_ZONE": {
      const q = state.zone.questions[0] ?? null;
      if (!q) return { ...state, step: "zone_end", qIndex: 0, feedback: undefined };

      const attemptsUsed = state.attemptsByQ[q.id] ?? 0;
      const { maxAttempts, triesLeft } = computeTriesLeft(q, attemptsUsed);

      return {
        ...state,
        step: "question",
        qIndex: 0,
        feedback: undefined,
        maxAttempts,
        triesLeft,
      };
    }

    case "ANSWER": {
      const q = currentQuestion(state);
      if (!q) return { ...state, step: "zone_end" };

      // tentative N = previous + 1
      const prevAttempts = state.attemptsByQ[q.id] ?? 0;
      const attempts = prevAttempts + 1;

      const res = evaluateAnswer(q, action.answer);

      // après CETTE tentative, combien reste-t-il ?
      const { maxAttempts, triesLeft } = computeTriesLeft(q, attempts);

      // ✅ règle retry complète : il faut que retry soit autorisé ET qu'il reste des essais
      const canRetry = !res.correct && (q.retry ?? false) && triesLeft > 0;

      const kind: FeedbackKind =
        res.kind === "submitted"
          ? "submitted"
          : res.correct
            ? "success"
            : canRetry
              ? "retry"
              : "fail";

      return {
        ...state,
        score: state.score + res.delta, // photo => delta 0 (normal)
        step: "feedback",
        attemptsByQ: { ...state.attemptsByQ, [q.id]: attempts },
        maxAttempts,
        triesLeft,
        feedback: {
          kind,
          correct: res.correct,
          delta: res.delta,
        },
      };
    }

    case "RETRY": {
      // on revient sur la même question
      // triesLeft/maxAttempts ne changent pas ici (déjà mis à jour dans ANSWER)
      return { ...state, step: "question", feedback: undefined };
    }

    case "NEXT": {
      const nextIndex = state.qIndex + 1;

      if (nextIndex >= state.zone.questions.length) {
        return {
          ...state,
          step: "zone_end",
          qIndex: nextIndex,
          feedback: undefined,
        };
      }

      const nextQ = state.zone.questions[nextIndex]!;
      const attemptsUsed = state.attemptsByQ[nextQ.id] ?? 0;
      const { maxAttempts, triesLeft } = computeTriesLeft(nextQ, attemptsUsed);

      return {
        ...state,
        step: "question",
        qIndex: nextIndex,
        feedback: undefined,
        maxAttempts,
        triesLeft,
      };
    }

    default:
      return state;
  }
}