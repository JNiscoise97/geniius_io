import { useState } from "react";
import type { ShortQuestion } from "../../engine/types";

export function QuestionShort({
  question,
  onSubmit,
  disabled,
}: {
  question: ShortQuestion;
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
        placeholder="Ta réponse"
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
