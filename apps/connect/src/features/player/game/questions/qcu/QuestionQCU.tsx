import { useState } from "react";
import type { QCUQuestion } from "../../engine/types";

export function QuestionQCU({
  question,
  onSubmit,
  disabled,
}: {
  question: QCUQuestion;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState<string>("");

  return (
    <div className="stack" style={{ marginTop: 12 }}>
      {question.options.map((opt) => (
        <label key={opt} className="btn" style={{ textAlign: "left", display: "flex", gap: 10 }}>
          <input
            type="radio"
            name={question.id}
            value={opt}
            checked={value === opt}
            disabled={disabled}
            onChange={() => setValue(opt)}
          />
          <span>{opt}</span>
        </label>
      ))}

      <button className="btn btn--primary" disabled={!value || disabled} onClick={() => onSubmit(value)}>
        Valider
      </button>
    </div>
  );
}
