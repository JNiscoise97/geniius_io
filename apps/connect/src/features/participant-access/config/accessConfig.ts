import {
  KeyRound,
  PlusCircle,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

export type AccessChoiceConfig = {
  key: "device" | "recover" | "create";
  title: string;
  subtitle: string;
  ctaLabel: string;
  icon: LucideIcon;
};

export type AccessConfig = {
  title: string;
  subtitle: string;
  choices: AccessChoiceConfig[];
  recovery: {
    title: string;
    subtitle: string;
    helperTitle: string;
    helperText: string;
    confirmTitle: string;
    confirmSubtitle: string;
    birthYearLabel: string;
    birthYearPlaceholder: string;
    submitLabel: string;
  };
};

export const accessConfig: AccessConfig = {
  title: "Ouvrir un profil",
  subtitle:
    "Retrouve un profil déjà utilisé sur cet appareil, récupère ton espace ou crée un nouveau profil.",
  choices: [
    {
      key: "device",
      title: "Continuer sur cet appareil",
      subtitle:
        "Retrouve les profils déjà enregistrés sur ce téléphone et reprends là où tu t’étais arrêté.",
      ctaLabel: "Voir les profils",
      icon: Smartphone,
    },
    {
      key: "recover",
      title: "Retrouver mon profil",
      subtitle:
        "Utilise ton lien personnel de reprise pour récupérer ton espace sur un autre téléphone ou après une réinitialisation.",
      ctaLabel: "Retrouver mon profil",
      icon: KeyRound,
    },
    {
      key: "create",
      title: "Créer un nouveau profil",
      subtitle:
        "Commence un nouveau profil pour toi ou pour une personne dont tu gères les informations.",
      ctaLabel: "Commencer",
      icon: PlusCircle,
    },
  ],
  recovery: {
    title: "Retrouver un profil",
    subtitle:
      "Avant d’ouvrir le profil sur cet appareil, nous te demandons une vérification simple.",
    helperTitle: "Lien personnel",
    helperText:
      "Ce lien permet de retrouver un profil précis. Évite de le transférer à quelqu’un d’autre.",
    confirmTitle: "Vérification rapide",
    confirmSubtitle:
      "Indique l’année de naissance associée à ce profil pour confirmer l’ouverture sur cet appareil.",
    birthYearLabel: "Année de naissance",
    birthYearPlaceholder: "Ex : 1984",
    submitLabel: "Confirmer et ouvrir le profil",
  },
};