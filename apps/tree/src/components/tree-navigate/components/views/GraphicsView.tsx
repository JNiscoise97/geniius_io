export function GraphicsView() {
  return (
    <div className="min-h-[720px] bg-white p-4">
      <h2 className="mb-4 text-lg font-black">
        Graphiques Geniius
      </h2>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          'Réseau relationnel',
          'Carte des lieux',
          'Répartition des sources',
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-slate-200 bg-cyan-50 p-5 text-center font-black text-cyan-900"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}