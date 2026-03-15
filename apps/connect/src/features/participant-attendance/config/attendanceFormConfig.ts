export type AttendanceOption = {
  key: "yes" | "no" | "maybe" | "definitive-no";
  label: string;
};

export type HelpOption = {
  key: "setup" | "welcome" | "animation" | "cleanup" | "unknown" | "other";
  label: string;
};

export type AttendanceFormConfig = {
  title: string;
  subtitle: string;
  introTitle: string;
  introText: string;
  attendanceOptions: AttendanceOption[];
  helpOptions: HelpOption[];
  fields: {
    attendanceStatus: {
      label: string;
      helpText?: string;
    };
    partySize: {
      label: string;
      placeholder: string;
      helpText?: string;
    };
    canHelp: {
      label: string;
      helpText?: string;
    };
    helpTypes: {
      label: string;
      helpText?: string;
    };
    note: {
      label: string;
      placeholder: string;
      helpText?: string;
      maxLength?: number;
    };
  };
};

export const attendanceFormConfig: AttendanceFormConfig = {
  title: "Ma participation",
  subtitle: "Dis-nous simplement si tu prévois de venir à la cousinade.",
  introTitle: "Répondre ne t’engage pas",
  introText:
    "Ta réponse nous aide à mieux préparer la journée.",
  attendanceOptions: [
    { key: "yes", label: "Oui, je serai présent" },
    { key: "no", label: "Non, je ne pourrai pas venir" },
    { key: "maybe", label: "Je ne sais pas encore" },
    { key: "definitive-no", label: "Je ne veux pas venir" },
  ],
  helpOptions: [
    { key: "setup", label: "Installation" },
    { key: "welcome", label: "Accueil" },
    { key: "animation", label: "Animation" },
    { key: "cleanup", label: "Rangement" },
    { key: "unknown", label: "Je ne sais pas encore" },
    { key: "other", label: "Autre" },
  ],
  fields: {
    attendanceStatus: {
      label: "Prévois-tu de venir ?",
      helpText: "Tu pourras modifier ta réponse plus tard si besoin.",
    },
    partySize: {
      label: "Combien serez-vous ?",
      placeholder: "Ex : 2",
      helpText: "Indique le nombre total de personnes prévues.",
    },
    canHelp: {
      label: "Souhaites-tu donner un coup de main ?",
      helpText: "Toute aide est la bienvenue, même ponctuelle.",
    },
    helpTypes: {
      label: "Sur quoi pourrais-tu aider ?",
      helpText: "Choisis ce qui te conviendrait le mieux.",
    },
    note: {
      label: "Un mot pour l’organisation",
      placeholder: "Tu peux préciser ici une information utile.",
      helpText:
        "Par exemple une contrainte, une précision ou une question.",
      maxLength: 400,
    },
  },
};