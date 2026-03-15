import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarCheck,
  MessageCircleHeart,
  Settings,
  Sparkles,
  UserCircle2,
} from "lucide-react";

export type CompletionItemType = "form" | "info";

export type CompletionCondition =
  | string
  | {
      and: CompletionCondition[];
    }
  | {
      or: CompletionCondition[];
    };

export type CompletionRule = {
  key: string;
  form?: string;
  onboardingKey?: "identity" | "profile" | "preferences" | "origins";
  eyebrow: string;
  actionRapide: string;
  text: string;
  cta: string;
  icon: LucideIcon;
  table: string | null;
  participantField?: string;
  fields: CompletionCondition;
  to: string;
  type: CompletionItemType;
};

export type CompletionRow = Record<string, unknown> | null | undefined;

export const completionRules: CompletionRule[] = [
  {
    key: "identity",
    form: "IdentityForm",
    onboardingKey: "identity",
    eyebrow: "Profil",
    actionRapide: "Ajoute tes informations générales et tes coordonnées.",
    text: "Quelques informations suffisent pour que la famille puisse mieux te reconnaître et te recontacter.",
    cta: "Compléter mon profil",
    icon: UserCircle2,
    table: "participants",
    participantField: "id",
    fields: {
      and: [
        "first_name",
        "last_name",
        "birth_year",
        {
          or: ["phone", "email", "messenger"],
        },
        "preferred_contact_channels",
      ],
    },
    to: "/welcome/identity",
    type: "form",
  },
  {
    key: "attendance",
    eyebrow: "Présence",
    actionRapide: "As-tu déjà confirmé ta présence ?",
    text: "Ta réponse nous aide à préparer la journée dans les meilleures conditions.",
    cta: "Confirmer ma présence",
    icon: CalendarCheck,
    table: "participant_attendance",
    participantField: "participant_id",
    fields: "attendance_status",
    to: "/attendance",
    type: "form",
  },
  {
    key: "origins",
    onboardingKey: "origins",
    eyebrow: "Lien avec la cousinade",
    actionRapide: "Comment as-tu entendu parler du pique-nique ?",
    text: "Cela nous aide à mieux comprendre comment l’initiative circule dans la famille.",
    cta: "Renseigner ces informations",
    icon: Sparkles,
    table: "participant_origins",
    participantField: "participant_id",
    fields: {
      or: ["heard_about_initiative", "cousinade_expectation"],
    },
    to: "/welcome/origins",
    type: "form",
  },
  {
    key: "origins-heard_about_initiative",
    eyebrow: "Lien avec la cousinade",
    actionRapide: "Comment as-tu entendu parler du pique-nique ?",
    text: "Cela nous aide à mieux comprendre comment l’initiative circule dans la famille.",
    cta: "Renseigner ces informations",
    icon: Sparkles,
    table: "participant_origins",
    participantField: "participant_id",
    fields: "heard_about_initiative",
    to: "/welcome/origins",
    type: "form",
  },
  {
    key: "origins-cousinade_expectation",
    eyebrow: "Lien avec la cousinade",
    actionRapide: "Qu’aimerais-tu retrouver ou découvrir pendant la cousinade ?",
    text: "",
    cta: "Renseigner ces informations",
    icon: Sparkles,
    table: "participant_origins",
    participantField: "participant_id",
    fields: "cousinade_expectation",
    to: "/welcome/origins",
    type: "form",
  },
  {
    key: "profile",
    onboardingKey: "profile",
    eyebrow: "Quelques mots sur toi",
    actionRapide: "Veux-tu partager quelques infos sur toi ?",
    text: "Tes réponses donnent envie d’échanger et créent plus facilement du lien entre cousins.",
    cta: "Partager quelques infos",
    icon: MessageCircleHeart,
    table: "participant_profile",
    participantField: "participant_id",
    fields: "completed",
    to: "/welcome/profile",
    type: "form",
  },
  {
    key: "preferences",
    onboardingKey: "preferences",
    eyebrow: "Préférences",
    actionRapide: "Choisis ce que la famille peut afficher ou partager à ton sujet.",
    text: "Tu peux définir ici ce que tu autorises pour les photos, l’arbre et certaines communications.",
    cta: "Gérer mes préférences",
    icon: Settings,
    table: "participant_preferences",
    participantField: "participant_id",
    fields: "completed",
    to: "/welcome/preferences",
    type: "form",
  },
  {
    key: "covindou-sheet",
    eyebrow: "Histoire familiale",
    actionRapide: "Lire les informations collectées sur gromèr Covindou",
    text: "Découvre une figure centrale de la famille et l’histoire transmise autour d’elle.",
    cta: "Ouvrir la fiche",
    icon: BookOpen,
    table: null,
    fields: { and: [] },
    to: "/fiche?id=@7398@",
    type: "info",
  },
];

function isValueFilled(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "boolean") {
    return value === true;
  }

  return true;
}

function evaluateCompletionCondition(
  condition: CompletionCondition,
  row: Record<string, unknown>,
): boolean {
  if (typeof condition === "string") {
    return isValueFilled(row[condition]);
  }

  if ("and" in condition) {
    return condition.and.every((item) =>
      evaluateCompletionCondition(item, row),
    );
  }

  if ("or" in condition) {
    return condition.or.some((item) =>
      evaluateCompletionCondition(item, row),
    );
  }

  return false;
}

export function isCompletionRuleComplete(
  rule: CompletionRule,
  row: CompletionRow,
): boolean {
  if (rule.type === "info") {
    return true;
  }

  if (!row) {
    return false;
  }

  return evaluateCompletionCondition(rule.fields, row);
}

export function buildCompletionItemStatus(
  rule: CompletionRule,
  row: CompletionRow,
) {
  return {
    ...rule,
    complete: isCompletionRuleComplete(rule, row),
  };
}

export function getFirstIncompleteCompletionRules(
  rules: CompletionRule[],
  rowsByTable: Record<string, CompletionRow>,
  limit = 4,
) {
  return rules
    .filter((rule) => {
      if (rule.type === "info") {
        return true;
      }

      const row = rule.table ? rowsByTable[rule.table] : null;
      return !isCompletionRuleComplete(rule, row);
    })
    .slice(0, limit);
}

export function getOnboardingCompletionRules(
  rules: CompletionRule[] = completionRules,
) {
  return rules.filter(
    (
      rule,
    ): rule is CompletionRule & {
      onboardingKey: "identity" | "profile" | "preferences" | "origins";
    } => rule.onboardingKey !== undefined,
  );
}