import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarCheck,
  GitBranch,
  HeartHandshake,
  Image,
  MessageCircleHeart,
  Network,
  Settings,
  UserCircle2,
  Users,
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
  onboardingKey?: "identity" | "profile" | "preferences" | "origins";
  familyKnowledgeKey?:
    | "close_family"
    | "grandparents"
    | "godparents"
    | "current_links"
    | "memory"
    | "photos";
  group?:
    | "identity"
    | "attendance"
    | "preferences"
    | "origins"
    | "close_family"
    | "grandparents"
    | "godparents"
    | "current_links"
    | "memory"
    | "photos";
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
  dependsOnTables?: string[];
  selectFieldsByTable?: Record<string, string[]>;
  isComplete?: (rowsByTable: Record<string, CompletionRow>) => boolean;
};

export type CompletionRow = Record<string, unknown> | null | undefined;

export function getFamilyKnowledgeCompletionRules(
  rules: CompletionRule[] = completionRules,
) {
  return rules.filter(
    (
      rule,
    ): rule is CompletionRule & {
      familyKnowledgeKey:
        | "close_family"
        | "grandparents"
        | "godparents"
        | "current_links"
        | "memory"
        | "photos";
    } => rule.familyKnowledgeKey !== undefined,
  );
}

export const completionRules: CompletionRule[] = [
  {
    key: "identity",
    onboardingKey: "identity",
    group: "identity",
    eyebrow: "Profil",
    actionRapide: "Ajoute quelques informations pour que l'organisateur puisse bien t'identifier.",
    text: "",
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
    group: "attendance",
    actionRapide: "Souhaites-tu confirmer ta présence au pique-nique ?",
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
    key: "preferences",
    onboardingKey: "preferences",
    group: "preferences",
    eyebrow: "Consentements",
    actionRapide: "Choisis ce que la famille peut voir ou utiliser à ton sujet.",
    text: "Tu peux définir ici ce que tu acceptes pour l’arbre, les photos, les contacts et certains usages dans l’application.",
    cta: "Gérer mes consentements",
    icon: Settings,
    table: "participant_consents",
    participantField: "participant_id",
    fields: {
      and: [
        "allow_name_in_family_tree",
        "allow_photo_in_family_tree",
        "allow_info_in_family_tree",
        "allow_family_photo_sharing",
        "allow_photo_display_in_app",
        "allow_event_photo_memory",
        "allow_contact_details_with_family",
        "allow_future_family_contact",
        "allow_genealogy_enrichment",
        "allow_genealogy_contribution_storage",
        "allow_name_in_event_activities",
        "allow_participation_in_games",
      ],
    },
    to: "/welcome/preferences",
    type: "form",
  },
  {
    key: "preferences-app",
    group: "preferences",
    eyebrow: "Consentements",
    actionRapide: "Choisis si ton nom peut apparaître dans l’application, notamment dans les jeux.",
    text: "",
    cta: "Gérer mes consentements",
    icon: Settings,
    table: "participant_consents",
    participantField: "participant_id",
    fields: {
      or: [
        "allow_name_in_event_activities",
        "allow_participation_in_games",
      ],
    },
    to: "/welcome/preferences",
    type: "form",
  },
  {
    key: "preferences-genealogy",
    group: "preferences",
    eyebrow: "Consentements",
    actionRapide: "Choisis si les informations que tu partages ici peuvent enrichir l’arbre généalogique familial.",
    text: "",
    cta: "Gérer mes consentements",
    icon: Settings,
    table: "participant_consents",
    participantField: "participant_id",
    fields: {
      or: [
        "allow_genealogy_enrichment",
        "allow_genealogy_contribution_storage",
      ],
    },
    to: "/welcome/preferences",
    type: "form",
  },
  {
    key: "preferences-contact",
    group: "preferences",
    eyebrow: "Consentements",
    actionRapide: "Choisis tes préférences pour rester en contact avec la famille.",
    text: "",
    cta: "Gérer mes consentements",
    icon: Settings,
    table: "participant_consents",
    participantField: "participant_id",
    fields: {
      or: [
        "allow_contact_details_with_family",
        "allow_future_family_contact",
      ],
    },
    to: "/welcome/preferences",
    type: "form",
  },
  {
    key: "preferences-image",
    group: "preferences",
    eyebrow: "Consentements",
    actionRapide: "Choisis tes préférences concernant les photos de toi prises pendant l’événement.",
    text: "",
    cta: "Gérer mes consentements",
    icon: Settings,
    table: "participant_consents",
    participantField: "participant_id",
    fields: {
      or: [
        "allow_family_photo_sharing",
        "allow_photo_display_in_app",
        "allow_event_photo_memory",
      ],
    },
    to: "/welcome/preferences",
    type: "form",
  },
  {
    key: "preferences-family-tree",
    group: "preferences",
    eyebrow: "Consentements",
    actionRapide: "Choisis ce que la famille peut voir à ton sujet dans l’arbre généalogique.",
    text: "",
    cta: "Gérer mes consentements",
    icon: Settings,
    table: "participant_consents",
    participantField: "participant_id",
    fields: {
      or: [
        "allow_name_in_family_tree",
        "allow_photo_in_family_tree",
        "allow_info_in_family_tree",
      ],
    },
    to: "/welcome/preferences",
    type: "form",
  },
  {
    key: "origins-heard_about_initiative",
    eyebrow: "Lien avec la cousinade",
    group: "origins",
    actionRapide: "Comment as-tu entendu parler du pique-nique ?",
    text: "",
    cta: "Renseigner ces informations",
    icon: GitBranch,
    table: "participant_origins",
    participantField: "participant_id",
    fields: "heard_about_initiative",
    to: "/welcome/origins",
    type: "form",
  },
  {
    key: "origins-cousinade_expectation",
    eyebrow: "Lien avec la cousinade",
    group: "origins",
    actionRapide: "Qu’aimerais-tu retrouver, partager ou découvrir pendant la cousinade ?",
    text: "",
    cta: "Renseigner ces informations",
    icon: GitBranch,
    table: "participant_origins",
    participantField: "participant_id",
    fields: "cousinade_expectation",
    to: "/welcome/origins",
    type: "form",
  },
  {
    key: "origins",
    onboardingKey: "origins",
    group: "origins",
    eyebrow: "Lien avec la cousinade",
    actionRapide: "Souhaites-tu partager ton lien avec cette cousinade ?",
    text: "Cela nous aide à mieux comprendre comment l’initiative circule dans la famille et ce que chacun espère y vivre.",
    cta: "Renseigner ces informations",
    icon: GitBranch,
    table: "participant_origins",
    participantField: "participant_id",
    fields: {
      or: ["heard_about_initiative", "cousinade_expectation"],
    },
    to: "/welcome/origins",
    type: "form",
  },
  {
    key: "profile",
    onboardingKey: "profile",
    eyebrow: "Quelques mots sur toi",
    actionRapide: "Souhaites-tu partager quelques éléments sur toi ?",
    text: "Quelques informations personnelles peuvent faciliter les échanges et créer du lien entre cousins, si tu souhaites les partager.",
    cta: "Partager quelques infos",
    icon: MessageCircleHeart,
    table: null,
    fields: { and: [] },
    dependsOnTables: ["participant_profile", "participant_consents"],
    selectFieldsByTable: {
      participant_profile: ["city", "occupation", "interests", "free_share"],
      participant_consents: ["allow_info_in_family_tree"],
    },
    to: "/welcome/profile",
    type: "form",
    isComplete: (rowsByTable) => {
      const consents = rowsByTable["participant_consents"] as Record<
        string,
        unknown
      > | null;
      const profile = rowsByTable["participant_profile"] as Record<
        string,
        unknown
      > | null;

      const treePreference = consents?.allow_info_in_family_tree;

      if (treePreference !== true && treePreference !== false) {
        return false;
      }

      if (treePreference === false) {
        return true;
      }

      return hasAnyFilledField(profile, [
        "city",
        "occupation",
        "interests",
        "free_share",
      ]);
    },
  },
  {
    key: "covindou-sheet",
    eyebrow: "Histoire familiale",
    actionRapide: "Découvrir la fiche consacrée à gromèr Covindou",
    text: "Découvre la figure centrale de notre famille et l’histoire transmise autour d’elle.",
    cta: "Ouvrir la fiche",
    icon: BookOpen,
    table: null,
    fields: { and: [] },
    to: "/fiche?id=@7398@",
    type: "info",
  },
  {
    key: "close_family-parent1-known",
    familyKnowledgeKey: "close_family",
    group: "close_family",
    eyebrow: "Famille proche",
    actionRapide: "Souhaites-tu partager ce que tu sais sur ton père ?",
    text: "Même un prénom, un surnom ou une petite information peut déjà être utile.",
    cta: "Parler de mon père",
    icon: Users,
    table: "participant_family_knowledge_close_family",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_close_family: ["data"],
    },
    to: "/family-knowledge/close-family",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getCloseFamilyData(rowsByTable);
      const parent1 = getCloseFamilyPerson(data, "parent1");
      return parent1?.known === true || parent1?.known === false;
    },
  },
  {
    key: "close_family-parent2-known",
    familyKnowledgeKey: "close_family",
    group: "close_family",
    eyebrow: "Famille proche",
    actionRapide: "Souhaites-tu partager ce que tu sais sur ta mère ?",
    text: "Même un prénom, un surnom ou une petite information peut déjà être utile.",
    cta: "Parler de ma mère",
    icon: Users,
    table: "participant_family_knowledge_close_family",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_close_family: ["data"],
    },
    to: "/family-knowledge/close-family",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getCloseFamilyData(rowsByTable);
      const parent2 = getCloseFamilyPerson(data, "parent2");
      return parent2?.known === true || parent2?.known === false;
    },
  },
  {
    key: "close_family-parent1-identity",
    familyKnowledgeKey: "close_family",
    group: "close_family",
    eyebrow: "Famille proche",
    actionRapide: "As-tu au moins un élément à partager sur ton père ?",
    text: "Un prénom, un nom, un surnom ou même un souvenir peut déjà faire avancer la mémoire familiale.",
    cta: "Ajouter une info sur mon père",
    icon: Users,
    table: "participant_family_knowledge_close_family",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_close_family: ["data"],
    },
    to: "/family-knowledge/close-family",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getCloseFamilyData(rowsByTable);
      const parent1 = getCloseFamilyPerson(data, "parent1");
      if (!parent1) return false;
      if (parent1.known === false) return true;
      if (parent1.known === true) return personHasIdentity(parent1);
      return false;
    },
  },
  {
    key: "close_family-parent2-identity",
    familyKnowledgeKey: "close_family",
    group: "close_family",
    eyebrow: "Famille proche",
    actionRapide: "As-tu au moins un élément à partager sur ta mère ?",
    text: "Un prénom, un nom, un surnom ou même un souvenir peut déjà faire avancer la mémoire familiale.",
    cta: "Ajouter une info sur ma mère",
    icon: Users,
    table: "participant_family_knowledge_close_family",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_close_family: ["data"],
    },
    to: "/family-knowledge/close-family",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getCloseFamilyData(rowsByTable);
      const parent2 = getCloseFamilyPerson(data, "parent2");
      if (!parent2) return false;
      if (parent2.known === false) return true;
      if (parent2.known === true) return personHasIdentity(parent2);
      return false;
    },
  },
  {
    key: "close_family-hasSiblings",
    familyKnowledgeKey: "close_family",
    group: "close_family",
    eyebrow: "Famille proche",
    actionRapide: "Souhaites-tu partager ce que tu sais sur ta fratrie ?",
    text: "",
    cta: "Répondre pour ma fratrie",
    icon: Users,
    table: "participant_family_knowledge_close_family",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_close_family: ["data"],
    },
    to: "/family-knowledge/close-family",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getCloseFamilyData(rowsByTable);
      return data?.hasSiblings === "yes" || data?.hasSiblings === "no";
    },
  },
  {
    key: "close_family-siblings-list",
    familyKnowledgeKey: "close_family",
    group: "close_family",
    eyebrow: "Famille proche",
    actionRapide: "Peux-tu ajouter au moins un frère ou une sœur, si tu en connais ?",
    text: "Une seule personne renseignée peut déjà aider à mieux reconstituer la fratrie.",
    cta: "Ajouter un frère ou une sœur",
    icon: Users,
    table: "participant_family_knowledge_close_family",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_close_family: ["data"],
    },
    to: "/family-knowledge/close-family",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getCloseFamilyData(rowsByTable);
      const siblings = Array.isArray(data?.siblings) ? data.siblings : [];
      if (data?.hasSiblings === "no") return true;
      if (data?.hasSiblings === "yes") return siblings.length > 0;
      return false;
    },
  },
  {
    key: "close_family-hasChildren",
    familyKnowledgeKey: "close_family",
    group: "close_family",
    eyebrow: "Famille proche",
    actionRapide: "Souhaites-tu renseigner tes enfants, si tu en as ?",
    text: "Ta réponse nous aide à mieux comprendre ta branche familiale aujourd’hui.",
    cta: "Répondre pour mes enfants",
    icon: Users,
    table: "participant_family_knowledge_close_family",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_close_family: ["data"],
    },
    to: "/family-knowledge/close-family",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getCloseFamilyData(rowsByTable);
      return data?.hasChildren === "yes" || data?.hasChildren === "no";
    },
  },
  {
    key: "close_family-children-list",
    familyKnowledgeKey: "close_family",
    group: "close_family",
    eyebrow: "Famille proche",
    actionRapide: "Peux-tu ajouter au moins un de tes enfants, si tu le souhaites ?",
    text: "Même une information simple peut déjà aider à mieux relier les générations.",
    cta: "Ajouter un enfant",
    icon: Users,
    table: "participant_family_knowledge_close_family",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_close_family: ["data"],
    },
    to: "/family-knowledge/close-family",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getCloseFamilyData(rowsByTable);
      const children = Array.isArray(data?.children) ? data.children : [];
      if (data?.hasChildren === "no") return true;
      if (data?.hasChildren === "yes") return children.length > 0;
      return false;
    },
  },
  {
    key: "close_family",
    familyKnowledgeKey: "close_family",
    group: "close_family",
    eyebrow: "Famille proche",
    actionRapide: "Souhaites-tu partager ce que tu sais sur ta famille proche ?",
    text: "Parents, fratrie, enfants ou conjoint : chaque information aide la famille à mieux se relier.",
    cta: "Compléter ma famille proche",
    icon: Users,
    table: "participant_family_knowledge_close_family",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_close_family: ["data"],
    },
    to: "/family-knowledge/close-family",
    type: "form",
    isComplete: (rowsByTable) =>
      isCloseFamilyComplete(
        rowsByTable["participant_family_knowledge_close_family"],
      ),
  },
  {
    key: "grandparents-paternal-grandfather-known",
    familyKnowledgeKey: "grandparents",
    group: "grandparents",
    eyebrow: "Grands-parents",
    actionRapide: "As-tu quelques informations sur ton grand-père paternel ?",
    text: "",
    cta: "Parler de mon grand-père paternel",
    icon: Network,
    table: "participant_family_knowledge_grandparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_grandparents: ["data"],
    },
    to: "/family-knowledge/grandparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeGrandparentsData(rowsByTable);
      const person = getGrandparentPerson(data, "paternalGrandfather");
      return person?.known === true || person?.known === false;
    },
  },
  {
    key: "grandparents-paternal-grandfather-identity",
    familyKnowledgeKey: "grandparents",
    group: "grandparents",
    eyebrow: "Grands-parents",
    actionRapide: "As-tu au moins un élément à partager sur ton grand-père paternel ?",
    text: "Un prénom, un nom ou un surnom peut déjà être précieux.",
    cta: "Ajouter une info sur mon grand-père paternel",
    icon: Network,
    table: "participant_family_knowledge_grandparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_grandparents: ["data"],
    },
    to: "/family-knowledge/grandparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeGrandparentsData(rowsByTable);
      const person = getGrandparentPerson(data, "paternalGrandfather");
      if (!person) return false;
      if (person.known === false) return true;
      if (person.known === true) return grandparentHasIdentity(person);
      return false;
    },
  },
  {
    key: "grandparents-paternal-grandmother-known",
    familyKnowledgeKey: "grandparents",
    group: "grandparents",
    eyebrow: "Grands-parents",
    actionRapide: "As-tu quelques informations sur ta grand-mère paternelle ?",
    text: "",
    cta: "Parler de ma grand-mère paternelle",
    icon: Network,
    table: "participant_family_knowledge_grandparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_grandparents: ["data"],
    },
    to: "/family-knowledge/grandparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeGrandparentsData(rowsByTable);
      const person = getGrandparentPerson(data, "paternalGrandmother");
      return person?.known === true || person?.known === false;
    },
  },
  {
    key: "grandparents-paternal-grandmother-identity",
    familyKnowledgeKey: "grandparents",
    group: "grandparents",
    eyebrow: "Grands-parents",
    actionRapide: "As-tu au moins un élément à partager sur ta grand-mère paternelle ?",
    text: "Un prénom, un nom ou un surnom peut déjà être utile.",
    cta: "Ajouter une info sur ma grand-mère paternelle",
    icon: Network,
    table: "participant_family_knowledge_grandparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_grandparents: ["data"],
    },
    to: "/family-knowledge/grandparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeGrandparentsData(rowsByTable);
      const person = getGrandparentPerson(data, "paternalGrandmother");
      if (!person) return false;
      if (person.known === false) return true;
      if (person.known === true) return grandparentHasIdentity(person);
      return false;
    },
  },
  {
    key: "grandparents-maternal-grandfather-known",
    familyKnowledgeKey: "grandparents",
    group: "grandparents",
    eyebrow: "Grands-parents",
    actionRapide: "As-tu quelques informations sur ton grand-père maternel ?",
    text: "",
    cta: "Parler de mon grand-père maternel",
    icon: Network,
    table: "participant_family_knowledge_grandparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_grandparents: ["data"],
    },
    to: "/family-knowledge/grandparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeGrandparentsData(rowsByTable);
      const person = getGrandparentPerson(data, "maternalGrandfather");
      return person?.known === true || person?.known === false;
    },
  },
  {
    key: "grandparents-maternal-grandfather-identity",
    familyKnowledgeKey: "grandparents",
    group: "grandparents",
    eyebrow: "Grands-parents",
    actionRapide: "As-tu au moins un élément à partager sur ton grand-père maternel ?",
    text: "Un prénom, un nom, un surnom ou un souvenir peut déjà être précieux.",
    cta: "Ajouter une info sur mon grand-père maternel",
    icon: Network,
    table: "participant_family_knowledge_grandparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_grandparents: ["data"],
    },
    to: "/family-knowledge/grandparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeGrandparentsData(rowsByTable);
      const person = getGrandparentPerson(data, "maternalGrandfather");
      if (!person) return false;
      if (person.known === false) return true;
      if (person.known === true) return grandparentHasIdentity(person);
      return false;
    },
  },
  {
    key: "grandparents-maternal-grandmother-known",
    familyKnowledgeKey: "grandparents",
    group: "grandparents",
    eyebrow: "Grands-parents",
    actionRapide: "As-tu quelques informations sur ta grand-mère maternelle ?",
    text: "",
    cta: "Parler de ma grand-mère maternelle",
    icon: Network,
    table: "participant_family_knowledge_grandparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_grandparents: ["data"],
    },
    to: "/family-knowledge/grandparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeGrandparentsData(rowsByTable);
      const person = getGrandparentPerson(data, "maternalGrandmother");
      return person?.known === true || person?.known === false;
    },
  },
  {
    key: "grandparents-maternal-grandmother-identity",
    familyKnowledgeKey: "grandparents",
    group: "grandparents",
    eyebrow: "Grands-parents",
    actionRapide: "As-tu au moins un élément à partager sur ta grand-mère maternelle ?",
    text: "Un prénom, un nom, un surnom ou un souvenir peut déjà être précieux.",
    cta: "Ajouter une info sur ma grand-mère maternelle",
    icon: Network,
    table: "participant_family_knowledge_grandparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_grandparents: ["data"],
    },
    to: "/family-knowledge/grandparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeGrandparentsData(rowsByTable);
      const person = getGrandparentPerson(data, "maternalGrandmother");
      if (!person) return false;
      if (person.known === false) return true;
      if (person.known === true) return grandparentHasIdentity(person);
      return false;
    },
  },
  {
    key: "grandparents-has-paternal-aunts-uncles",
    familyKnowledgeKey: "grandparents",
    group: "grandparents",
    eyebrow: "Grands-parents",
    actionRapide: "Sais-tu si ton père avait des frères ou des sœurs ?",
    text: "Ta réponse aide à mieux comprendre la branche paternelle.",
    cta: "Répondre pour la fratrie de mon père",
    icon: Network,
    table: "participant_family_knowledge_grandparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_grandparents: ["data"],
    },
    to: "/family-knowledge/grandparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeGrandparentsData(rowsByTable);
      return (
        data?.hasPaternalAuntsUncles === "yes" ||
        data?.hasPaternalAuntsUncles === "no"
      );
    },
  },
  {
    key: "grandparents-paternal-aunts-uncles-list",
    familyKnowledgeKey: "grandparents",
    group: "grandparents",
    eyebrow: "Grands-parents",
    actionRapide: "Peux-tu ajouter au moins un frère ou une sœur de ton père, si tu en connais ?",
    text: "Une seule personne ajoutée peut déjà aider à reconstituer la fratrie.",
    cta: "Ajouter un oncle ou une tante du côté paternel",
    icon: Network,
    table: "participant_family_knowledge_grandparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_grandparents: ["data"],
    },
    to: "/family-knowledge/grandparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeGrandparentsData(rowsByTable);
      const list = Array.isArray(data?.paternalAuntsUncles)
        ? data.paternalAuntsUncles
        : [];
      if (data?.hasPaternalAuntsUncles === "no") return true;
      if (data?.hasPaternalAuntsUncles === "yes") return list.length > 0;
      return false;
    },
  },
  {
    key: "grandparents-has-maternal-aunts-uncles",
    familyKnowledgeKey: "grandparents",
    group: "grandparents",
    eyebrow: "Grands-parents",
    actionRapide: "Sais-tu si ta mère avait des frères ou des sœurs ?",
    text: "Ta réponse aide à mieux comprendre la branche maternelle.",
    cta: "Répondre pour la fratrie de ma mère",
    icon: Network,
    table: "participant_family_knowledge_grandparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_grandparents: ["data"],
    },
    to: "/family-knowledge/grandparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeGrandparentsData(rowsByTable);
      return (
        data?.hasMaternalAuntsUncles === "yes" ||
        data?.hasMaternalAuntsUncles === "no"
      );
    },
  },
  {
    key: "grandparents-maternal-aunts-uncles-list",
    familyKnowledgeKey: "grandparents",
    group: "grandparents",
    eyebrow: "Grands-parents",
    actionRapide: "Peux-tu ajouter au moins un frère ou une sœur de ta mère, si tu en connais ?",
    text: "Une seule personne ajoutée peut déjà aider à reconstituer la fratrie.",
    cta: "Ajouter un oncle ou une tante du côté maternel",
    icon: Network,
    table: "participant_family_knowledge_grandparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_grandparents: ["data"],
    },
    to: "/family-knowledge/grandparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeGrandparentsData(rowsByTable);
      const list = Array.isArray(data?.maternalAuntsUncles)
        ? data.maternalAuntsUncles
        : [];
      if (data?.hasMaternalAuntsUncles === "no") return true;
      if (data?.hasMaternalAuntsUncles === "yes") return list.length > 0;
      return false;
    },
  },
  {
    key: "grandparents",
    familyKnowledgeKey: "grandparents",
    group: "grandparents",
    eyebrow: "Grands-parents",
    actionRapide: "Souhaites-tu partager ce que tu sais sur tes grands-parents et la fratrie de tes parents ?",
    text: "Les grands-parents et les frères et sœurs de tes parents aident souvent à mieux comprendre toute la branche familiale.",
    cta: "Compléter cette branche familiale",
    icon: Network,
    table: "participant_family_knowledge_grandparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_grandparents: ["data"],
    },
    to: "/family-knowledge/grandparents",
    type: "form",
    isComplete: (rowsByTable) =>
      isFamilyKnowledgeGrandparentsComplete(
        rowsByTable["participant_family_knowledge_grandparents"],
      ),
  },
  {
    key: "godparents-self-baptized",
    familyKnowledgeKey: "godparents",
    group: "godparents",
    eyebrow: "Parrainages",
    actionRapide: "Sais-tu si tu as été baptisé ?",
    text: "Quand on s'intéresse à l'entourage d'une famille, l'identité des parrain et marraine est précieuse.",
    cta: "Répondre pour moi",
    icon: HeartHandshake,
    table: "participant_family_knowledge_godparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_godparents: ["data"],
    },
    to: "/family-knowledge/godparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeGodparentsData(rowsByTable);
      const self = getNestedRecord(data, "self");
      return (
        self?.["isBaptized"] === "yes" || self?.["isBaptized"] === "no"
      );
    },
  },
  {
    key: "godparents-self-godchildren",
    familyKnowledgeKey: "godparents",
    group: "godparents",
    eyebrow: "Parrainages",
    actionRapide: "Souhaites-tu indiquer si tu as des filleuls ?",
    text: "Même une réponse négative aide à clarifier les liens de parrainage actuels.",
    cta: "Répondre pour mes filleuls",
    icon: HeartHandshake,
    table: "participant_family_knowledge_godparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_godparents: ["data"],
    },
    to: "/family-knowledge/godparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeGodparentsData(rowsByTable);
      const self = getNestedRecord(data, "self");
      return (
        self?.["hasGodchildren"] === "yes" ||
        self?.["hasGodchildren"] === "no"
      );
    },
  },
  {
    key: "godparents-father",
    familyKnowledgeKey: "godparents",
    group: "godparents",
    eyebrow: "Parrainages",
    actionRapide: "Souhaites-tu partager ce que tu sais sur le parrain et la marraine de ton père ?",
    text: "Parrain, marraine ou éventuels filleuls peuvent révéler des liens familiaux importants.",
    cta: "Compléter pour mon père",
    icon: HeartHandshake,
    table: "participant_family_knowledge_godparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_godparents: ["data"],
      participant_family_knowledge_close_family: ["data"],
    },
    dependsOnTables: ["participant_family_knowledge_close_family"],
    to: "/family-knowledge/godparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const closeFamily = getCloseFamilyData(rowsByTable);
      const father = getCloseFamilyPerson(closeFamily, "parent1");

      if (!father?.known) return true;

      const data = getFamilyKnowledgeGodparentsData(rowsByTable);
      return isParrainageSectionComplete(getNestedRecord(data, "father"));
    },
  },
  {
    key: "godparents-mother",
    familyKnowledgeKey: "godparents",
    group: "godparents",
    eyebrow: "Parrainages",
    actionRapide: "Souhaites-tu partager ce que tu sais sur le parrain et la marraine de ta mère ?",
    text: "Parrains, marraines ou éventuels filleuls peuvent révéler des liens familiaux importants.",
    cta: "Compléter pour ma mère",
    icon: HeartHandshake,
    table: "participant_family_knowledge_godparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_godparents: ["data"],
      participant_family_knowledge_close_family: ["data"],
    },
    dependsOnTables: ["participant_family_knowledge_close_family"],
    to: "/family-knowledge/godparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const closeFamily = getCloseFamilyData(rowsByTable);
      const mother = getCloseFamilyPerson(closeFamily, "parent2");

      if (!mother?.known) return true;

      const data = getFamilyKnowledgeGodparentsData(rowsByTable);
      return isParrainageSectionComplete(getNestedRecord(data, "mother"));
    },
  },
  {
    key: "godparents-paternal-grandparents",
    familyKnowledgeKey: "godparents",
    group: "godparents",
    eyebrow: "Parrainages",
    actionRapide: "Souhaites-tu partager ce que tu sais sur le parrain et la marraine dans ta famille paternelle ?",
    text: "Ces informations peuvent aider à retrouver des proximités anciennes dans la branche paternelle.",
    cta: "Compléter le côté paternel",
    icon: HeartHandshake,
    table: "participant_family_knowledge_godparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_godparents: ["data"],
      participant_family_knowledge_grandparents: ["data"],
    },
    dependsOnTables: ["participant_family_knowledge_grandparents"],
    to: "/family-knowledge/godparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const gp = getFamilyKnowledgeGrandparentsData(rowsByTable);
      const paternalGrandfather = getGrandparentPerson(gp, "paternalGrandfather");
      const paternalGrandmother = getGrandparentPerson(gp, "paternalGrandmother");
      const data = getFamilyKnowledgeGodparentsData(rowsByTable);

      const gfOk =
        !paternalGrandfather?.known ||
        isParrainageSectionComplete(getNestedRecord(data, "paternalGrandfather"));
      const gmOk =
        !paternalGrandmother?.known ||
        isParrainageSectionComplete(getNestedRecord(data, "paternalGrandmother"));

      return gfOk && gmOk;
    },
  },
  {
    key: "godparents-maternal-grandparents",
    familyKnowledgeKey: "godparents",
    group: "godparents",
    eyebrow: "Parrainages",
    actionRapide: "Souhaites-tu partager ce que tu sais sur le parrain et la marraine dans ta famille maternelle ?",
    text: "Ces informations peuvent aider à retrouver des proximités anciennes dans la branche maternelle.",
    cta: "Compléter le côté maternel",
    icon: HeartHandshake,
    table: "participant_family_knowledge_godparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_godparents: ["data"],
      participant_family_knowledge_grandparents: ["data"],
    },
    dependsOnTables: ["participant_family_knowledge_grandparents"],
    to: "/family-knowledge/godparents",
    type: "form",
    isComplete: (rowsByTable) => {
      const gp = getFamilyKnowledgeGrandparentsData(rowsByTable);
      const maternalGrandfather = getGrandparentPerson(gp, "maternalGrandfather");
      const maternalGrandmother = getGrandparentPerson(gp, "maternalGrandmother");
      const data = getFamilyKnowledgeGodparentsData(rowsByTable);

      const gfOk =
        !maternalGrandfather?.known ||
        isParrainageSectionComplete(getNestedRecord(data, "maternalGrandfather"));
      const gmOk =
        !maternalGrandmother?.known ||
        isParrainageSectionComplete(getNestedRecord(data, "maternalGrandmother"));

      return gfOk && gmOk;
    },
  },
  {
    key: "godparents",
    familyKnowledgeKey: "godparents",
    group: "godparents",
    eyebrow: "Parrainages",
    actionRapide: "Peux-tu partager ce que tu sais sur les parrains, marraines et filleuls de la famille ?",
    text: "Ces liens racontent souvent des proximités familiales, affectives ou sociales très importantes.",
    cta: "Compléter les liens de parrainage",
    icon: HeartHandshake,
    table: "participant_family_knowledge_godparents",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_godparents: ["data"],
      participant_family_knowledge_close_family: ["data"],
      participant_family_knowledge_grandparents: ["data"],
    },
    dependsOnTables: [
      "participant_family_knowledge_close_family",
      "participant_family_knowledge_grandparents",
    ],
    to: "/family-knowledge/godparents",
    type: "form",
    isComplete: (rowsByTable) => isFamilyKnowledgeGodparentsComplete(rowsByTable),
  },
  {
    key: "memory-seen-photos",
    familyKnowledgeKey: "memory",
    group: "memory",
    eyebrow: "Mémoire familiale",
    actionRapide: "As-tu déjà vu des photos de la famille ?",
    text: "Même si tu ne les as pas chez toi, ta réponse peut déjà aider à retrouver où elles circulent.",
    cta: "Répondre pour les photos vues",
    icon: Image,
    table: "participant_family_knowledge_memory",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_memory: ["data"],
    },
    to: "/family-knowledge/memory",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeMemoryData(rowsByTable);
      return (
        data?.hasSeenFamilyPhotos === "yes" ||
        data?.hasSeenFamilyPhotos === "no"
      );
    },
  },
  {
    key: "memory-has-photos",
    familyKnowledgeKey: "memory",
    group: "memory",
    eyebrow: "Mémoire familiale",
    actionRapide: "As-tu des photos de famille chez toi ou en ta possession ?",
    text: "Savoir qu’elles existent peut déjà être très utile.",
    cta: "Répondre pour mes photos",
    icon: Image,
    table: "participant_family_knowledge_memory",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_memory: ["data"],
    },
    to: "/family-knowledge/memory",
    type: "form",
    isComplete: (rowsByTable) => {
      const data = getFamilyKnowledgeMemoryData(rowsByTable);
      return (
        data?.hasFamilyPhotos === "yes" ||
        data?.hasFamilyPhotos === "no"
      );
    },
  },
  {
    key: "memory",
    familyKnowledgeKey: "memory",
    group: "memory",
    eyebrow: "Mémoire familiale",
    actionRapide: "Souhaites-tu partager ce que tu sais sur les souvenirs et les photos de la famille ?",
    text: "Souvenirs, personnes qui racontaient l’histoire familiale, photos vues ou conservées : tout peut aider.",
    cta: "Compléter la mémoire familiale",
    icon: BookOpen,
    table: "participant_family_knowledge_memory",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_memory: ["data"],
    },
    to: "/family-knowledge/memory",
    type: "form",
    isComplete: (rowsByTable) =>
      isFamilyKnowledgeMemoryComplete(
        rowsByTable["participant_family_knowledge_memory"],
      ),
  },
  {
    key: "current_links",
    familyKnowledgeKey: "current_links",
    group: "current_links",
    eyebrow: "Famille en contact",
    actionRapide: "Avec quelles personnes de la famille es-tu encore en contact aujourd’hui ?",
    text: "Même une seule personne peut déjà aider à mieux comprendre les liens actuels dans la famille.",
    cta: "Compléter mes liens actuels",
    icon: Users,
    table: "participant_family_knowledge_current_links",
    participantField: "participant_id",
    fields: { and: [] },
    selectFieldsByTable: {
      participant_family_knowledge_current_links: ["data"],
    },
    to: "/family-knowledge/current-links",
    type: "form",
    isComplete: (rowsByTable) =>
      isFamilyKnowledgeCurrentLinksComplete(
        rowsByTable["participant_family_knowledge_current_links"],
      ),
  },
];

