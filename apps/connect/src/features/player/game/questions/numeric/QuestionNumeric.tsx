// src/features/player/game/questions/numeric/QuestionNumeric.tsx
import type { NumericQuestion } from "../../engine/types";
import "../../question-screen.css";

export function QuestionNumeric({
  question,
  draft,
  onDraftChange,
  disabled,
}: {
  question: NumericQuestion;
  draft: string;
  onDraftChange: (next: string) => void;
  disabled?: boolean;
}) {
  console.log("QuestionNumeric", question)
  return (
    <div className="qs-field">
      <label className="qs-label">Ta réponse (nombre)</label>
      <input
        className="qs-input"
        value={typeof draft === "string" ? draft : String(draft ?? "")}
        onChange={(e) => onDraftChange(e.target.value)}
        inputMode="numeric"
        placeholder="Ex: 3"
        disabled={disabled}
      />
      <div className="qs-hint">Clavier numérique</div>
    </div>
  );
}