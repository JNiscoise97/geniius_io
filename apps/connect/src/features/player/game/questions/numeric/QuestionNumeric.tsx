import { useState } from "react";
import type { NumericQuestion } from "../../engine/types";

export function QuestionNumeric({
  question,
  onSubmit,
  disabled,
}: {
  question: NumericQuestion;
  onSubmit: (answer: number) => void;
  disabled?: boolean;
}) {
  const [raw, setRaw] = useState<string>("");

  const num = Number(raw);
  const valid = raw.trim().length > 0 && Number.isFinite(num);

  return (
    <div className="stack" style={{ marginTop: 12 }}>
      <input
        className="btn"
        style={{ textAlign: "left" }}
        inputMode="numeric"
        placeholder="Ta réponse (nombre)"
        value={raw}
        disabled={disabled}
        onChange={(e) => setRaw(e.target.value)}
      />

      <button className="btn btn--primary" disabled={!valid || disabled} onClick={() => onSubmit(num)}>
        Valider
      </button>
    </div>
  );
}
