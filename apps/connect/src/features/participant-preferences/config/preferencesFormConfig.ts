export type PreferencesFieldConfig = {
  key:
    | "allowFamilyPhotoSharing"
    | "allowNameInFamilyTree"
    | "allowPhotoInFamilyTree"
    | "allowInfoInFamilyTree"
    | "allowCousinsContact"
    | "allowFamilyNews"
    | "allowEventPhotosReceive"
    | "allowFutureEvents";
  label: string;
  helpText?: string;
};

export type PreferencesFormConfig = {
  title: string;
  subtitle: string;
  introTitle: string;
  introText: string;
  sections: {
    key: string;
    title: string;
    fields: PreferencesFieldConfig[];
  }[];
  otherPreferences: {
    label: string;
    placeholder: string;
    helpText?: string;
    maxLength?: number;
  };
};

export const preferencesFormConfig: PreferencesFormConfig = {
  title: "Préférences de communication",
  subtitle:
    "Choisis ce que la famille peut afficher, partager ou t’envoyer.",
  introTitle: "Tu décides",
  introText:
    "Ces préférences te permettent de garder la main sur ce qui peut être utilisé ou affiché à ton sujet dans le cadre de la cousinade et de l’arbre familial.",
  sections: [
    {
      key: "photos",
      title: "Photos",
      fields: [
        {
          key: "allowFamilyPhotoSharing",
          label: "Autoriser le partage des photos où j’apparais avec la famille",
          helpText:
            "Par exemple dans les albums ou retours de la cousinade.",
        },
        {
          key: "allowEventPhotosReceive",
          label: "Recevoir les photos de la cousinade",
          helpText:
            "Pour retrouver les meilleurs moments après la rencontre.",
        },
      ],
    },
    {
      key: "tree",
      title: "Arbre généalogique",
      fields: [
        {
          key: "allowNameInFamilyTree",
          label: "Autoriser l’affichage de mon nom dans l’arbre familial",
        },
        {
          key: "allowPhotoInFamilyTree",
          label: "Autoriser l’affichage de ma photo dans l’arbre familial",
        },
        {
          key: "allowInfoInFamilyTree",
          label: "Autoriser l’affichage de mes informations dans l’arbre familial",
          helpText:
            "Par exemple certaines informations de présentation que tu as choisies de partager.",
        },
      ],
    },
    {
      key: "contact",
      title: "Contact et nouvelles",
      fields: [
        {
          key: "allowCousinsContact",
          label: "Autoriser les cousins à me contacter",
        },
        {
          key: "allowFamilyNews",
          label: "Recevoir des nouvelles de la famille",
        },
        {
          key: "allowFutureEvents",
          label: "Être informé des prochains rassemblements",
        },
      ],
    },
  ],
  otherPreferences: {
    label: "Autre préférence ou remarque",
    placeholder: "Tu peux préciser ici une préférence particulière.",
    helpText:
      "Exemple : préciser un usage que tu autorises ou refuses, ou ajouter une remarque utile.",
    maxLength: 500,
  },
};