import { useState } from "react";
import type { FillQuestion } from "../../engine/types";

export function QuestionFill({
  question,
  onSubmit,
  disabled,
}: {
  question: FillQuestion;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  const canSubmit = value.trim().length > 0;

  return (
    <div className="stack" style={{ marginTop: 12 }}>
      <input
        className="btn"
        style={{ textAlign: "left" }}
        placeholder="Complète la phrase"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
      />

      <button className="btn btn--primary" disabled={!canSubmit || disabled} onClick={() => onSubmit(value)}>
        Valider
      </button>
    </div>
  );
}
