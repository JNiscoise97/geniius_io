// dictation.types.ts
// Types éphémères, client-only, pour la dictée vocale (un seul enregistrement
// complet par session, envoyé une fois à l'arrêt — pas de segmentation).

export type DictationStatus = 'idle' | 'recording' | 'transcribing' | 'error'

export type DictationServiceInfo = {
  device: 'cuda' | 'cpu' | string
  computeType: string
  modelId: string
}
