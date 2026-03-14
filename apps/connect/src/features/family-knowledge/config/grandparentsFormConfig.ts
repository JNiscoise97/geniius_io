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
      title: "Frères et sœurs de ton père",
      subtitle:
        "Commence par indiquer si ton père avait des frères et sœurs. Tu pourras ensuite ajouter les personnes que tu connais.",
      questionLabel: "Ton père avait-il des frères et sœurs ?",
      addLabel: "Ajouter",
      emptyText: "Aucun oncle ou tante paternel(le) ajouté(e) pour le moment.",
      itemLabel: "Oncle / tante paternel(le)",
      knowsOrderLabel: "Sais-tu ordonner la fratrie de ton père ?",
      knowsOrderHelp:
        "Si oui, tu peux préciser le rang de chaque oncle ou tante.",
    },
    maternalAuntsUncles: {
      title: "Frères et sœurs de ta mère",
      subtitle:
        "Commence par indiquer si ta mère avait des frères et sœurs. Tu pourras ensuite ajouter les personnes que tu connais.",
      questionLabel: "Ta mère avait-elle des frères et sœurs ?",
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
    submitLabel: "Enregistrer",
    loadingLabel: "Enregistrement...",
  },
  validation: {
    missingParticipant:
      "Nous n’avons pas retrouvé ton identification. Merci de commencer par te présenter.",
    missingGrandparentIdentity:
      "Merci de renseigner au moins un nom ou un prénom pour chaque grand-parent connu.",
    missingPaternalAuntsUnclesAnswer:
      "Merci d’indiquer si ton père avait des frères et sœurs.",
    missingMaternalAuntsUnclesAnswer:
      "Merci d’indiquer si ta mère avait des frères et sœurs.",
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