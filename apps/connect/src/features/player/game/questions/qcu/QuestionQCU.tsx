// src/features/player/game/questions/qcu/QuestionQCU.tsx
import { useMemo } from "react";
import type { QCUQuestion } from "../../engine/types";
import "../../question-screen.css";
import { slugFromUrl, getSession, shuffleStable } from "../shuffle";


export function QuestionQCU({
  question,
  draft,
  onDraftChange,
  disabled,
}: {
  question: QCUQuestion;
  draft: string;
  onDraftChange: (next: string) => void;
  disabled?: boolean;
}) {
  const slug = useMemo(() => slugFromUrl(), []);
  const s = useMemo(() => getSession(slug), [slug]);

  // ✅ même équipe => même ordre ; autre équipe => ordre différent
  const seed = useMemo(
    () => `qcu:${question.id}:${s?.teamId ?? "no-team"}`,
    [question.id, s?.teamId]
  );

  const options = useMemo(
    () => shuffleStable(question.options ?? [], seed),
    [question.options, seed]
  );

  return (
    <div className="qs-options">
      {options.map((opt) => {
        const active = draft === opt;
        return (
          <button
            key={opt}
            className={`qs-option ${active ? "is-active" : ""}`}
            onClick={() => onDraftChange(opt)}
            disabled={disabled}
            type="button"
          >
            <div className="qs-option__left">
              <div className="qs-option__value">{opt}</div>
            </div>
            <div className={`qs-dot ${active ? "is-on" : ""}`} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}