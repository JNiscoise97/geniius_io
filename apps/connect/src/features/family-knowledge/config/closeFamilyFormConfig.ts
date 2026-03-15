export const closeFamilyFormConfig = {
  pageTitle: "Ta famille proche",
  pageSubtitle: "Parents, fratrie, enfants et conjoint",
  sections: {
    parents: {
      title: "Qui sont tes parents ?",
      subtitle:
        "Même un prénom, un surnom ou une photo peuvent déjà aider.",
      parent1Label: "Père",
      parent2Label: "Mère",
    },
    siblings: {
      title: "As-tu des frères et sœurs ?",
      subtitle: "Tu peux ajouter autant de personnes que nécessaire.",
      emptyText: "Aucun frère ou sœur ajouté pour le moment.",
      addLabel: "Ajouter",
      knowsOrderLabel: "Sais-tu ordonner ta fratrie ?",
      knowsOrderHelp:
        "Si oui, tu pourras réorganiser la liste avec des boutons monter / descendre. Ta propre fiche sera ajoutée automatiquement dans l’ordre.",
      orderLabel: "Ordre de la fratrie",
      orderHelp:
        "Déplace les cartes pour représenter l’ordre de naissance. “Toi” est inclus pour te situer parmi tes frères et sœurs.",
      selfLabel: "Toi",
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
    knownLabel: "Je connais son identitié",
    knownHelp: "Décoche si tu ne connais pas encore cette personne.",
    firstNameLabel: "Prénom",
    lastNameLabel: "Nom",
    nicknameLabel: "Surnom",
    isAliveLabel: "Toujours en vie ?",
    hasPhotoLabel: "As-tu une photo ?",
    yesLabel: "Oui",
    noLabel: "Non",
    chooseLabel: "Choisir",
  },
  footer: {
    submitLabel: "Enregistrer",
    loadingLabel: "Enregistrement...",
  },
  validation: {
    parent1Label: "le père",
    parent2Label: "la mère",
    siblingLabel: "le frère ou la sœur",
    childLabel: "l’enfant",
    partnerLabel: "le conjoint",
    missingIdentity:
      "Merci de renseigner au moins un nom ou un prénom pour",
    missingSiblingOrder:
      "Merci d’ordonner la fratrie si tu as coché que tu connais cet ordre.",
    missingParticipant:
      "Nous n’avons pas retrouvé ton identification. Merci de commencer par te présenter.",
  },
} as const;