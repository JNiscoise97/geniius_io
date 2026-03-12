export const grandparentsFormConfig = {
  pageTitle: "Tes grands-parents",
  pageSubtitle: "Grands-parents, oncles et tantes",
  sections: {
    grandparents: {
      title: "Tes grands-parents",
      subtitle: "Même un prénom, un surnom ou une photo peuvent déjà aider.",
      paternalGrandfatherLabel: "Grand-père paternel",
      paternalGrandmotherLabel: "Grand-mère paternelle",
      maternalGrandfatherLabel: "Grand-père maternel",
      maternalGrandmotherLabel: "Grand-mère maternelle",
    },
    paternalAuntsUncles: {
      title: "Oncles et tantes paternels",
      subtitle:
        "Ajoute les frères et sœurs de ton père, même si tu n’as que peu d’informations.",
      addLabel: "Ajouter",
      emptyText: "Aucun oncle ou tante paternel(le) ajouté(e) pour le moment.",
      itemLabel: "Oncle / tante paternel(le)",
      knowsOrderLabel: "Sais-tu ordonner la fratrie de ton père ?",
      knowsOrderHelp:
        "Si oui, tu peux préciser le rang de chaque oncle ou tante.",
    },
    maternalAuntsUncles: {
      title: "Oncles et tantes maternels",
      subtitle:
        "Ajoute les frères et sœurs de ta mère, même si tu n’as que peu d’informations.",
      addLabel: "Ajouter",
      emptyText: "Aucun oncle ou tante maternel(le) ajouté(e) pour le moment.",
      itemLabel: "Oncle / tante maternel(le)",
      knowsOrderLabel: "Sais-tu ordonner la fratrie de ta mère ?",
      knowsOrderHelp:
        "Si oui, tu peux préciser le rang de chaque oncle ou tante.",
    },
    info: {
      title: "Les générations précédentes éclairent souvent le reste",
      text:
        "Même un détail sur un grand-parent, un oncle ou une tante peut aider à reconstituer les liens familiaux.",
    },
  },
  personFields: {
    knownLabel: "Personne connue",
    knownHelp: "Décoche si tu ne connais pas encore cette personne.",
    firstNameLabel: "Prénom",
    lastNameLabel: "Nom",
    nicknameLabel: "Surnom",
    birthOrderLabel: "Rang dans la fratrie",
    birthOrderPlaceholder: "Ex : 1",
    isAliveLabel: "Toujours en vie ?",
    hasPhotoLabel: "As-tu une photo ?",
    relationshipTypeLabel: "Lien avec les grands-parents",
    yesLabel: "Oui",
    noLabel: "Non",
    chooseLabel: "Choisir",
  },
  footer: {
    stepLabel: "Étape 3 sur 6",
    submitLabel: "Enregistrer",
    loadingLabel: "Enregistrement...",
    readyLabel: "Prêt",
  },
  validation: {
    missingParticipant:
      "Nous n’avons pas retrouvé ton identification. Merci de commencer par te présenter.",
    missingGrandparentIdentity:
      "Merci de renseigner au moins un nom ou un prénom pour chaque grand-parent connu.",
    missingAuntUncleIdentity:
      "Merci de renseigner au moins un nom ou un prénom pour chaque oncle ou tante ajouté(e).",
    missingAuntUncleRelationship:
      "Merci de préciser le lien avec les grands-parents pour chaque oncle ou tante ajouté(e).",
    missingFatherSiblingOrder:
      "Merci de renseigner le rang dans la fratrie pour les oncles et tantes paternels concernés.",
    missingMotherSiblingOrder:
      "Merci de renseigner le rang dans la fratrie pour les oncles et tantes maternels concernés.",
  },
} as const;