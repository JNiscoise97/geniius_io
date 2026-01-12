import React from "react";
import type { AnyQuestion } from "../engine/types";
import { registry } from "./registry";

export function QuestionRenderer({
  question,
  onSubmit,
  disabled,
}: {
  question: AnyQuestion;
  onSubmit: (answer: any) => void;
  disabled?: boolean;
}) {
  const Comp = registry[question.type];
  if (!Comp) return <div className="muted">Type non supporté: {question.type}</div>;
  return <Comp question={question} onSubmit={onSubmit} disabled={disabled} />;
}