function isCloseFamilyComplete(row: CompletionRow): boolean {
  const data = (row as Record<string, unknown> | null)?.data as
    | Record<string, unknown>
    | undefined;

  if (!data) return false;

  const parent1 = data.parent1 as Record<string, unknown> | undefined;
  const parent2 = data.parent2 as Record<string, unknown> | undefined;
  const siblings = Array.isArray(data.siblings) ? data.siblings : [];
  const children = Array.isArray(data.children) ? data.children : [];
  const hasSiblings = data.hasSiblings;
  const hasChildren = data.hasChildren;

  function personHasIdentity(person: Record<string, unknown> | undefined) {
    if (!person) return false;

    const firstName =
      typeof person.firstName === "string" ? person.firstName.trim() : "";
    const lastName =
      typeof person.lastName === "string" ? person.lastName.trim() : "";
    const nickname =
      typeof person.nickname === "string" ? person.nickname.trim() : "";

    return Boolean(firstName || lastName || nickname);
  }

  function personIsConsistent(person: Record<string, unknown> | undefined) {
    if (!person) return false;

    if (person.known === false) {
      return true;
    }

    if (person.known === true) {
      return personHasIdentity(person);
    }

    return false;
  }

  const parentsOk = personIsConsistent(parent1) && personIsConsistent(parent2);

  const siblingsOk =
    hasSiblings === "no" ||
    (hasSiblings === "yes" && siblings.length > 0);

  const childrenOk =
    hasChildren === "no" ||
    (hasChildren === "yes" && children.length > 0);

  return parentsOk && siblingsOk && childrenOk;
}

