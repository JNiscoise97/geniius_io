export type ProfileQuestionConfig = {
  key:
    | "city"
    | "occupation"
    | "interests"
    | "personality_word"
    | "family_memory"
    | "cousinade_expectation"
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
        "Cette information permet aux cousins de mieux situer d’où tu viens aujourd’hui.",
      type: "text",
      placeholder: "Ex : Montpellier",
      maxLength: 120,
    },
    {
      key: "occupation",
      label: "Que fais-tu dans la vie ?",
      helpText:
        "Travail, études, activité du moment… en quelques mots seulement.",
      type: "text",
      placeholder: "Ex : infirmière, étudiant, artisan…",
      maxLength: 160,
    },
    {
      key: "interests",
      label: "Qu’aimes-tu particulièrement ?",
      helpText:
        "Tes centres d’intérêt, passions ou petits plaisirs du quotidien.",
      type: "text",
      placeholder: "Ex : cuisine, randonnée, musique, généalogie…",
      maxLength: 200,
    },
    {
      key: "personality_word",
      label: "Quel mot te décrit le mieux ?",
      helpText:
        "Un mot simple pour donner une petite idée de ta personnalité.",
      type: "text",
      placeholder: "Ex : calme, curieux, sociable…",
      maxLength: 80,
    },
    {
      key: "family_memory",
      label: "Quel souvenir ou quelle image te vient quand tu penses à la famille ?",
      helpText:
        "Une ambiance, un moment, une personne, un lieu… ce qui te vient spontanément.",
      type: "textarea",
      placeholder: "Quelques lignes si tu le souhaites…",
      maxLength: 600,
    },
    {
      key: "cousinade_expectation",
      label: "Qu’aimerais-tu retrouver ou découvrir pendant la cousinade ?",
      helpText:
        "Par exemple : rencontrer des cousins, mieux comprendre l’histoire familiale, partager un moment…",
      type: "textarea",
      placeholder: "Quelques lignes si tu le souhaites…",
      maxLength: 600,
    },
    {
      key: "free_share",
      label: "Y a-t-il quelque chose que tu aimerais partager sur toi ?",
      helpText:
        "Quelques mots si tu souhaites ajouter une information qui te ressemble.",
      type: "textarea",
      placeholder: "Facultatif",
      maxLength: 600,
    },
  ],
};