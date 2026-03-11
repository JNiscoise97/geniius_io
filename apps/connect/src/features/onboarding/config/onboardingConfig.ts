import {
  Contact,
  MessageCircleHeart,
  UserCircle2,
  type LucideIcon,
} from "lucide-react";

export type OnboardingStepStatus = "todo" | "in_progress" | "done";

export type OnboardingStepConfig = {
  key: "identity" | "profile" | "contact";
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
      "Quelques informations simples pour que chacun puisse mieux savoir qui tu es.",
    why: "C’est la meilleure manière d’aider les cousins à te reconnaître et à situer ta place dans la famille.",
    ctaLabel: "Me présenter",
    icon: UserCircle2,
    routeSuffix: "identity",
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
  },
  {
    key: "contact",
    title: "Rester en contact si tu le souhaites",
    subtitle:
      "Tu peux laisser un moyen de te joindre et indiquer ce que tu acceptes ou non.",
    why: "Cela permet par exemple de recevoir les photos ou de garder le contact après la rencontre, seulement si tu en as envie.",
    ctaLabel: "Gérer mes coordonnées",
    icon: Contact,
    routeSuffix: "contact",
  },
];