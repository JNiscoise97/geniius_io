// src/features/player/core/activity/activityTypes.ts

export type ActivityMode = "collect" | "learn" | "play";

export type ParticipationPolicy =
  | {
      kind: "individual";
    }
  | {
      kind: "team";
      minMembers?: number;
      maxMembers?: number;
      requireCaptain?: boolean;
      requireTeamPhoto?: boolean;
    };

export type NavigationPolicy =
  | {
      kind: "linear";
      allowBack?: boolean;
      allowSkip?: boolean;
    }
  | {
      kind: "branching";
      allowBack?: boolean;
      allowSkip?: boolean;
    }
  | {
      kind: "zone_based";
      allowBack?: boolean;
      allowSkip?: boolean;
      zoneOrder?: "free" | "recommended" | "fixed";
    };

export type ScoringPolicy =
  | {
      kind: "disabled";
    }
  | {
      kind: "enabled";
      showLiveScore?: boolean;
      showFinalScore?: boolean;
      showLeaderboard?: boolean;
    };

export type FeedbackPolicy =
  | {
      kind: "none";
    }
  | {
      kind: "immediate";
      showExplanation?: boolean;
      showExpectedAnswer?: boolean;
    }
  | {
      kind: "deferred";
      showExplanationAtEnd?: boolean;
    };

export type PersistencePolicy = {
  autosave?: boolean;
  resumeAllowed?: boolean;
  saveDrafts?: boolean;
};

export type QuestionType =
  | "qcu"
  | "qcm"
  | "truefalse"
  | "numeric"
  | "short"
  | "long"
  | "fill"
  | "photo"
  | "info"
  | "date"
  | "select";

export type QuestionMedia = {
  kind: "image" | "audio" | "video" | "document";
  src: string;
  alt?: string;
  caption?: string;
};

export type QuestionCondition =
  | { op: "equals"; value: unknown }
  | { op: "not_equals"; value: unknown }
  | { op: "includes"; value: unknown }
  | { op: "is_true" }
  | { op: "is_false" }
  | { op: "is_empty" }
  | { op: "is_not_empty" };

export type QuestionBranch = {
  when: QuestionCondition;
  goto: string;
};

export type QuestionNavigation = {
  next?: string;
  branches?: QuestionBranch[];
};

export type QuestionEvaluation =
  | {
      kind: "none";
    }
  | {
      kind: "auto_correct";
      answer: unknown;
      retry?: boolean;
      maxAttempts?: number;
      penaltyEnabled?: boolean;
      penalty?: number;
      penaltyByAttempt?: number[]; // ex: [2, 5, 10]
      points?: number;
      tolerance?: number;
      compareMode?: "exact" | "normalized" | "set";
    }
  | {
      kind: "submit_only";
      points?: number;
    }
  | {
      kind: "manual_review";
      points?: number;
      reviewLabel?: string;
    };

export type QuestionFeedback = {
  correctTitle?: string;
  incorrectTitle?: string;
  submittedTitle?: string;
  explanationMarkdown?: string;
  correctExplanationMarkdown?: string;
  incorrectExplanationMarkdown?: string;
  expectedAnswerLabel?: string;
};

export type ActivityQuestionBase = {
  id: string;
  type: QuestionType;
  prompt: string;
  helpMarkdown?: string;
  media?: QuestionMedia[];
  tags?: string[];
  required?: boolean;
  visibilityCondition?: QuestionCondition;
  evaluation: QuestionEvaluation;
  feedback?: QuestionFeedback;
  navigation?: QuestionNavigation;
};

export type QuestionOption = {
  value: string;
  label: string;
};

export type QuestionQcu = ActivityQuestionBase & {
  type: "qcu";
  options: QuestionOption[];
};

export type QuestionQcm = ActivityQuestionBase & {
  type: "qcm";
  options: QuestionOption[];
};

export type QuestionTrueFalse = ActivityQuestionBase & {
  type: "truefalse";
};

export type QuestionNumeric = ActivityQuestionBase & {
  type: "numeric";
  inputMode?: "integer" | "decimal";
  min?: number;
  max?: number;
};

export type QuestionShort = ActivityQuestionBase & {
  type: "short";
  placeholder?: string;
};

export type QuestionLong = ActivityQuestionBase & {
  type: "long";
  placeholder?: string;
};

export type QuestionFill = ActivityQuestionBase & {
  type: "fill";
  placeholder?: string;
};

export type QuestionPhoto = ActivityQuestionBase & {
  type: "photo";
  consentText?: string;
  upload?: {
    bucket?: string;
    folder?: string;
  };
  tier?: {
    label?: string;
    options: Array<{
      value: number;
      label: string;
      points: number;
    }>;
  };
  note?: {
    enabled?: boolean;
    placeholder?: string;
  };
};

export type QuestionInfo = ActivityQuestionBase & {
  type: "info";
  bodyMarkdown: string;
};

export type QuestionDate = ActivityQuestionBase & {
  type: "date";
  precision?: "year" | "month" | "day";
};

export type QuestionSelect = ActivityQuestionBase & {
  type: "select";
  options: QuestionOption[];
  multiple?: boolean;
};

export type ActivityQuestionDefinition =
  | QuestionQcu
  | QuestionQcm
  | QuestionTrueFalse
  | QuestionNumeric
  | QuestionShort
  | QuestionLong
  | QuestionFill
  | QuestionPhoto
  | QuestionInfo
  | QuestionDate
  | QuestionSelect;

export type ActivitySectionManifestItem = {
  id: string;
  title: string;
  file: string;
};

export type ActivitySectionDefinition = {
  id: string;
  title: string;
  kind?: "standard" | "zone" | "theme" | "chapter";
  introMarkdown?: string;
  outroMarkdown?: string;
  questions: ActivityQuestionDefinition[];
};

export type ActivityDefinition = {
  id: string;
  slug: string;
  title: string;
  mode: ActivityMode;
  description?: string;
  introMarkdown?: string;
  outroMarkdown?: string;
  visibility?: "private" | "public" | "invite_only";
  availability?: ActivityAvailability;
  participation: ParticipationPolicy;
  navigation: NavigationPolicy;
  scoring: ScoringPolicy;
  feedback: FeedbackPolicy;
  persistence: PersistencePolicy;
  sections: ActivitySectionDefinition[];
};

export type ActivityManifestFrontmatter = {
  id: string;
  slug: string;
  title: string;
  mode: ActivityMode;
  description?: string;
  visibility?: "private" | "public" | "invite_only";
  availability?: ActivityAvailability;
  participation?: ParticipationPolicy;
  navigation?: NavigationPolicy;
  scoring?: ScoringPolicy;
  feedback?: FeedbackPolicy;
  persistence?: PersistencePolicy;
  sections: ActivitySectionManifestItem[];
};

export type ActivitySectionFrontmatter = {
  id: string;
  title: string;
  kind?: "standard" | "zone" | "theme" | "chapter";
  questions: ActivityQuestionDefinition[];
};

export type ActivityAvailability =
  | {
      kind: "available";
    }
  | {
      kind: "scheduled";
      opensAt: string; // ISO
      label?: string;
    }
  | {
      kind: "hidden";
    };

