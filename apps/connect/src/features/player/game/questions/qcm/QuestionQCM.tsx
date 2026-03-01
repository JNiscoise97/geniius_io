// src/features/player/game/questions/qcm/QuestionQCM.tsx
import { useMemo } from "react";
import type { QCMQuestion } from "../../engine/types";
import "../../question-screen.css";
import { shuffleStable, getSession, slugFromUrl } from "../shuffle"; // adapte le chemin si besoin

export function QuestionQCM({
  question,
  draft,
  onDraftChange,
  disabled,
}: {
  question: QCMQuestion;
  draft: string[];
  onDraftChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const selected = Array.isArray(draft) ? draft : [];
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const slug = useMemo(() => slugFromUrl(), []);
  const s = useMemo(() => getSession(slug), [slug]);

  // ✅ même équipe => même ordre ; autre équipe => ordre différent
  const seed = useMemo(
    () => `qcm:${question.id}:${s?.teamId ?? "no-team"}`,
    [question.id, s?.teamId]
  );

  const options = useMemo(
    () => shuffleStable(question.options ?? [], seed),
    [question.options, seed]
  );

  function toggle(opt: string) {
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onDraftChange(Array.from(next));
  }

  return (
    <>
      <div className="qs-options">
        {options.map((opt) => {
          const active = selectedSet.has(opt);
          return (
            <button
              key={opt}
              type="button"
              className={`qs-option ${active ? "is-active" : ""}`}
              onClick={() => toggle(opt)}
              disabled={disabled}
            >
              <div className="qs-option__left">
                <div className="qs-option__value">{opt}</div>
              </div>
              <div className={`qs-box ${active ? "is-on" : ""}`} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="qs-hint">Sélection : {selected.length}</div>
    </>
  );
}