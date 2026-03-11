export type ContactConsentOption = {
  key: "allow_contact" | "allow_photos_share" | "allow_family_news";
  label: string;
  helpText?: string;
};

export type ContactFormConfig = {
  title: string;
  subtitle: string;
  introTitle: string;
  introText: string;
  fields: {
    phone: {
      label: string;
      placeholder: string;
      required: boolean;
      helpText?: string;
    };
    email: {
      label: string;
      placeholder: string;
      required: boolean;
      helpText?: string;
    };
  };
  consents: ContactConsentOption[];
};

export const contactFormConfig: ContactFormConfig = {
  title: "Rester en contact",
  subtitle:
    "Si tu le souhaites, tu peux laisser un moyen de te joindre et choisir ce que tu acceptes.",
  introTitle: "Tu gardes la main",
  introText:
    "Ces informations sont facultatives. Elles servent uniquement à garder le contact avec la famille, si tu en as envie.",
  fields: {
    phone: {
      label: "Téléphone",
      placeholder: "Ex : 06 12 34 56 78",
      required: false,
      helpText:
        "Pratique si certains cousins souhaitent te joindre facilement.",
    },
    email: {
      label: "Email",
      placeholder: "Ex : marie@email.com",
      required: false,
      helpText:
        "Utile pour recevoir les photos ou des nouvelles de la famille.",
    },
  },
  consents: [
    {
      key: "allow_photos_share",
      label: "Je souhaite recevoir les photos de la cousinade",
      helpText:
        "Par exemple pour revivre les meilleurs moments après la journée.",
    },
    {
      key: "allow_contact",
      label: "Les cousins peuvent me contacter",
      helpText:
        "Pour échanger des souvenirs, des informations familiales ou simplement garder le lien.",
    },
    {
      key: "allow_family_news",
      label: "J’accepte de recevoir des nouvelles de la famille",
      helpText:
        "Occasionnellement, pour partager des infos familiales ou annoncer une future rencontre.",
    },
  ],
};