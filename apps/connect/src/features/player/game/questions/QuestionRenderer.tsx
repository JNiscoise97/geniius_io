// src/features/player/game/questions/QuestionRenderer.tsx
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AnyQuestion } from "../engine/types";
import { registry } from "./registry";
import type { DraftByType, PhotoDraft, QuestionHandle } from "./types";
import type { QuestionPhotoHandle } from "./photo/QuestionPhoto";

function defaultDraft(q: AnyQuestion): DraftByType[AnyQuestion["type"]] {
  switch (q.type) {
    case "qcu":
      return "";
    case "qcm":
      return [];
    case "truefalse":
      return null;
    case "numeric":
      return "";
    case "short":
      return "";
    case "fill":
      return "";
    case "photo":
      return {
        consent: false,
        tierValue: q.tier?.options?.[0]?.value ?? null,
        note: "",
        file: null,
      } satisfies PhotoDraft;
    default:
      return "" as any;
  }
}

function canSubmitFor(q: AnyQuestion, draft: any): boolean {
  if (q.type === "qcu") return typeof draft === "string" && draft.length > 0;
  if (q.type === "qcm") return Array.isArray(draft) && draft.length > 0;
  if (q.type === "truefalse") return draft === true || draft === false;

  if (q.type === "numeric") {
    const s = String(draft ?? "").trim();
    if (!s) return false;
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n);
  }

  if (q.type === "short" || q.type === "fill") {
    return typeof draft === "string" && draft.trim().length > 0;
  }

  if (q.type === "photo") {
    const d = draft as PhotoDraft;
    const hasFile = !!d?.file;
    const hasConsent = d?.consent === true;
    const hasTier = q.tier ? typeof d?.tierValue === "number" : true;
    return hasFile && hasConsent && hasTier;
  }

  return false;
}

function answerFromDraft(q: AnyQuestion, draft: any): any {
  if (q.type === "numeric") return Number(String(draft).replace(",", "."));
  if (q.type === "truefalse") return Boolean(draft);
  return draft;
}

export const QuestionRenderer = forwardRef<
  QuestionHandle,
  {
    question: AnyQuestion;
    disabled?: boolean;
    onSubmit: (answer: any) => void;
    onCanSubmitChange?: (v: boolean) => void;
  }
>(({ question, disabled, onSubmit, onCanSubmitChange }, ref) => {
  const Comp: any = registry[question.type];

  const [draft, setDraft] = useState<any>(() => defaultDraft(question));

  useEffect(() => {
    setDraft(defaultDraft(question));
  }, [question.id]);

  const innerRef = useRef<QuestionPhotoHandle | null>(null);

  const canSubmit = useMemo(() => canSubmitFor(question, draft), [question, draft]);

  useEffect(() => {
    onCanSubmitChange?.(canSubmit);
  }, [canSubmit, onCanSubmitChange]);

  function submit() {
    if (disabled) return;
    if (!canSubmitFor(question, draft)) return;

    if (question.type === "photo") {
      innerRef.current?.submit?.();
      return;
    }

    onSubmit(answerFromDraft(question, draft));
  }

  useImperativeHandle(
    ref,
    () => ({
      canSubmit: () => canSubmitFor(question, draft),
      submit,
      reset: () => setDraft(defaultDraft(question)),
    }),
    [question, draft, disabled]
  );

  return (
    <Comp
      ref={question.type === "photo" ? innerRef : undefined}
      question={question}
      disabled={disabled}
      draft={draft}
      onDraftChange={setDraft}
      onSubmit={onSubmit}
    />
  );
});