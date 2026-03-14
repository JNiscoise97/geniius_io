export type OriginsOption = {
  key: string;
  label: string;
};

export type OriginsFormConfig = {
  title: string;
  subtitle: string;
  fields: {
    heardAbout: {
      label: string;
      helpText?: string;
      options: OriginsOption[];
      otherPlaceholder: string;
    };
    branches: {
      label: string;
      helpText?: string;
      options: OriginsOption[];
    };
    previousEditions: {
      label: string;
      helpText?: string;
      options: OriginsOption[];
    };
    cousinadeExpectation: {
      label: string;
      helpText?: string;
      placeholder?: string;
      maxLength?: number;
    };
  };
};

export const originsFormConfig: OriginsFormConfig = {
  title: "Ton lien avec la cousinade",
  subtitle:
    "Quelques informations pour mieux comprendre comment tu as entendu parler de cette initiative familiale.",
  fields: {
    heardAbout: {
      label: "Comment as-tu entendu parler du pique-nique ?",
      helpText: "Choisis la réponse la plus proche de ta situation.",
      options: [
        { key: "family", label: "Par la famille" },
        { key: "parents", label: "Par mes parents" },
        { key: "grandparents", label: "Par mes grands-parents" },
        { key: "whatsapp", label: "Par WhatsApp" },
        { key: "facebook", label: "Par Facebook / réseau social" },
        { key: "phone", label: "Par appel ou message" },
        { key: "already_involved", label: "Je suivais déjà l’initiative" },
        { key: "other", label: "Autre" },
      ],
      otherPlaceholder: "Précise si besoin",
    },
    branches: {
      label: "Branche familiale (si tu la connais)",
      helpText:
        "Pour comprendre plus facilement les liens entre les différentes branches.",
      options: [
        { key: "candassamy", label: "Branche Candassamy" },
        { key: "manicon", label: "Branche Manicon" },
        { key: "coundiaman", label: "Branche Coundiaman" },
        { key: "canou", label: "Branche Canou" },
        { key: "molotte", label: "Branche Molotte" },
      ],
    },
    previousEditions: {
      label: "Déjà venu ?",
      helpText:
        "Si tu as déjà participé, tu peux cocher les éditions auxquelles tu étais présent.",
      options: [
        { key: "2023", label: "Édition 2023" },
        { key: "2024", label: "Édition 2024" },
      ],
    },
    cousinadeExpectation: {
      label: "Qu’aimerais-tu retrouver ou découvrir pendant la cousinade ?",
      helpText:
        "Par exemple : rencontrer des cousins, mieux comprendre l’histoire familiale, partager un moment…",
      placeholder: "Quelques lignes si tu le souhaites…",
      maxLength: 600,
    },
  },
};