export type OrganizerMessageTopic =
  | "practical"
  | "attendance"
  | "transport"
  | "family"
  | "photos"
  | "other";

export type ReplyPreference =
  | "email"
  | "phone"
  | "whatsapp"
  | "messenger"
  | "any";

export type TopicOption = {
  key: OrganizerMessageTopic;
  label: string;
};

export type ReplyPreferenceOption = {
  key: ReplyPreference;
  label: string;
};

export type ContactOrganizerFormConfig = {
  title: string;
  subtitle: string;
  introTitle: string;
  introText: string;
  topicOptions: TopicOption[];
  replyPreferenceOptions: ReplyPreferenceOption[];
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
    replyPreference: {
      label: string;
      helpText?: string;
    };
    email: {
      label: string;
      placeholder: string;
    };
    phone: {
      label: string;
      placeholder: string;
    };
    whatsapp: {
      label: string;
      placeholder: string;
    };
    messenger: {
      label: string;
      placeholder: string;
    };
  };
};

export const contactOrganizerFormConfig: ContactOrganizerFormConfig = {
  title: "Contacter l’organisateur",
  subtitle: "Une question pratique ou un besoin particulier ? Écris-nous ici.",
  introTitle: "Un message simple suffit",
  introText:
    "Ton message sera transmis à l’organisateur. Si tu souhaites être recontacté, indique simplement le moyen qui te convient le mieux.",
  topicOptions: [
    { key: "practical", label: "Question pratique" },
    { key: "attendance", label: "Participation / présence" },
    { key: "transport", label: "Transport / accès" },
    { key: "family", label: "Famille / arbre" },
    { key: "photos", label: "Photos / autorisations" },
    { key: "other", label: "Autre" },
  ],
  replyPreferenceOptions: [
    { key: "email", label: "Email" },
    { key: "phone", label: "Téléphone" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "messenger", label: "Messenger" },
    { key: "any", label: "Peu importe" },
  ],
  fields: {
    topic: {
      label: "À propos de quoi écris-tu ?",
      helpText: "Choisis le sujet qui se rapproche le plus de ta demande.",
    },
    message: {
      label: "Ton message",
      placeholder: "Écris ton message ici.",
      helpText: "Tu peux poser une question, signaler un besoin ou donner une précision utile.",
      maxLength: 1000,
    },
    wantsReply: {
      label: "Souhaites-tu être recontacté ?",
      helpText: "Si oui, indique le moyen qui te convient le mieux.",
    },
    replyPreference: {
      label: "Moyen de contact préféré",
      helpText: "Choisis le moyen le plus simple pour toi.",
    },
    email: {
      label: "Adresse email",
      placeholder: "Ex : toi@email.com",
    },
    phone: {
      label: "Téléphone",
      placeholder: "Ex : 06 12 34 56 78",
    },
    whatsapp: {
      label: "WhatsApp",
      placeholder: "Ex : 06 12 34 56 78",
    },
    messenger: {
      label: "Messenger",
      placeholder: "Ex : prénom.nom",
    },
  },
};