export const currentLinksFormConfig = {
  pageTitle: "La famille aujourd’hui",
  pageSubtitle: "Les personnes de la famille avec qui tu es en contact",
  section: {
    title: "Avec quelles personnes de la famille es-tu en contact aujourd’hui ?",
    subtitle:
      "",
    addLabel: "Ajouter",
    emptyText: "Aucune personne ajoutée pour le moment.",
    itemLabel: "Personne",
  },
  fields: {
    firstNameLabel: "Prénom",
    lastNameLabel: "Nom",
    relationshipTypeLabel: "Lien avec toi",
    relationshipTypeOtherLabel: "Précision sur le lien",
    relationshipTypeOtherPlaceholder: "Ex : cousine éloignée, belle-tante...",
    hasPhotoLabel: "As-tu une photo ?",
    chooseLabel: "Choisir",
    yesLabel: "Oui",
    noLabel: "Non",
  },
  info: {
    title: "Ces liens sont précieux",
    text:
      "Même quelques contacts actuels peuvent aider à mieux comprendre comment la famille est reliée aujourd’hui.",
  },
  footer: {
    submitLabel: "Enregistrer",
    loadingLabel: "Enregistrement...",
  },
  validation: {
    missingParticipant:
      "Nous n’avons pas retrouvé ton identification. Merci de commencer par te présenter.",
    missingIdentity:
      "Merci de renseigner au moins un nom ou un prénom pour chaque personne ajoutée.",
    missingRelationship:
      "Merci de préciser le lien avec toi pour chaque personne ajoutée.",
    missingOtherRelationship:
      "Merci de préciser le lien lorsque tu choisis “Autre”.",
  },
} as const;