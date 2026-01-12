//reducer.ts
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
  attemptsByQ: Record<string, number>;
};

export type GameAction =
  | { type: "START_ZONE" }
  | { type: "ANSWER"; answer: any }
  | { type: "NEXT" }
  | { type: "RETRY" };

export function createInitialState(zone: ZoneContent): GameState {
  return {
    zone,
    step: "intro",
    qIndex: 0,
    score: 0,
    startedAt: Date.now(),
    attemptsByQ: {},
  };
}

function currentQuestion(state: GameState): AnyQuestion | null {
  return state.zone.questions[state.qIndex] ?? null;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_ZONE":
      return { ...state, step: "question", qIndex: 0 };

    case "ANSWER": {
      const q = currentQuestion(state);
      if (!q) return { ...state, step: "zone_end" };

      const attempts = (state.attemptsByQ[q.id] ?? 0) + 1;
      const res = evaluateAnswer(q, action.answer);

      const canRetry = !res.correct && (q.retry ?? false);

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
        score: state.score + res.delta, // photo => delta 0
        step: "feedback",
        attemptsByQ: { ...state.attemptsByQ, [q.id]: attempts },
        feedback: {
          kind,
          correct: res.correct,
          delta: res.delta,
        },
      };
    }

    case "RETRY":
      return { ...state, step: "question", feedback: undefined };

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
      return {
        ...state,
        step: "question",
        qIndex: nextIndex,
        feedback: undefined,
      };
    }

    default:
      return state;
  }
}
