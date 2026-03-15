import {
  BookOpen,
  HeartHandshake,
  Network,
  ScrollText,
  Users,
  Image,
  type LucideIcon,
} from "lucide-react";

export type FamilyKnowledgeStepStatus = "todo" | "in_progress" | "done";

export type FamilyKnowledgeStepKey =
  | "close_family"
  | "grandparents"
  | "godparents"
  | "current_links"
  | "memory"
  | "photos";

export type FamilyKnowledgeStepConfig = {
  key: FamilyKnowledgeStepKey;
  title: string;
  subtitle: string;
  ctaLabel: string;
  icon: LucideIcon;
  routeSuffix: string;
};

export const familyKnowledgeStepsConfig: FamilyKnowledgeStepConfig[] = [
  {
    key: "close_family",
    title: "Ta famille proche",
    subtitle:
      "Parents, fratrie, enfants, conjoint : les premiers repères autour de toi.",
    ctaLabel: "Renseigner ma famille proche",
    icon: Users,
    routeSuffix: "close-family",
  },
  {
    key: "grandparents",
    title: "Tes grands-parents",
    subtitle:
      "Grands-parents, oncles et tantes : enrichir les générations qui te précèdent.",
    ctaLabel: "Renseigner mes grands-parents",
    icon: Network,
    routeSuffix: "grandparents",
  },
  {
    key: "godparents",
    title: "Les liens de parrainage",
    subtitle:
      "Parrains et marraines : des liens souvent importants dans l’histoire familiale.",
    ctaLabel: "Renseigner les parrainages",
    icon: HeartHandshake,
    routeSuffix: "godparents",
  },
  {
    key: "current_links",
    title: "La famille aujourd’hui",
    subtitle:
      "Les personnes de la famille avec qui tu es encore en contact aujourd’hui.",
    ctaLabel: "Renseigner mes liens actuels",
    icon: BookOpen,
    routeSuffix: "current-links",
  },
  {
    key: "memory",
    title: "La mémoire familiale",
    subtitle:
      "Souvenirs et anecdotes que tu aimerais transmettre à la famille.",
    ctaLabel: "Partager mes souvenirs",
    icon: ScrollText,
    routeSuffix: "memory",
  },
  {
    key: "photos",
    title: "Tes photos de famille",
    subtitle:
      "Photos de famille que tu aimerais partager ou transmettre.",
    ctaLabel: "Partager mes photos",
    icon: Image,
    routeSuffix: "photos",
  },
];