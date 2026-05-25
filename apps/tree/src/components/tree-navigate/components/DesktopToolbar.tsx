import { toolbar } from '../data'

export function DesktopToolbar() {
  return (
    <header className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-[1680px] items-center gap-2 overflow-x-auto px-3 py-2">
        {toolbar.map((item) => (
          <button
            key={item.label}
            className="flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <item.icon size={21} className="text-indigo-600" />
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>
    </header>
  )
}