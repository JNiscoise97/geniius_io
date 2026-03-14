import type { ContactChannel } from "../../participant-access/components/ContactChannelCheckboxGroup";

export type IdentityOption = {
  key: string;
  label: string;
};

export type IdentityFormConfig = {
  title: string;
  subtitle: string;
  introTitle: string;
  introText: string;
  fields: {
    firstName: {
      label: string;
      placeholder: string;
      required: boolean;
    };
    lastName: {
      label: string;
      placeholder: string;
      required: boolean;
    };
    nickname: {
      label: string;
      placeholder: string;
      required: boolean;
      helpText?: string;
    };
    birthYear: {
      label: string;
      placeholder: string;
      required: boolean;
      helpText?: string;
    };
    phone: {
      label: string;
      placeholder: string;
    };
    email: {
      label: string;
      placeholder: string;
    };
    messenger: {
      label: string;
      placeholder: string;
    };
    hasWhatsapp: {
      label: string;
      helpText?: string;
    };
    preferredContactChannels: {
      label: string;
      helpText?: string;
    };
  };
};

export const identityFormConfig: IdentityFormConfig = {
  title: "Informations générales",
  subtitle:
    "Quelques informations simples pour que chacun puisse mieux savoir qui tu es.",
  introTitle: "Commençons simplement",
  introText:
    "Ces informations permettent aux cousins de te reconnaître plus facilement et de mieux situer ta place dans la famille.",
  fields: {
    firstName: {
      label: "Prénom",
      placeholder: "Ex : Marie",
      required: true,
    },
    lastName: {
      label: "Nom",
      placeholder: "TANJAMA",
      required: true,
    },
    nickname: {
      label: "Surnom",
      placeholder: "Ex : Mimi",
      required: false,
      helpText: "",
    },
    birthYear: {
      label: "Année de naissance",
      placeholder: "Ex : 1987",
      required: false,
      helpText: "",
    },
    phone: {
      label: "Téléphone",
      placeholder: "Ex : 0692...",
    },
    email: {
      label: "Email",
      placeholder: "Ex : toi@email.com",
    },
    messenger: {
      label: "Messenger",
      placeholder: "Lien ou identifiant",
    },
    hasWhatsapp: {
      label: "Ce numéro a aussi WhatsApp",
      helpText:
        "Active cette option seulement si le numéro indiqué pour le téléphone peut aussi être utilisé sur WhatsApp.",
    },
    preferredContactChannels: {
      label: "Moyen de contact à privilégier",
      helpText:
        "Choisis au moins un moyen si tu veux être recontacté facilement.",
    },
  },
};

export type { ContactChannel };