import {
  MessageCircleHeart,
  UserCircle2,
  Settings,
  type LucideIcon,
  GitBranch,
} from "lucide-react";

export type OnboardingStepStatus = "todo" | "in_progress" | "done";

export type OnboardingStepConfig = {
  key: "identity" | "profile" | "preferences" | "origins";
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
    title: "Mon profil",
    subtitle:
      "Ajoute tes informations générales et tes coordonnées.",
    why: "Cela permet de mieux t’identifier, de te recontacter facilement et de compléter ton profil famille.",
    ctaLabel: "Compléter mon profil",
    icon: UserCircle2,
    routeSuffix: "identity",
  },
  {
    key: "preferences",
    title: "Consentements et partage",
    subtitle: "Choisis ce que la famille peut voir, afficher ou réutiliser à ton sujet.",
    why: "Tu gardes la main sur les photos, l’arbre familial, les contacts et certains usages dans l’application.",
    ctaLabel: "Gérer mes consentements",
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
  },
  {
  key: "origins",
  title: "Ton lien avec la cousinade",
  subtitle:
    "Dis-nous comment tu as entendu parler du pique-nique et si tu connais ta branche familiale.",
  why: "Ces informations nous aident à mieux comprendre les liens dans la famille et la manière dont les cousins rejoignent l’initiative.",
  ctaLabel: "Renseigner ces informations",
  icon: GitBranch,
  routeSuffix: "origins",
}
];