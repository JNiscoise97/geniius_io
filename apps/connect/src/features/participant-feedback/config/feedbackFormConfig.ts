export type FeedbackQuestion =
  | {
      type: "rating";
      key: string;
      label: string;
      hint?: string;
    }
  | {
      type: "boolean";
      key: string;
      label: string;
      hint?: string;
    }
  | {
      type: "text";
      key: string;
      label: string;
      placeholder?: string;
      hint?: string;
      multiline?: boolean;
    }
  | {
      type: "choice";
      key: string;
      label: string;
      hint?: string;
      options: Array<{
        value: string;
        label: string;
      }>;
    };

export type FeedbackAnswers = Record<string, unknown>;

export type FeedbackSection = {
  key: string;
  title: string;
  description?: string;
  questions: FeedbackQuestion[];
  condition?: (answers: FeedbackAnswers) => boolean;
};

export const FEEDBACK_FORM: FeedbackSection[] = [
  {
    key: "global",
    title: "Ton ressenti global",
    questions: [
      {
        type: "rating",
        key: "global_rating",
        label: "Globalement, comment évalues-tu cette cousinade ?",
      },
      {
        type: "text",
        key: "public_comment",
        label: "Ton commentaire public",
        placeholder: "Qu’est-ce que tu as aimé, ou moins aimé ?",
        hint: "Ce commentaire peut être visible par la famille si tu acceptes le partage.",
        multiline: true,
      },
      {
        type: "boolean",
        key: "allow_public_display",
        label: "J’accepte de partager ma note globale et ce commentaire",
      },
    ],
  },
  {
    key: "themes",
    title: "Ton avis sur différents aspects",
    description: "Quelques notes rapides pour nous aider à progresser.",
    questions: [
      { type: "rating", key: "ambiance", label: "Ambiance générale" },
      { type: "rating", key: "organisation", label: "Organisation" },
      { type: "rating", key: "communication", label: "Communication" },
      { type: "rating", key: "lieu", label: "Lieu" },
      { type: "rating", key: "activites", label: "Activités" },
      {
        type: "rating",
        key: "contenus_familiaux",
        label: "Contenus familiaux proposés",
        hint: "Arbre, documents, application, projection…",
      },
    ],
  },
  {
    key: "app_usage",
    title: "L’application",
    questions: [
      {
        type: "choice",
        key: "app_usage_level",
        label: "As-tu utilisé l’application ?",
        options: [
          { value: "beaucoup", label: "Oui, beaucoup" },
          { value: "un_peu", label: "Un peu" },
          { value: "non", label: "Non" },
        ],
      },
    ],
  },
  {
    key: "app_detail",
    title: "Ton expérience avec l’application",
    condition: (answers) => answers.app_usage_level !== "non",
    questions: [
      {
        type: "rating",
        key: "app_rating",
        label: "Comment juges-tu l’application ?",
      },
      {
        type: "text",
        key: "app_best",
        label: "Ce qui t’a le plus plu",
        multiline: true,
      },
      {
        type: "text",
        key: "app_issues",
        label: "Ce qui t’a posé problème",
        multiline: true,
      },
      {
        type: "text",
        key: "app_missing",
        label: "Qu’aurais-tu aimé pouvoir faire ?",
        multiline: true,
      },
    ],
  },
  {
    key: "tree",
    title: "L’arbre généalogique",
    questions: [
      {
        type: "boolean",
        key: "tree_used",
        label: "As-tu exploré l’arbre généalogique ?",
      },
    ],
  },
  {
    key: "tree_detail",
    title: "Ton expérience avec l’arbre",
    condition: (answers) => answers.tree_used === true,
    questions: [
      {
        type: "rating",
        key: "tree_rating",
        label: "Facilité d’utilisation de l’arbre",
      },
      {
        type: "boolean",
        key: "tree_helped",
        label: "L’arbre t’a-t-il aidé à mieux comprendre la famille ?",
      },
      {
        type: "boolean",
        key: "tree_found_self",
        label: "As-tu réussi à te situer dans l’arbre ?",
      },
    ],
  },
  {
    key: "screen",
    title: "L’affichage grand écran",
    questions: [
      {
        type: "boolean",
        key: "screen_seen",
        label: "As-tu vu l’arbre affiché sur grand écran ?",
      },
    ],
  },
  {
    key: "screen_detail",
    title: "Ton ressenti sur le grand écran",
    condition: (answers) => answers.screen_seen === true,
    questions: [
      {
        type: "rating",
        key: "screen_rating",
        label: "Lisibilité et compréhension du grand écran",
      },
      {
        type: "boolean",
        key: "screen_social",
        label: "Est-ce que cela a déclenché des discussions ou découvertes ?",
      },
    ],
  },
  {
    key: "quiz",
    title: "Les quiz",
    questions: [
      {
        type: "boolean",
        key: "quiz_participated",
        label: "As-tu participé aux quiz ?",
      },
    ],
  },
  {
    key: "quiz_detail",
    title: "Ton ressenti sur les quiz",
    condition: (answers) => answers.quiz_participated === true,
    questions: [
      {
        type: "rating",
        key: "quiz_rating",
        label: "Qualité des quiz",
      },
      {
        type: "boolean",
        key: "quiz_learned",
        label: "Les quiz t’ont-ils appris des choses sur la famille ?",
      },
      {
        type: "boolean",
        key: "quiz_motivating",
        label: "Les quiz et cadeaux t’ont-ils donné envie de participer ?",
      },
    ],
  },
  {
    key: "open",
    title: "Pour aller plus loin",
    questions: [
      {
        type: "text",
        key: "best_moment",
        label: "Qu’est-ce qui t’a le plus marqué ?",
        multiline: true,
      },
      {
        type: "text",
        key: "improvements",
        label: "Que faudrait-il améliorer en priorité ?",
        multiline: true,
      },
      {
        type: "text",
        key: "keep",
        label: "Qu’est-ce qu’il faut absolument garder ?",
        multiline: true,
      },
      {
        type: "boolean",
        key: "would_return",
        label: "Reviendrais-tu avec plaisir à une prochaine cousinade ?",
      },
      {
        type: "boolean",
        key: "app_for_other_families",
        label: "Penses-tu que ce type d’application pourrait être utile à d’autres familles ?",
      },
    ],
  },
];