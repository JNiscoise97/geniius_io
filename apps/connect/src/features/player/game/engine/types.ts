//types.ts

export type QuestionType = "qcu" | "qcm" | "truefalse" | "numeric" | "short" | "fill" | "photo";

export type BaseQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  points?: number;     // default 10
  penalty?: number;    // default 0 (appliqué si mauvaise réponse ET penaltyEnabled)
  retry?: boolean;     // default false
  penaltyEnabled?: boolean; // default false
};

export type QCUQuestion = BaseQuestion & {
  type: "qcu";
  options: string[];
  answer: string; // exact match
};

export type QCMQuestion = BaseQuestion & {
  type: "qcm";
  options: string[];
  answer: string[]; // set equality
};

export type TrueFalseQuestion = BaseQuestion & {
  type: "truefalse";
  answer: boolean;
};

export type NumericQuestion = BaseQuestion & {
  type: "numeric";
  answer: number;
  tolerance?: number; // default 0
};

export type ShortQuestion = BaseQuestion & {
  type: "short";
  answer: string; // exact or normalized
  mode?: "exact" | "normalized"; // default normalized
};

export type FillQuestion = BaseQuestion & {
  type: "fill";
  answer: string; // expected string
  mode?: "exact" | "normalized";
};

export type PhotoTierOption = {
  value: number;
  label: string;
  points: number;
};

export type PhotoQuestion = BaseQuestion & {
  type: "photo";
  consentText?: string;
  upload?: {
    bucket?: string;        // default "connect-public"
    folder?: string;        // default "answers"
  };
  tier?: {
    label?: string;
    options: PhotoTierOption[];
  };
  note?: {
    enabled?: boolean;
    placeholder?: string;
  };
};


export type AnyQuestion =
  | QCUQuestion
  | QCMQuestion
  | TrueFalseQuestion
  | NumericQuestion
  | ShortQuestion
  | FillQuestion
  | PhotoQuestion;

export type ZoneContent = {
  id: string;
  title: string;
  theme?: string;
  introText?: string; // from body markdown (optional)
  questions: AnyQuestion[];
};
