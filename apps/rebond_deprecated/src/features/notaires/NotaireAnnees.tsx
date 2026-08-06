// NotaireAnnees.tsx

import { useEffect, useState, useMemo } from "react"
import { useNotaireRegistreStore } from "@/store/useNotaireRegistreStore"
import { useNotaireStore } from "@/store/notaires"
import { useActeStore } from "@/store/actes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  notaireId: string
}

export function NotaireAnnees({ notaireId }: Props) {
  const { registres, fetchRegistres, loading, addRegistre } = useNotaireRegistreStore()
  const { notaires, fetchNotaires } = useNotaireStore()
  const actes = useActeStore((s) => s.actes)

  const notaire = notaires.find((n) => n.id === notaireId)

  const [open, setOpen] = useState(false)
  const [annee, setAnnee] = useState<number | "">("")
  const [nombre, setNombre] = useState<number | "">("")

  useEffect(() => {
    fetchRegistres(notaireId)
  }, [notaireId])

  useEffect(() => {
    if (!notaire) {
      fetchNotaires()
    }
  }, [notaire, fetchNotaires])

  const handleSubmit = async () => {
    if (!annee || annee < 1500 || annee > 2100) return
    await addRegistre(notaireId, Number(annee), nombre !== "" ? Number(nombre) : undefined)
    setAnnee("")
    setNombre("")
    setOpen(false)
  }

  // Recalculer pour chaque année le nombre d’actes relevés
  const registresAvecNombreReleves = useMemo(() => {
    return registres
      .map((an) => {
        const count = actes.filter(
          (a) =>
            a.notaires?.some((n) => n.role === "principal" && n.notaire?.id === notaireId) &&
            a.seances?.some((s) => s.date?.exact?.startsWith(an.annee.toString()))
        ).length
  
        return { ...an, nb_actes_releves: count }
      })
      .sort((a, b) => a.annee - b.annee) // ⬅️ Tri par année croissante
  }, [registres, actes, notaireId])  

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Suivi par année</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Ajouter une année</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une année</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Notaire</Label>
              <Input
                readOnly
                value={
                  notaire
                    ? `${notaire.titre ?? ""} ${notaire.nom} ${notaire.prenom ?? ""}`.trim()
                    : "Chargement..."
                }
              />
              <Label>Année</Label>
              <Input
                type="number"
                value={annee}
                onChange={(e) => setAnnee(Number(e.target.value))}
                min={1500}
                max={2100}
                required
              />
              <Label>Nombre d’actes attendus</Label>
              <Input
                type="number"
                value={nombre}
                onChange={(e) => setNombre(e.target.value === "" ? "" : Number(e.target.value))}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
                <Button onClick={handleSubmit} disabled={!annee || annee < 1500 || annee > 2100}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  
      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : registresAvecNombreReleves.length === 0 ? (
        <p className="text-muted-foreground">Aucune année renseignée pour ce notaire.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {registresAvecNombreReleves.map((an) => {
            const { nb_actes_releves, nombre_actes, annee } = an
            const progress = nombre_actes ? Math.min(100, Math.round((nb_actes_releves / nombre_actes) * 100)) : 0

            const badge = nombre_actes ? (
                <span
                className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium
                    ${ progress ==  100
                    ? "bg-green-100 text-green-800"
                    : progress >= 90
                    ? "bg-green-100 text-green-800"
                    : progress >= 50
                    ? "bg-yellow-100 text-yellow-800"
                    : progress == 0
                    ? "bg-gray-100 text-gray-800"
                    : "bg-red-100 text-red-800"
                    }`}
                >
                {progress == 100
                    ? "Terminé"
                    : progress >= 90
                    ? "Bon avancement"
                    : progress >= 50
                    ? "Avancement moyen"
                    : progress == 0
                    ? "À commencer"
                    : "Faible avancement"}
                </span>
            ) : null

            return (
                <div
                key={annee}
                className="rounded border border-gray-200 p-4 shadow-sm space-y-2"
                >
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{annee}</h3>
                    {badge}
                </div>
                <p className="text-sm text-muted-foreground">
                    <strong>{nb_actes_releves}</strong> / {nombre_actes ?? "—"} actes relevés
                </p>
                {nombre_actes ? (
                    <>
                    <div className="h-2 bg-gray-200 rounded">
                        <div
                        className="h-2 bg-blue-500 rounded"
                        style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-right text-muted-foreground">
                        {progress}% relevés
                    </p>
                    </>
                ) : (
                    <p className="text-xs text-muted-foreground italic">
                    Nombre attendu non défini
                    </p>
                )}
                </div>
            )
            })}

        </div>
      )}
    </div>
  )  
}
