export type ProfileQuestionConfig = {
  key:
    | "city"
    | "occupation"
    | "interests"
    | "family_memory"
    | "free_share";
  label: string;
  helpText?: string;
  type: "text" | "textarea";
  placeholder?: string;
  maxLength?: number;
};

export type ProfileFormConfig = {
  title: string;
  subtitle: string;
  introTitle: string;
  introText: string;
  questions: ProfileQuestionConfig[];
};

export const profileQuestionsConfig: ProfileFormConfig = {
  title: "Apprendre à mieux te connaître",
  subtitle:
    "Ces informations pourront apparaître sur ton profil dans l’application.",
  introTitle: "Seulement ce que tu souhaites partager",
  introText:
    "Ces réponses permettent aux cousins d’en savoir un peu plus sur toi et de créer plus facilement du lien. Tu peux répondre seulement à ce que tu souhaites partager.",
  questions: [
    {
      key: "city",
      label: "Où vis-tu aujourd’hui ?",
      helpText:
        "",
      type: "textarea",
      placeholder: "Ex : Montpellier",
      maxLength: 120,
    },
    {
      key: "occupation",
      label: "Que fais-tu dans la vie ?",
      helpText:
        "Travail, études, activité du moment… en quelques mots seulement.",
      type: "textarea",
      placeholder: "Ex : infirmière, étudiant, artisan…",
      maxLength: 600,
    },
    {
      key: "interests",
      label: "Qu’aimes-tu particulièrement ?",
      helpText:
        "Tes centres d’intérêt, passions ou petits plaisirs du quotidien.",
      type: "textarea",
      placeholder: "Ex : cuisine, randonnée, musique, généalogie…",
      maxLength: 600,
    },
    {
      key: "free_share",
      label: "Y a-t-il quelque chose que tu aimerais partager sur toi ?",
      helpText:
        "Quelques mots si tu souhaites ajouter une information qui te ressemble.",
      type: "textarea",
      placeholder: "",
      maxLength: 600,
    },
  ],
};