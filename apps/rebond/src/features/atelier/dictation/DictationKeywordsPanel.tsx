// DictationKeywordsPanel.tsx
// Mots-clés utilisés pour biaiser la reconnaissance de la dictée (voir
// dictationPrompt.ts) : ceux détectés automatiquement (titre du document,
// dépôt, entités déjà connues — lecture seule) et ceux ajoutés manuellement
// (noms propres attendus mais pas encore repérés par l'app), retirables.

import { useState } from 'react'
import { X, Plus } from 'lucide-react'

type Props = {
  autoKeywords: string[]
  customKeywords: string[]
  onAdd: (keyword: string) => void
  onRemove: (keyword: string) => void
}

export function DictationKeywordsPanel({ autoKeywords, customKeywords, onAdd, onRemove }: Props) {
  const [draft, setDraft] = useState('')

  function submit() {
    const value = draft.trim()
    if (!value) return
    onAdd(value)
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 flex-wrap text-xs">
        {autoKeywords.map(kw => (
          <span key={kw} className="rounded-md bg-gray-100 text-gray-600 px-2 py-0.5" title="Détecté automatiquement">
            {kw}
          </span>
        ))}
        {customKeywords.map(kw => (
          <span key={kw} className="flex items-center gap-1 rounded-md bg-indigo-100 text-indigo-700 px-2 py-0.5">
            {kw}
            <button onClick={() => onRemove(kw)} title="Retirer" className="hover:text-indigo-900">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {autoKeywords.length === 0 && customKeywords.length === 0 && (
          <span className="text-gray-300 italic">aucun pour l'instant</span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
          placeholder="Ajouter un nom (personne, lieu…)"
          className="text-xs border border-gray-200 rounded-md px-2 py-1 flex-1 min-w-[160px] focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <button
          onClick={submit}
          className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Ajouter
        </button>
      </div>
    </div>
  )
}
