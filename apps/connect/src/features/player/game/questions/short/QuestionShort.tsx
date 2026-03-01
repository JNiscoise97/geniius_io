// src/features/player/game/questions/short/QuestionShort.tsx
import type { ShortQuestion } from "../../engine/types";
import "../../question-screen.css";

export function QuestionShort({
  question,
  draft,
  onDraftChange,
  disabled,
}: {
  question: ShortQuestion;
  draft: string;
  onDraftChange: (next: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="qs-field">
      <label className="qs-label">Ta réponse</label>
      <input
        className="qs-input"
        value={typeof draft === "string" ? draft : ""}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder="Tape ta réponse…"
        disabled={disabled}
      />
      <div className="qs-hint">Réponse {question.mode === "exact" ? "exacte" : "normalisée"}</div>
    </div>
  );
}