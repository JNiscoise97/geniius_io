export const announcementEmailConfig = {
  pageTitle: "Annonce email",
  pageSubtitle:
    "Écris un message et choisis à quels participants l’envoyer.",
  subjectPlaceholder:
    "Ex. Nouvelle fonctionnalité disponible dans l’application",
  messagePlaceholder:
    "Bonjour,\n\nJe vous écris pour vous annoncer qu’une nouvelle fonctionnalité est disponible...\n\nÀ bientôt",
  helpText:
    "Variables disponibles dans le message : {{firstName}}, {{lastName}}, {{displayName}}",
  maxBatchSize: 100,
} as const;