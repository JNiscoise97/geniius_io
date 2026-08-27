// dictationPrompt.ts
// Construit le "initial_prompt" envoyé au service de transcription pour
// biaiser la reconnaissance vers les noms propres attendus dans ce document
// (patronymes, communes) plutôt que leur sosie phonétique le plus courant —
// Whisper n'a par défaut aucune idée du contexte du document en cours.

export function buildDictationPrompt(params: {
  documentTitre?: string | null
  depotLabel?: string | null
  entityLabels?: string[]
  customKeywords?: string[]
}): string {
  const parts: string[] = []
  if (params.documentTitre) parts.push(params.documentTitre)
  if (params.depotLabel) parts.push(params.depotLabel)
  // Dédoublonné et borné — le serveur tronque aussi par sécurité, mais
  // autant ne pas construire un prompt inutilement énorme côté client.
  const names = [...(params.entityLabels ?? []), ...(params.customKeywords ?? [])]
  if (names.length > 0) {
    const unique = Array.from(new Set(names)).slice(0, 40)
    parts.push(unique.join(', '))
  }
  return parts.join('. ')
}
