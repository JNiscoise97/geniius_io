import { useState } from 'react'
import { X } from 'lucide-react'
import type { NewSessionInput, SessionMode } from '../../types/journal'

interface Props {
  onClose: () => void
  onCreate: (input: NewSessionInput) => Promise<void>
}

const MODES: { value: SessionMode; label: string; desc: string }[] = [
  { value: 'thematic', label: 'Thématique', desc: 'Choisir un thème et être guidé par les questions' },
  { value: 'import', label: 'Import audio', desc: 'Transcrire un témoignage existant (WhatsApp, etc.)' },
  { value: 'auto', label: 'Libre', desc: "Parler librement, l'agent suit le fil" },
]

export default function NewSessionModal({ onClose, onCreate }: Props) {
  const [interviewer, setInterviewer] = useState('')
  const [theme, setTheme] = useState('')
  const [mode, setMode] = useState<SessionMode>('thematic')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!interviewer.trim() || !theme.trim()) return
    setLoading(true)
    await onCreate({ interviewer_name: interviewer.trim(), theme: theme.trim(), mode })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Nouvelle session</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Personne interrogée */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Personne interrogée
            </label>
            <input
              type="text"
              placeholder="ex : Grand-mère Lucienne"
              value={interviewer}
              onChange={(e) => setInterviewer(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Thème */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Thème de la session
            </label>
            <input
              type="text"
              placeholder="ex : La famille à Bellemène dans les années 60"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Mode */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Mode</label>
            <div className="space-y-2">
              {MODES.map((m) => (
                <label
                  key={m.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                    mode === m.value
                      ? 'border-teal-400 bg-teal-50'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={m.value}
                    checked={mode === m.value}
                    onChange={() => setMode(m.value)}
                    className="mt-0.5 accent-teal-600"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{m.label}</div>
                    <div className="text-xs text-slate-500">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !interviewer.trim() || !theme.trim()}
              className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Création…' : 'Démarrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