function getCloseFamilyData(rowsByTable: Record<string, CompletionRow>) {
  const row = rowsByTable["participant_family_knowledge_close_family"] as
    | Record<string, unknown>
    | null;

  return (row?.data as Record<string, unknown> | undefined) ?? null;
}

function getCloseFamilyPerson(
  data: Record<string, unknown> | null,
  key: string,
) {
  return (data?.[key] as Record<string, unknown> | undefined) ?? null;
}

function personHasIdentity(person: Record<string, unknown> | null) {
  if (!person) return false;

  const firstName =
    typeof person.firstName === "string" ? person.firstName.trim() : "";
  const lastName =
    typeof person.lastName === "string" ? person.lastName.trim() : "";
  const nickname =
    typeof person.nickname === "string" ? person.nickname.trim() : "";

  return Boolean(firstName || lastName || nickname);
}

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
    return true;
  }

  return true;
}

function hasAnyFilledField(
  row: Record<string, unknown> | null | undefined,
  fields: string[],
): boolean {
  if (!row) return false;
  return fields.some((field) => isValueFilled(row[field]));
}

function evaluateCompletionCondition(
  condition: CompletionCondition,
  row: Record<string, unknown>,
): boolean {
  if (typeof condition === "string") {
    return isValueFilled(row[condition]);
  }

  if ("and" in condition) {
    return condition.and.every((item) => evaluateCompletionCondition(item, row));
  }

  if ("or" in condition) {
    return condition.or.some((item) => evaluateCompletionCondition(item, row));
  }

  return false;
}

