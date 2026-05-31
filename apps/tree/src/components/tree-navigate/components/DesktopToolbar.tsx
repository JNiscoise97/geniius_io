import { toolbar } from '../data'

export function DesktopToolbar({
  onSelectSosa,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: {
  onSelectSosa: () => void
  onPrevious: () => void
  onNext: () => void
  canGoPrevious: boolean
  canGoNext: boolean
}) {
  return (
    <header className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-[1680px] items-center gap-2 overflow-x-auto px-3 py-2">
        {toolbar.map((item) => {
          const isPrevious = item.label === 'Précédent'
          const isNext = item.label === 'Suivant'

          const disabled =
            (isPrevious && !canGoPrevious) ||
            (isNext && !canGoNext)

          return (
            <button
              key={item.label}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (item.label === 'Sosa') onSelectSosa()
                if (isPrevious) onPrevious()
                if (isNext) onNext()
              }}
              className={[
                'flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold transition',
                disabled
                  ? 'cursor-not-allowed text-slate-300 opacity-50'
                  : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-700',
              ].join(' ')}
            >
              <item.icon
                size={21}
                className={disabled ? 'text-slate-300' : 'text-indigo-600'}
              />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          )
        })}
      </div>
    </header>
  )
}