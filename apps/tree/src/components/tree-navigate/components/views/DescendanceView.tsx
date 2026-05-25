import { descendants } from "../../data";


export function DescendanceView() {
  return (
    <div className="min-h-[720px] overflow-auto bg-white p-2">
      <div className="border-b border-slate-200 bg-indigo-50 px-3 py-2">
        <p className="font-black">
          (MAMMOSA) Pierre “Gédéon”
        </p>
      </div>

      <div className="overflow-auto p-3 font-mono text-[12px] leading-6">
        {descendants.map(([name, details], index) => (
          <div
            key={`${name}-${index}`}
            style={{
              marginLeft: `${Math.min(index, 9) * 22}px`,
            }}
          >
            <span className="font-bold">{name}</span>{' '}
            <span className="text-slate-500">
              ({details})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}