export function isCompletionRuleComplete(
  rule: CompletionRule,
  row: CompletionRow,
  rowsByTable?: Record<string, CompletionRow>,
): boolean {
  if (rule.type === "info") {
    return true;
  }

  if (rule.isComplete) {
    return rule.isComplete(rowsByTable ?? {});
  }

  if (!row) {
    return false;
  }

  return evaluateCompletionCondition(rule.fields, row);
}

export function buildCompletionItemStatus(
  rule: CompletionRule,
  row: CompletionRow,
  rowsByTable?: Record<string, CompletionRow>,
) {
  return {
    ...rule,
    complete: isCompletionRuleComplete(rule, row, rowsByTable),
  };
}

export function getFirstIncompleteCompletionRules(
  rules: CompletionRule[],
  rowsByTable: Record<string, CompletionRow>,
  limit = 4,
) {
  const firstRuleByGroup = new Set<string>();

  return rules
    .filter((rule) => {
      if (rule.type === "info") {
        return true;
      }

      const row = rule.table ? rowsByTable[rule.table] : null;
      return !isCompletionRuleComplete(rule, row, rowsByTable);
    })
    .filter((rule) => {
      if (!rule.group) {
        return true;
      }

      if (firstRuleByGroup.has(rule.group)) {
        return false;
      }

      firstRuleByGroup.add(rule.group);
      return true;
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

function getFamilyKnowledgeMemoryData(
  rowsByTable: Record<string, CompletionRow>,
) {
  const row = rowsByTable["participant_family_knowledge_memory"] as
    | Record<string, unknown>
    | null;

  return (row?.data as Record<string, unknown> | undefined) ?? null;
}

function isFamilyKnowledgeMemoryComplete(row: CompletionRow): boolean {
  const data = (row as Record<string, unknown> | null)?.data as
    | Record<string, unknown>
    | undefined;

  if (!data) return false;

  const hasSeenFamilyPhotos = data.hasSeenFamilyPhotos;
  const hasFamilyPhotos = data.hasFamilyPhotos;

  const seenPhotosOk =
    hasSeenFamilyPhotos === "yes" || hasSeenFamilyPhotos === "no";

  const hasPhotosOk = hasFamilyPhotos === "yes" || hasFamilyPhotos === "no";

  return seenPhotosOk && hasPhotosOk;
}

function getFamilyKnowledgeGrandparentsData(
  rowsByTable: Record<string, CompletionRow>,
) {
  const row = rowsByTable["participant_family_knowledge_grandparents"] as
    | Record<string, unknown>
    | null;

  return (row?.data as Record<string, unknown> | undefined) ?? null;
}

function getGrandparentPerson(
  data: Record<string, unknown> | null,
  key:
    | "paternalGrandfather"
    | "paternalGrandmother"
    | "maternalGrandfather"
    | "maternalGrandmother",
) {
  return (data?.[key] as Record<string, unknown> | undefined) ?? null;
}

function grandparentHasIdentity(person: Record<string, unknown> | null) {
  if (!person) return false;

  const firstName =
    typeof person.firstName === "string" ? person.firstName.trim() : "";
  const lastName =
    typeof person.lastName === "string" ? person.lastName.trim() : "";
  const nickname =
    typeof person.nickname === "string" ? person.nickname.trim() : "";

  return Boolean(firstName || lastName || nickname);
}

function grandparentIsConsistent(person: Record<string, unknown> | null) {
  if (!person) return false;

  if (person.known === false) return true;
  if (person.known === true) return grandparentHasIdentity(person);

  return false;
}

function isFamilyKnowledgeGrandparentsComplete(row: CompletionRow): boolean {
  const data = (row as Record<string, unknown> | null)?.data as
    | Record<string, unknown>
    | undefined;

  if (!data) return false;

  const paternalGrandfather = getGrandparentPerson(data, "paternalGrandfather");
  const paternalGrandmother = getGrandparentPerson(data, "paternalGrandmother");
  const maternalGrandfather = getGrandparentPerson(data, "maternalGrandfather");
  const maternalGrandmother = getGrandparentPerson(data, "maternalGrandmother");

  const paternalAuntsUncles = Array.isArray(data.paternalAuntsUncles)
    ? data.paternalAuntsUncles
    : [];
  const maternalAuntsUncles = Array.isArray(data.maternalAuntsUncles)
    ? data.maternalAuntsUncles
    : [];

  const grandparentsOk =
    grandparentIsConsistent(paternalGrandfather) &&
    grandparentIsConsistent(paternalGrandmother) &&
    grandparentIsConsistent(maternalGrandfather) &&
    grandparentIsConsistent(maternalGrandmother);

  const paternalOk =
    data.hasPaternalAuntsUncles === "no" ||
    (data.hasPaternalAuntsUncles === "yes" && paternalAuntsUncles.length > 0);

  const maternalOk =
    data.hasMaternalAuntsUncles === "no" ||
    (data.hasMaternalAuntsUncles === "yes" && maternalAuntsUncles.length > 0);

  return grandparentsOk && paternalOk && maternalOk;
}

function isFamilyKnowledgeCurrentLinksComplete(row: CompletionRow): boolean {
  const data = (row as Record<string, unknown> | null)?.data as
    | Record<string, unknown>
    | undefined;

  if (!data) return false;

  const contacts = Array.isArray(data.contacts) ? data.contacts : [];

  if (contacts.length === 0) return false;

  return contacts.every((contact) => {
    const person = contact as Record<string, unknown>;

    const firstName =
      typeof person.firstName === "string" ? person.firstName.trim() : "";
    const lastName =
      typeof person.lastName === "string" ? person.lastName.trim() : "";
    const relationshipType =
      typeof person.relationshipType === "string"
        ? person.relationshipType
        : "";
    const relationshipLabel =
      typeof person.relationshipLabel === "string"
        ? person.relationshipLabel.trim()
        : "";

    const hasIdentity = Boolean(firstName || lastName);
    const hasRelationship = Boolean(relationshipType);
    const hasOtherRelationship =
      relationshipType !== "other" || Boolean(relationshipLabel);

    return hasIdentity && hasRelationship && hasOtherRelationship;
  });
}

function getFamilyKnowledgeGodparentsData(
  rowsByTable: Record<string, CompletionRow>,
) {
  const row = rowsByTable["participant_family_knowledge_godparents"] as
    | Record<string, unknown>
    | null;

  return (row?.data as Record<string, unknown> | undefined) ?? null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getNestedRecord(
  source: Record<string, unknown> | null | undefined,
  key: string,
): Record<string, unknown> | null {
  return asRecord(source?.[key]);
}

function hasValidKnownPersonIdentity(
  person: Record<string, unknown> | null | undefined,
) {
  if (!person) return false;

  if (person["known"] === false) return true;

  if (person["known"] === true) {
    const firstName =
      typeof person["firstName"] === "string" ? person["firstName"].trim() : "";
    const lastName =
      typeof person["lastName"] === "string" ? person["lastName"].trim() : "";
    const nickname =
      typeof person["nickname"] === "string" ? person["nickname"].trim() : "";

    if (!(firstName || lastName || nickname)) return false;

    if (
      person["isFamilyMember"] === "yes" &&
      !(
        typeof person["familyRelationshipDetail"] === "string" &&
        person["familyRelationshipDetail"].trim()
      )
    ) {
      return false;
    }

    return true;
  }

  return false;
}

function isGodchildrenListComplete(
  section: Record<string, unknown> | null | undefined,
) {
  if (!section) return false;

  const hasGodchildren = section["hasGodchildren"];
  const godchildren = Array.isArray(section["godchildren"])
    ? section["godchildren"]
    : [];

  if (hasGodchildren === "no") return true;

  if (hasGodchildren === "yes") {
    return godchildren.every((godchild) =>
      hasValidKnownPersonIdentity(asRecord(godchild)),
    );
  }

  return false;
}

function isParrainageSectionComplete(
  section: Record<string, unknown> | null | undefined,
) {
  if (!section) return false;

  const isBaptized = section["isBaptized"];
  const hasGodchildren = section["hasGodchildren"];
  const godfather = asRecord(section["godfather"]);
  const godmother = asRecord(section["godmother"]);

  const baptizedOk =
    isBaptized === "no" ||
    (isBaptized === "yes" &&
      hasValidKnownPersonIdentity(godfather) &&
      hasValidKnownPersonIdentity(godmother));

  const godchildrenOk =
    hasGodchildren === "no" ||
    (hasGodchildren === "yes" && isGodchildrenListComplete(section));

  return baptizedOk && godchildrenOk;
}

function isFamilyKnowledgeGodparentsComplete(
  rowsByTable: Record<string, CompletionRow>,
): boolean {
  const data = getFamilyKnowledgeGodparentsData(rowsByTable);
  if (!data) return false;

  const closeFamily = getCloseFamilyData(rowsByTable);
  const grandparents = getFamilyKnowledgeGrandparentsData(rowsByTable);

  const selfOk = isParrainageSectionComplete(getNestedRecord(data, "self"));

  const fatherKnown = Boolean(getCloseFamilyPerson(closeFamily, "parent1")?.known);
  const motherKnown = Boolean(getCloseFamilyPerson(closeFamily, "parent2")?.known);

  const fatherOk =
    !fatherKnown ||
    isParrainageSectionComplete(getNestedRecord(data, "father"));

  const motherOk =
    !motherKnown ||
    isParrainageSectionComplete(getNestedRecord(data, "mother"));

  const paternalGrandfatherKnown = Boolean(
    getGrandparentPerson(grandparents, "paternalGrandfather")?.known,
  );
  const paternalGrandmotherKnown = Boolean(
    getGrandparentPerson(grandparents, "paternalGrandmother")?.known,
  );
  const maternalGrandfatherKnown = Boolean(
    getGrandparentPerson(grandparents, "maternalGrandfather")?.known,
  );
  const maternalGrandmotherKnown = Boolean(
    getGrandparentPerson(grandparents, "maternalGrandmother")?.known,
  );

  const paternalGrandfatherOk =
    !paternalGrandfatherKnown ||
    isParrainageSectionComplete(getNestedRecord(data, "paternalGrandfather"));

  const paternalGrandmotherOk =
    !paternalGrandmotherKnown ||
    isParrainageSectionComplete(getNestedRecord(data, "paternalGrandmother"));

  const maternalGrandfatherOk =
    !maternalGrandfatherKnown ||
    isParrainageSectionComplete(getNestedRecord(data, "maternalGrandfather"));

  const maternalGrandmotherOk =
    !maternalGrandmotherKnown ||
    isParrainageSectionComplete(getNestedRecord(data, "maternalGrandmother"));

  return (
    selfOk &&
    fatherOk &&
    motherOk &&
    paternalGrandfatherOk &&
    paternalGrandmotherOk &&
    maternalGrandfatherOk &&
    maternalGrandmotherOk
  );
}