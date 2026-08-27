// DictationStatusPanel.tsx
// Barre de statut de la dictée : jauge de niveau micro pendant
// l'enregistrement (preuve que le micro capte), indicateur de transcription
// en cours, et message d'erreur avec bouton "réessayer" en cas d'échec —
// jamais d'échec silencieux.

import { Mic, AlertTriangle, Loader2, RotateCcw, Cpu } from 'lucide-react'
import type { DictationServiceInfo, DictationStatus } from './dictation.types'

type Props = {
  status: DictationStatus
  micLevel: number
  error: string | null
  serviceInfo: DictationServiceInfo | null
  onRetry: () => void
}

export function DictationStatusPanel({ status, micLevel, error, serviceInfo, onRetry }: Props) {
  if (status === 'idle' && !error) return null

  return (
    <div className="px-4 py-2.5 border-b border-gray-100 bg-indigo-50/40 flex items-center gap-3 flex-wrap text-xs">
      {status === 'recording' && (
        <span className="flex items-center gap-1.5 text-indigo-700 font-medium">
          <Mic className="w-3.5 h-3.5" />
          Enregistrement…
          <span className="inline-flex items-end gap-0.5 h-3.5 ml-0.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-0.5 bg-indigo-500 rounded-full transition-all"
                style={{ height: `${Math.min(100, Math.max(15, micLevel * 100 * (1 + i * 0.4)))}%` }}
              />
            ))}
          </span>
        </span>
      )}

      {status === 'transcribing' && (
        <span className="flex items-center gap-1.5 text-gray-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Transcription en cours…
        </span>
      )}

      {serviceInfo && (status === 'recording' || status === 'transcribing') && (
        <span className="flex items-center gap-1 text-gray-400" title={serviceInfo.modelId}>
          <Cpu className="w-3 h-3" />
          {serviceInfo.device === 'cuda' ? 'GPU' : 'CPU'}
        </span>
      )}

      {status === 'error' && error && (
        <span className="flex items-center gap-1.5 text-rose-600">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
          <button
            onClick={onRetry}
            className="flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700 hover:bg-rose-100 transition-colors ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            Réessayer
          </button>
        </span>
      )}
    </div>
  )
}
