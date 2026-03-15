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
  badge?: string;
  routeSuffix: string;
};

export const onboardingStepsConfig: OnboardingStepConfig[] = [
  {
    key: "identity",
    title: "Mon profil",
    subtitle:
      "Présente-toi en quelques mots et ajoute tes coordonnées.",
    why: "Cela permet de mieux t’identifier, de te recontacter facilement et de compléter ton profil famille.",
    ctaLabel: "Compléter mon profil",
    icon: UserCircle2,
    badge: "Essentiel",
    routeSuffix: "identity",
  },
  {
    key: "preferences",
    title: "Partage et autorisations",
    subtitle: "Décide ce que la famille peut voir ou utiliser à ton sujet.",
    why: "Tu gardes la main sur les photos, l’arbre familial, les contacts et certains usages dans l’application.",
    ctaLabel: "Gérer mes consentements",
    icon: Settings,
    badge: "Essentiel",
    routeSuffix: "preferences",
  },
  {
    key: "profile",
    title: "Mieux te connaître",
    subtitle:
      "Présente-toi en quelques mots : où tu vis, ce que tu fais et ce que tu aimes.",
    why: "Ces petites informations donnent envie d’échanger et créent plus facilement du lien entre cousins.",
    ctaLabel: "Partager quelques infos",
    icon: MessageCircleHeart,
    routeSuffix: "profile",
  },
  {
  key: "origins",
  title: "Ton lien avec la cousinade",
  subtitle:
    "Dis-nous comment tu as connu la cousinade et ce que tu sais de ta branche familiale.",
  why: "Ces informations nous aident à mieux comprendre les liens dans la famille et la manière dont les cousins rejoignent l’initiative.",
  ctaLabel: "Renseigner ces informations",
  icon: GitBranch,
  routeSuffix: "origins",
}
];