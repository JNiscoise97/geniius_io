import { searchResults } from "../../data";

export function SearchView() {
  return (
    <div className="min-h-[720px] bg-white">
      <section className="border-b border-slate-200 bg-indigo-50 p-4">
        <h2 className="mb-3 text-base font-black">
          Critères
        </h2>

        <div className="grid gap-2 md:grid-cols-[160px_1fr_1fr_auto]">
          <select className="rounded-lg border border-slate-200 px-2 py-1">
            <option>Individus</option>
          </select>

          <button className="rounded-lg bg-indigo-700 px-4 py-1 font-black text-white">
            Rechercher
          </button>
        </div>
      </section>

      <table className="w-full border-collapse text-[12px]">
        <tbody>
          {searchResults.map((row) => (
            <tr key={row.join('-')}>
              {row.map((cell, index) => (
                <td
                  key={index}
                  className="border border-slate-200 px-2 py-1"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}