export function DataTable({
  title,
  rows,
}: {
  title: string
  rows: string[][]
}) {
  return (
    <div className="border-t border-slate-200">
      <h3 className="bg-slate-50 px-3 py-1 font-black">{title}</h3>

      <table className="w-full border-collapse text-[12px]">
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('-')}>
              {row.map((cell, index) => (
                <td key={index} className="border border-slate-200 px-2 py-1">
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