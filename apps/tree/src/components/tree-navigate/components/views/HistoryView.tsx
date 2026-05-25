import { events } from "../../data";


export function HistoryView() {
  return (
    <div className="min-h-[720px] bg-white p-4">
      <h2 className="mb-4 text-lg font-black">
        Histoire / Chronologie
      </h2>

      {events.map(([label, year, age, place]) => (
        <div
          key={label}
          className="mb-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          <strong>{year}</strong> — {label}
          <span className="text-slate-500">
            {' '}âge {age || '—'} · {place}
          </span>
        </div>
      ))}
    </div>
  )
}