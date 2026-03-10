// src/features/player/game/questions/fill/QuestionFill.tsx
import type { FillQuestion } from "../../engine/types";
import "../../question-screen.css";

export function QuestionFill({
  question,
  draft,
  onDraftChange,
  disabled,
}: {
  question: FillQuestion;
  draft: string;
  onDraftChange: (next: string) => void;
  disabled?: boolean;
}) {
  console.log("QuestionFill", question)
  return (
    <div className="qs-field">
      <label className="qs-label">Complète la phrase</label>
      <input
        className="qs-input"
        value={typeof draft === "string" ? draft : ""}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder="Ex: téléphone"
        disabled={disabled}
      />
      <div className="qs-hint">Réponse normalisée</div>
    </div>
  );
}