import type { ContactChannel } from "../../participant-access/components/ContactChannelCheckboxGroup";

export type OrganizerMessageTopic =
  | "practical"
  | "attendance"
  | "transport"
  | "family"
  | "photos"
  | "other";

export type TopicOption = {
  key: OrganizerMessageTopic;
  label: string;
};

export type ContactOrganizerFormConfig = {
  title: string;
  subtitle: string;
  introTitle: string;
  introText: string;
  topicOptions: TopicOption[];
  fields: {
    topic: {
      label: string;
      helpText?: string;
    };
    message: {
      label: string;
      placeholder: string;
      helpText?: string;
      maxLength?: number;
    };
    wantsReply: {
      label: string;
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
    preferredContactChannels: {
      label: string;
      helpText?: string;
    };
    hasWhatsapp: {
      label: string;
      helpText?: string;
    };
  };
};

export const contactOrganizerFormConfig: ContactOrganizerFormConfig = {
  title: "Contacter l’organisateur",
  subtitle: "Une question pratique ou un besoin particulier ?",
  introTitle: "Un message simple suffit",
  introText:
    "Ton message sera transmis à l’organisateur. Si tu souhaites être recontacté, choisis simplement le moyen qui te convient.",
  topicOptions: [
    { key: "practical", label: "Question pratique" },
    { key: "attendance", label: "Participation / présence" },
    { key: "transport", label: "Transport / accès" },
    { key: "family", label: "Famille / arbre" },
    { key: "photos", label: "Photos / autorisations" },
    { key: "other", label: "Autre" },
  ],
  fields: {
    topic: {
      label: "À propos de quoi écris-tu ?",
      helpText: "Choisis le sujet le plus proche de ta demande.",
    },
    message: {
      label: "Ton message",
      placeholder: "Écris ton message ici.",
      helpText:
        "Tu peux poser une question, signaler un besoin ou donner une précision utile.",
      maxLength: 1000,
    },
    wantsReply: {
      label: "Souhaites-tu être recontacté ?",
      helpText: "Si oui, indique au moins un contact et choisis ton moyen préféré.",
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
    preferredContactChannels: {
      label: "Moyen de contact préféré",
      helpText: "Choisis au moins un moyen qui te convient.",
    },
    hasWhatsapp: {
      label: "Ce numéro a aussi WhatsApp",
      helpText:
        "Active cette option seulement si le numéro indiqué pour le téléphone peut aussi être utilisé sur WhatsApp.",
    },
  },
};

export type { ContactChannel };