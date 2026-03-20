export type ConsentsFieldKey =
  | "allowFamilyPhotoSharing"
  | "allowPhotoDisplayInApp"
  | "allowEventPhotoMemory"
  | "allowNameInFamilyTree"
  | "allowPhotoInFamilyTree"
  | "allowInfoInFamilyTree"
  | "allowContactDetailsWithFamily"
  | "allowFutureFamilyContact"
  | "allowGenealogyEnrichment"
  | "allowGenealogyContributionStorage"
  | "allowNameInEventActivities"
  | "allowParticipationInGames";

export type ConsentsFieldConfig = {
  key: ConsentsFieldKey;
  label: string;
  helpText?: string;
  acceptLabel?: string;
  acceptHelpText?: string;
  refuseLabel?: string;
  refuseHelpText?: string;
};

export type ConsentsFormConfig = {
  title: string;
  subtitle: string;
  introTitle: string;
  introText: string;
  sections: {
    key: string;
    title: string;
    description?: string;
    fields: ConsentsFieldConfig[];
  }[];
  otherPreferences: {
    label: string;
    placeholder: string;
    helpText?: string;
    maxLength?: number;
  };
};

export const preferencesFormConfig: ConsentsFormConfig = {
  title: "Consentements et partage",
  subtitle:
    "Choisis clairement ce que la famille peut voir, afficher ou réutiliser à ton sujet.",
  introTitle: "Tu choisis pour chaque point",
  introText:
    "Pour chaque usage, tu peux répondre oui ou non. Tant que tu n’as pas choisi, rien n’est considéré comme accepté.",
  sections: [
    {
      key: "tree",
      title: "Arbre généalogique",
      description:
        "Ces choix concernent ce que les membres connectés de la famille peuvent voir dans l’arbre.",
      fields: [
        {
          key: "allowNameInFamilyTree",
          label: "Afficher mon nom dans l’arbre familial",
          helpText:
            "Ton nom pourra être visible par les membres connectés de la famille.",
          acceptLabel: "Oui, j’accepte",
          acceptHelpText: "Mon nom pourra apparaître dans l’arbre familial.",
          refuseLabel: "Non, je préfère ne pas l’afficher",
          refuseHelpText: "Mon nom ne sera pas affiché dans l’arbre familial.",
        },
        {
          key: "allowPhotoInFamilyTree",
          label: "Afficher ma photo dans l’arbre familial",
          helpText:
            "Ta photo pourra être visible dans l’arbre si elle est renseignée.",
          acceptLabel: "Oui, j’accepte",
          acceptHelpText: "Ma photo pourra apparaître dans l’arbre familial.",
          refuseLabel: "Non, je préfère ne pas l’afficher",
          refuseHelpText: "Ma photo ne sera pas affichée dans l’arbre familial.",
        },
        {
          key: "allowInfoInFamilyTree",
          label: "Afficher mes informations dans l’arbre familial",
          helpText:
            "Par exemple certaines informations de présentation que tu as choisi de partager.",
          acceptLabel: "Oui, j’accepte",
          acceptHelpText:
            "Mes informations de présentation pourront apparaître dans l’arbre familial.",
          refuseLabel: "Non, je préfère ne pas les afficher",
          refuseHelpText:
            "Mes informations de présentation ne seront pas affichées dans l’arbre familial.",
        },
      ],
    },
    {
      key: "photos",
      title: "Photos et médias",
      description:
        "Ces choix concernent les photos de la cousinade et leur réutilisation dans l’application ou les souvenirs familiaux.",
      fields: [
        {
          key: "allowFamilyPhotoSharing",
          label: "Partager avec la famille les photos où j’apparais",
          helpText:
            "Par exemple dans un album partagé ou dans les retours de la cousinade.",
          acceptLabel: "Oui, j’accepte",
          acceptHelpText:
            "Les photos où j’apparais pourront être partagées avec la famille.",
          refuseLabel: "Non, je préfère refuser",
          refuseHelpText:
            "Les photos où j’apparais ne devront pas être partagées dans ce cadre.",
        },
        {
          key: "allowPhotoDisplayInApp",
          label: "Afficher dans l’application les photos où j’apparais",
          helpText:
            "Cela concerne l’affichage dans l’espace cousinade ou dans des contenus visibles aux membres connectés.",
          acceptLabel: "Oui, j’accepte",
          acceptHelpText:
            "Les photos où j’apparais pourront être affichées dans l’application.",
          refuseLabel: "Non, je préfère refuser",
          refuseHelpText:
            "Les photos où j’apparais ne seront pas affichées dans l’application.",
        },
        {
          key: "allowEventPhotoMemory",
          label: "Utiliser les photos de l’événement dans les souvenirs familiaux",
          helpText:
            "Par exemple dans un album souvenir, une galerie ou un récapitulatif familial.",
          acceptLabel: "Oui, j’accepte",
          acceptHelpText:
            "Les photos de l’événement pourront être réutilisées dans les souvenirs familiaux.",
          refuseLabel: "Non, je préfère refuser",
          refuseHelpText:
            "Les photos de l’événement ne devront pas être réutilisées dans les souvenirs familiaux.",
        },
      ],
    },
    {
      key: "contact",
      title: "Contact et communication",
      description:
        "Ces choix concernent la manière dont la famille ou les organisateurs peuvent te joindre.",
      fields: [
        {
          key: "allowContactDetailsWithFamily",
          label: "Afficher mes coordonnées aux membres de la famille",
          helpText:
            "Tes coordonnées pourront être visibles par les membres connectés selon les usages prévus dans l’application.",
          acceptLabel: "Oui, j’accepte",
          acceptHelpText:
            "Mes coordonnées pourront être partagées avec les membres de la famille.",
          refuseLabel: "Non, je préfère refuser",
          refuseHelpText:
            "Mes coordonnées ne seront pas affichées aux membres de la famille.",
        },
        {
          key: "allowFutureFamilyContact",
          label: "Être contacté pour de futurs événements familiaux",
          helpText:
            "Cela permet aux organisateurs de te recontacter plus tard pour d’autres initiatives familiales.",
          acceptLabel: "Oui, j’accepte",
          acceptHelpText:
            "Les organisateurs pourront me recontacter pour de futurs événements familiaux.",
          refuseLabel: "Non, je préfère refuser",
          refuseHelpText:
            "Je ne souhaite pas être recontacté pour de futurs événements familiaux.",
        },
      ],
    },
    {
      key: "genealogy",
      title: "Contribution au projet familial",
      description:
        "Ces choix concernent l’usage de tes informations dans le travail généalogique et la mémoire familiale.",
      fields: [
        {
          key: "allowGenealogyEnrichment",
          label: "Utiliser mes informations pour enrichir l’arbre généalogique",
          helpText:
            "Cela concerne l’usage de tes informations pour compléter les liens familiaux et améliorer la qualité de l’arbre.",
          acceptLabel: "Oui, j’accepte",
          acceptHelpText:
            "Mes informations pourront être utilisées pour enrichir l’arbre généalogique.",
          refuseLabel: "Non, je préfère refuser",
          refuseHelpText:
            "Mes informations ne devront pas être utilisées pour enrichir l’arbre généalogique.",
        },
        {
          key: "allowGenealogyContributionStorage",
          label: "Conserver mes contributions généalogiques",
          helpText:
            "Cela concerne les informations, corrections ou éléments que tu apportes au projet familial.",
          acceptLabel: "Oui, j’accepte",
          acceptHelpText:
            "Mes contributions généalogiques pourront être conservées dans le projet familial.",
          refuseLabel: "Non, je préfère refuser",
          refuseHelpText:
            "Mes contributions généalogiques ne devront pas être conservées.",
        },
      ],
    },
    {
      key: "app",
      title: "Utilisation dans l’application",
      description:
        "Ces choix concernent ta visibilité dans les écrans d’animation de la cousinade.",
      fields: [
        {
          key: "allowNameInEventActivities",
          label: "Afficher mon nom dans les activités de la cousinade",
          helpText:
            "Par exemple dans certains écrans d’activité, de participation ou de suivi.",
          acceptLabel: "Oui, j’accepte",
          acceptHelpText:
            "Mon nom pourra apparaître dans les activités de la cousinade.",
          refuseLabel: "Non, je préfère refuser",
          refuseHelpText:
            "Mon nom ne sera pas affiché dans les activités de la cousinade.",
        },
        {
          key: "allowParticipationInGames",
          label: "Afficher ma participation dans les jeux ou animations",
          helpText:
            "Cela concerne les écrans ou contenus liés aux jeux, défis ou animations de l’événement.",
          acceptLabel: "Oui, j’accepte",
          acceptHelpText:
            "Ma participation pourra apparaître dans les jeux ou animations.",
          refuseLabel: "Non, je préfère refuser",
          refuseHelpText:
            "Ma participation ne sera pas affichée dans les jeux ou animations.",
        },
      ],
    },
  ],
  otherPreferences: {
    label: "Autre préférence ou remarque",
    placeholder:
      "Tu peux préciser ici une préférence particulière ou ajouter une remarque utile.",
    helpText:
      "Exemple : un usage que tu acceptes sous condition, un point à éviter, ou une précision utile pour les organisateurs.",
    maxLength: 500,
  },
};