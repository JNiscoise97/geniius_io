import { useState } from "react";
import type { TrueFalseQuestion } from "../../engine/types";

export function QuestionTrueFalse({
  question,
  onSubmit,
  disabled,
}: {
  question: TrueFalseQuestion;
  onSubmit: (answer: boolean) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState<boolean | null>(null);

  return (
    <div className="stack" style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          className={`btn ${value === true ? "btn--primary" : ""}`}
          type="button"
          disabled={disabled}
          onClick={() => setValue(true)}
          style={{ flex: 1 }}
        >
          Vrai
        </button>

        <button
          className={`btn ${value === false ? "btn--primary" : ""}`}
          type="button"
          disabled={disabled}
          onClick={() => setValue(false)}
          style={{ flex: 1 }}
        >
          Faux
        </button>
      </div>

      <button
        className="btn btn--primary"
        type="button"
        disabled={value === null || disabled}
        onClick={() => onSubmit(Boolean(value))}
      >
        Valider
      </button>
    </div>
  );
}
