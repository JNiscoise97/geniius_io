export const familyMemoryFormConfig = {
  pageTitle: "La mémoire familiale",
  pageSubtitle: "Souvenirs, anecdotes et photos de famille",
  sections: {
    storyTellers: {
      title:
        "Y a-t-il quelqu’un dans la famille qui racontait souvent l’histoire de la famille ?",
      subtitle:
        "Ajoute les personnes dont tu te souviens, même si tu n’as que peu d’informations.",
      addLabel: "Ajouter",
      emptyText: "Aucune personne ajoutée pour le moment.",
      itemLabel: "Personne",
    },
    anecdote: {
      title: "As-tu un souvenir ou une anecdote de famille à partager ?",
      subtitle:
        "Quelques lignes suffisent. Un petit souvenir peut déjà être très précieux.",
      fieldLabel: "Ton souvenir ou ton anecdote",
      placeholder:
        "Ex : un repas de famille, une histoire souvent racontée, une habitude, un souvenir d’enfance…",
      maxLength: 3000,
    },
    photos: {
      title: "As-tu des photos de famille ?",
      subtitle:
        "Tu peux simplement l’indiquer ici pour le moment, même sans les envoyer tout de suite.",
      hasPhotosLabel: "As-tu des photos de famille ?",
      noteLabel: "Précision",
      notePlaceholder:
        "Ex : photos papier, album ancien, quelques photos sur téléphone, photos d’un mariage…",
    },
    info: {
      title: "Les souvenirs comptent autant que les documents",
      text:
        "Même si tu n’as qu’un détail, une anecdote ou le souvenir d’une personne qui racontait souvent l’histoire familiale, cela peut être précieux pour la famille.",
    },
  },
  fields: {
    firstNameLabel: "Prénom",
    lastNameLabel: "Nom",
    relationshipLabel: "Quel lien avec toi ?",
    relationshipPlaceholder: "Ex : grand-mère, tante, cousin...",
    hasPhotosChooseLabel: "Choisir",
    yesLabel: "Oui",
    noLabel: "Non",
  },
  footer: {
    submitLabel: "Enregistrer",
    loadingLabel: "Enregistrement...",
  },
  validation: {
    missingParticipant:
      "Nous n’avons pas retrouvé ton identification. Merci de commencer par te présenter.",
    missingStoryTellerIdentity:
      "Merci de renseigner au moins un nom ou un prénom pour chaque personne ajoutée.",
    missingStoryTellerRelationship:
      "Merci de préciser le lien avec toi pour chaque personne ajoutée.",
  },
} as const;