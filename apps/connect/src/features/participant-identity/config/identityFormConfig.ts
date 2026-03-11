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
    branches: {
      label: string;
      helpText?: string;
      options: IdentityOption[];
    };
    previousEditions: {
      label: string;
      helpText?: string;
      options: IdentityOption[];
    };
  };
};

export const identityFormConfig: IdentityFormConfig = {
  title: "Se présenter à la famille",
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
      placeholder: "Nom de famille",
      required: true,
    },
    nickname: {
      label: "Surnom",
      placeholder: "Ex : Mimi",
      required: false,
      helpText:
        "Si certains cousins te connaissent sous un surnom ou un prénom familial, tu peux l’indiquer ici.",
    },
    birthYear: {
      label: "Année de naissance",
      placeholder: "Ex : 1987",
      required: false,
      helpText: "Cela aide à mieux situer les générations dans la famille.",
    },
    branches: {
      label: "Branche familiale (si tu la connais)",
      helpText:
        "Cela aide à comprendre plus facilement les liens entre les différentes branches.",
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
  },
};
