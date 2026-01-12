import type { AnyQuestion } from "./types";

export type AnswerResult = {
  correct: boolean;
  delta: number;
  message?: string;
  kind?: "normal" | "submitted";
};

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function evaluateAnswer(q: AnyQuestion, userAnswer: any): AnswerResult {
  // ✅ Photo: toujours "soumis", pas de notion de vrai/faux, pas de points en direct
  if (q.type === "photo") {
    return {
      correct: true,
      delta: 0,
      kind: "submitted",
      message: "Photo envoyée. Validation par l’organisateur en cours.",
    };
  }

  const pts = q.points ?? 10;
  const penalty = q.penalty ?? 0;

  let correct = false;

  switch (q.type) {
    case "qcu":
      correct = String(userAnswer) === q.answer;
      break;

    case "qcm": {
      const a = Array.isArray(userAnswer) ? userAnswer.map(String) : [];
      const expected = q.answer.map(String);
      const sa = new Set(a);
      const se = new Set(expected);
      correct = sa.size === se.size && [...sa].every((x) => se.has(x));
      break;
    }

    case "truefalse":
      correct = Boolean(userAnswer) === q.answer;
      break;

    case "numeric": {
      const v = Number(userAnswer);
      const tol = q.tolerance ?? 0;
      correct = Number.isFinite(v) && Math.abs(v - q.answer) <= tol;
      break;
    }

    case "short":
    case "fill": {
      const mode = q.mode ?? "normalized";
      correct =
        mode === "exact"
          ? String(userAnswer) === q.answer
          : norm(String(userAnswer)) === norm(q.answer);
      break;
    }
  }

  if (correct) return { correct: true, delta: pts, kind: "normal" };
  if (q.penaltyEnabled) return { correct: false, delta: -penalty, kind: "normal" };
  return { correct: false, delta: 0, kind: "normal" };
}
