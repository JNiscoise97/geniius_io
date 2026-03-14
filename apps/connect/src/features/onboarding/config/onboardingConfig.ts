import {
  MessageCircleHeart,
  UserCircle2,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type OnboardingStepStatus = "todo" | "in_progress" | "done";

export type OnboardingStepConfig = {
  key: "identity" | "profile" | "preferences";
  title: string;
  subtitle: string;
  why: string;
  ctaLabel: string;
  icon: LucideIcon;
  routeSuffix: string;
};

export const onboardingStepsConfig: OnboardingStepConfig[] = [
  {
    key: "identity",
    title: "Se présenter à la famille",
    subtitle:
      "Quelques informations simples pour que chacun puisse savoir qui tu es.",
    why: "C’est la meilleure manière d’aider les cousins à te reconnaître et à situer ta place dans la famille.",
    ctaLabel: "Me présenter",
    icon: UserCircle2,
    routeSuffix: "identity",
  },
  {
    key: "preferences",
    title: "Préférences de communication",
    subtitle:
      "Choisis ce que la famille peut afficher ou partager à ton sujet.",
    why: "Tu peux décider ce que tu autorises : photos, informations dans l’arbre familial ou diffusion de certains éléments.",
    ctaLabel: "Gérer mes préférences",
    icon: Settings,
    routeSuffix: "preferences",
  },
  {
    key: "profile",
    title: "Apprendre à mieux te connaître",
    subtitle:
      "Partage quelques éléments sur toi, tes souvenirs ou ce qui te fait plaisir dans cette cousinade.",
    why: "Ces petites informations donnent envie d’échanger et créent plus facilement du lien entre cousins.",
    ctaLabel: "Partager quelques infos",
    icon: MessageCircleHeart,
    routeSuffix: "profile",
  }
];