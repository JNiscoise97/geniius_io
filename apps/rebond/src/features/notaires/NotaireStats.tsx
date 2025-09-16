// NotaireStats.tsx

import { useEffect, useMemo } from "react"
import { useActeStore } from "@/store/actes"
import { useNotaireRegistreStore } from "@/store/useNotaireRegistreStore"

interface Props {
  notaireId: string
}

export function NotaireStats({ notaireId }: Props) {
  const actes = useActeStore((state) => state.actes)
  const annees = useNotaireRegistreStore((state) => state.registres)
  const fetchRegistres = useNotaireRegistreStore((state) => state.fetchRegistres)
  const fetchActes = useActeStore((state) => state.fetchActes)

  useEffect(() => {
    fetchRegistres(notaireId)
    fetchActes()
  }, [notaireId])

  const stats = useMemo(() => {
    const actesNotaire = actes.filter(a =>
      a.notaires?.some(n => n.role === "principal" && n.notaire?.id === notaireId)
    )

    const totalActes = annees.reduce((sum, a) => sum + (a.nombre_actes ?? 0), 0)
    const actesReleves = actesNotaire.length
    const actesTranscrits = actesNotaire.filter(a => a.statut?.transcription === "faite").length

    const types: Record<string, number> = {}
    actesNotaire.forEach(a => {
      a.typeOperation?.forEach(t => {
        types[t] = (types[t] ?? 0) + 1
      })
    })

    return { totalActes, actesReleves, actesTranscrits, types }
  }, [actes, annees, notaireId])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Statistiques</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <StatCard label="Actes attendus" value={stats.totalActes} />
        <StatCard label="Actes relevés" value={stats.actesReleves} />
        <StatCard label="Transcrits" value={stats.actesTranscrits} />
        <StatCard label="À transcrire" value={stats.actesReleves - stats.actesTranscrits} />
      </div>

      <div>
        <h3 className="font-semibold mt-4 mb-2">Types d’actes relevés</h3>
        {Object.keys(stats.types).length === 0 ? (
          <p className="text-muted-foreground">Aucun type encore relevé.</p>
        ) : (
          <ul className="list-disc list-inside text-sm">
            {Object.entries(stats.types).map(([type, count]) => (
              <li key={type}>
                {type} — {count}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string, value: number }) {
  return (
    <div className="border rounded p-3 shadow-sm text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  )
}
