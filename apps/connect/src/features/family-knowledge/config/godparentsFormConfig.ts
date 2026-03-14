export const godparentsFormConfig = {
  pageTitle: "Les liens de parrainage",
  pageSubtitle: "Parrains, marraines et liens familiaux",
  sections: {
    personalGodparents: {
      title: "Qui sont tes parrains et marraines ?",
      subtitle:
        "Ajoute les personnes que tu connais, même si tu n’as que peu d’informations.",
      addLabel: "Ajouter",
      emptyText: "Aucun parrain ou marraine ajouté pour le moment.",
      itemLabel: "Parrain / marraine",
    },
    parentsGodparents: {
      title: "Connais-tu les parrains et marraines de tes parents ?",
      subtitle:
        "Même un prénom ou une photo peuvent déjà être utiles.",
      fatherGodfatherLabel: "Parrain du père",
      fatherGodmotherLabel: "Marraine du père",
      motherGodfatherLabel: "Parrain de la mère",
      motherGodmotherLabel: "Marraine de la mère",
    },
    info: {
      title: "Les liens de parrainage racontent aussi la famille",
      text:
        "Ils peuvent révéler des proximités, des solidarités ou des liens familiaux qui comptaient beaucoup.",
    },
  },
  personFields: {
    knownLabel: "Personne connue",
    knownHelp: "Décoche si tu ne connais pas encore cette personne.",
    firstNameLabel: "Prénom",
    lastNameLabel: "Nom",
    nicknameLabel: "Surnom",
    isAliveLabel: "Toujours en vie ?",
    hasPhotoLabel: "As-tu une photo ?",
    isFamilyMemberLabel: "Est-ce quelqu’un de la famille ?",
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
    missingPersonalIdentity:
      "Merci de renseigner au moins un nom ou un prénom pour chaque parrain ou marraine ajouté.",
    missingParentGodparentIdentity:
      "Merci de renseigner au moins un nom ou un prénom pour chaque parrain ou marraine connu(e).",
  },
} as const;