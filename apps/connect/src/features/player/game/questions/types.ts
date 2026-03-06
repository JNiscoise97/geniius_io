// src/features/player/game/questions/types.ts
import type { AnyQuestion } from "../engine/types";

export type DraftByType = {
  qcu: string;
  qcm: string[];
  truefalse: boolean | null;
  numeric: string;     // on garde raw string
  short: string;
  fill: string;
  photo: PhotoDraft;
};

export type PhotoDraft = {
  consent: boolean;
  tierValue: number | null;
  note: string;
  file: File | null;
};

export type QuestionHandle = {
  canSubmit: () => boolean;
  submit: () => void;
  reset?: () => void;
};

export type DraftFor<Q extends AnyQuestion> = DraftByType[Q["type"]];