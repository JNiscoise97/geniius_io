import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useActeStore } from "@/store/actes"
import { BackToHomeButton } from "@/components/shared/BackToRebondHomeButton"
import AnalyseEditor from "./analyse/AnalyseEditor"

export default function Analyse() {
  const { id } = useParams()
  const acte = useActeStore((state) => state.actes.find((a) => a.id === id))
  const fetchActeById = useActeStore((s) => s.fetchActeById)
  const loading = useActeStore((s) => s.loading)
  const error = useActeStore((s) => s.error)

  useEffect(() => {
    if (id && !acte) {
      fetchActeById(id)
    }
  }, [id, acte, fetchActeById])

  if (loading) {
    return (
      <div className="p-6">
        <BackToHomeButton />
        <p className="text-sm text-muted-foreground">Chargement en cours...</p>
      </div>
    )
  }

  if (!acte || error) {
    return (
      <div className="p-6">
        <BackToHomeButton />
        <h1 className="text-xl font-bold">Acte introuvable</h1>
        <p>Impossible de trouver l’acte demandé.</p>
      </div>
    )
  }

  return <AnalyseEditor acteId={acte.id} />
}
