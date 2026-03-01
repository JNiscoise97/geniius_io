// src/features/player/game/questions/truefalse/QuestionTrueFalse.tsx
import type { TrueFalseQuestion } from "../../engine/types";
import "../../question-screen.css";

export function QuestionTrueFalse({
  question,
  draft,
  onDraftChange,
  disabled,
}: {
  question: TrueFalseQuestion;
  draft: boolean | null;
  onDraftChange: (next: boolean | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="qs-grid-2">
      <button
        type="button"
        className={`qs-bigbtn ${draft === true ? "is-active-green" : ""}`}
        onClick={() => onDraftChange(true)}
        disabled={disabled}
      >
        Vrai
      </button>

      <button
        type="button"
        className={`qs-bigbtn ${draft === false ? "is-active-red" : ""}`}
        onClick={() => onDraftChange(false)}
        disabled={disabled}
      >
        Faux
      </button>
    </div>
  );
}