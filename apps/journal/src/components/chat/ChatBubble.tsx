import type { JournalMessage } from '../../types/journal'

interface Props {
  message: JournalMessage
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatBubble({ message }: Props) {
  const isAgent = message.role === 'agent'

  return (
    <div className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[75%] space-y-1 ${isAgent ? 'items-start' : 'items-end'} flex flex-col`}
      >
        {isAgent && (
          <span className="px-1 text-xs font-semibold text-teal-600">Agent Journal</span>
        )}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isAgent
              ? 'rounded-tl-sm bg-white text-slate-800 shadow-sm ring-1 ring-slate-100'
              : 'rounded-tr-sm bg-teal-600 text-white'
          }`}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {message.content}
        </div>
        <span className="px-1 text-xs text-slate-400">{formatTime(message.created_at)}</span>
      </div>
    </div>
  )
}
