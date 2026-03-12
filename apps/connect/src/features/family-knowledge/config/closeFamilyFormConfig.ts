export const closeFamilyFormConfig = {
  pageTitle: "Ta famille proche",
  pageSubtitle: "Parents, fratrie, enfants et conjoint",
  sections: {
    parents: {
      title: "Qui sont tes parents ?",
      subtitle:
        "Même un prénom, un surnom ou une photo peuvent déjà aider.",
      parent1Label: "Parent 1",
      parent2Label: "Parent 2",
    },
    siblings: {
      title: "As-tu des frères et sœurs ?",
      subtitle: "Tu peux ajouter autant de personnes que nécessaire.",
      emptyText: "Aucun frère ou sœur ajouté pour le moment.",
      addLabel: "Ajouter",
      knowsOrderLabel: "Sais-tu ordonner ta fratrie ?",
      knowsOrderHelp:
        "Si oui, tu peux préciser le rang de chaque frère ou sœur.",
      itemLabel: "Frère / sœur",
    },
    children: {
      title: "As-tu des enfants ?",
      subtitle: "Ajoute les informations que tu connais.",
      emptyText: "Aucun enfant ajouté pour le moment.",
      addLabel: "Ajouter",
      itemLabel: "Enfant",
    },
    partner: {
      title: "Es-tu en couple ou marié ?",
      subtitle: "Tu peux aussi choisir de ne rien renseigner.",
      fieldLabel: "Situation",
      partnerLabel: "Conjoint",
    },
    info: {
      title: "Même une information partielle est utile",
      text:
        "Tu pourras revenir plus tard pour compléter ou corriger ce que tu as partagé.",
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
    yesLabel: "Oui",
    noLabel: "Non",
    chooseLabel: "Choisir",
  },
  footer: {
    stepLabel: "Étape 2 sur 6",
    submitLabel: "Enregistrer",
    loadingLabel: "Enregistrement...",
    readyLabel: "Prêt",
  },
  validation: {
    parent1Label: "le parent 1",
    parent2Label: "le parent 2",
    siblingLabel: "le frère ou la sœur",
    childLabel: "l’enfant",
    partnerLabel: "le conjoint",
    missingIdentity:
      "Merci de renseigner au moins un nom ou un prénom pour",
    missingSiblingOrder:
      "Merci de renseigner le rang dans la fratrie pour les frères et sœurs concernés.",
    missingParticipant:
      "Nous n’avons pas retrouvé ton identification. Merci de commencer par te présenter.",
  },
} as const;