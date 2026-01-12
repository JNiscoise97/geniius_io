import { useMemo, useState } from "react";
import type { QCMQuestion } from "../../engine/types";

export function QuestionQCM({
  question,
  onSubmit,
  disabled,
}: {
  question: QCMQuestion;
  onSubmit: (answer: string[]) => void;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const canSubmit = selected.length > 0;

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggle(opt: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(opt)) s.delete(opt);
      else s.add(opt);
      return Array.from(s);
    });
  }

  return (
    <div className="stack" style={{ marginTop: 12 }}>
      <p className="muted" style={{ margin: 0 }}>
        Plusieurs réponses possibles.
      </p>

      {question.options.map((opt) => (
        <label
          key={opt}
          className="btn"
          style={{ textAlign: "left", display: "flex", gap: 10, alignItems: "center" }}
        >
          <input
            type="checkbox"
            checked={selectedSet.has(opt)}
            disabled={disabled}
            onChange={() => toggle(opt)}
          />
          <span>{opt}</span>
        </label>
      ))}

      <button className="btn btn--primary" disabled={!canSubmit || disabled} onClick={() => onSubmit(selected)}>
        Valider
      </button>
    </div>
  );
}
