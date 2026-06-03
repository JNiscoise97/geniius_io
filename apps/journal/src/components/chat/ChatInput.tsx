import { useState, useRef } from 'react'
import { SendIcon, MicIcon } from 'lucide-react'

interface Props {
  onSend: (message: string) => Promise<void>
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleSend() {
    const msg = value.trim()
    if (!msg || disabled) return
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await onSend(msg)
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`
    }
  }

  return (
    <div className="border-t border-slate-100 bg-white px-4 py-3">
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-teal-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "L'agent réfléchit…" : 'Votre réponse… (Entrée pour envoyer)'}
          disabled={disabled}
          className="max-h-40 flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-60"
        />
        <div className="flex shrink-0 items-center gap-1 pb-0.5">
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Enregistrement vocal (bientôt disponible)"
            disabled
          >
            <MicIcon size={18} />
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="rounded-xl bg-teal-600 p-2 text-white hover:bg-teal-700 disabled:opacity-40"
          >
            <SendIcon size={16} />
          </button>
        </div>
      </div>
      <p className="mt-1.5 text-center text-xs text-slate-400">
        Maj+Entrée pour sauter une ligne
      </p>
    </div>
  )
}
