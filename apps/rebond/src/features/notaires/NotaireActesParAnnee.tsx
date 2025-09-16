// NotaireActesParAnnee.tsx

import { useEffect, useMemo, useState } from "react"
import { useActeStore } from "@/store/actes"
import { useNotaireRegistreStore } from "@/store/useNotaireRegistreStore"
import type { NotaireRegistre } from "@/types/acte"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { formatDateToNumericFrench } from "@/utils/date"
import type { ActeBase } from "@/types/acte"
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Star } from "lucide-react"
  import { useFavorisStore } from "@/store/favoris"
  import { toast } from "sonner"


interface Props {
  notaireId: string
}

export function NotaireActesParAnnee({ notaireId }: Props) {
  const [expandedYear, setExpandedYear] = useState<number | null>(null)

  const actes = useActeStore((state) => state.actes)
  const annees = useNotaireRegistreStore((state) => state.registres)
  const fetchRegistres = useNotaireRegistreStore((state) => state.fetchRegistres)
  


  useEffect(() => {
    fetchRegistres(notaireId)
  }, [notaireId])

  const actesDuNotaire = useMemo(
    () =>
      actes.filter((a) =>
        a.notaires?.some((n) => n.role === "principal" && n.notaire?.id === notaireId)
      ),
    [actes, notaireId]
  )


  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Actes par année</h2>
      {annees.length === 0 ? (
        <p className="text-muted-foreground">Aucune année d'exercice renseignée.</p>
      ) : (
        [...annees]
        .sort((a, b) => a.annee - b.annee)
        .map((annee) => (
          <div key={annee.annee} className="border rounded p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Année {annee.annee}</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setExpandedYear(expandedYear === annee.annee ? null : annee.annee)
                }
              >
                {expandedYear === annee.annee ? "Réduire" : "Voir les actes"}
              </Button>
            </div>

            {expandedYear === annee.annee && (
              <AnneeTable annee={annee} actes={actesDuNotaire} />
            )}
          </div>
        ))
      )}
    </div>
  )
}

function AnneeTable({ annee, actes }: { annee: NotaireRegistre, actes: ActeBase[] }) {
    const [selectedActe, setSelectedActe] = useState<ActeBase | null>(null)
    const [numeroActe, setNumeroActe] = useState("")
  
    const updateNumeroActe = useActeStore((s) => s.updateNumeroActe)

    const actesDeCetteAnnee = actes.filter((a) =>
      a.seances?.some((s) => s.date?.exact?.startsWith(String(annee.annee)))
    )
  
    const actesAvecNumero = actesDeCetteAnnee.filter((a) => a.numero_acte)
    const actesSansNumero = actesDeCetteAnnee
      .filter((a) => !a.numero_acte)
      .sort((a, b) =>
        (a.seances?.[0]?.date?.exact ?? "").localeCompare(b.seances?.[0]?.date?.exact ?? "")
      )
  
      const lignesAvecNumero = useMemo(() => {
        // Création d'une map { numéro "normalisé" => acte }
        const map = new Map<string, ActeBase>()
        actesAvecNumero.forEach((a) => {
          const numero = a.numero_acte?.trim()
          if (numero) map.set(numero, a)
        })
      
        // On récupère les numéros avec parsing du préfixe numérique
        const parsedNumeros = Array.from(map.keys())
          .map((num) => {
            const match = num.match(/^(\d+)([a-zA-Z]*)$/)
            const base = match ? parseInt(match[1], 10) : 0
            const suffix = match ? match[2] : ""
            return { raw: num, base, suffix }
          })
      
        // On trie
        parsedNumeros.sort((a, b) =>
          a.base !== b.base ? a.base - b.base : a.suffix.localeCompare(b.suffix)
        )
      
        // On recrée les lignes dans l’ordre, en incluant les “trous”
        const lignes: { numero: string; acte?: ActeBase }[] = []
      
        let current = 1
        for (const { raw, base, suffix } of parsedNumeros) {
          // Remplir les cases manquantes si aucun acte avec ce numéro
          while (current < base) {
            lignes.push({ numero: String(current), acte: undefined })
            current++
          }
      
          lignes.push({ numero: raw, acte: map.get(raw) })
      
          // Ne pas incrémenter `current` si on est sur un "bis", "ter", etc.
          if (suffix === "") current = base + 1
        }

        // Ajouter les numéros manquants jusqu’à nombre_actes s’il est défini
        if (annee.nombre_actes) {
            while (current <= annee.nombre_actes) {
            lignes.push({ numero: String(current), acte: undefined })
            current++
            }
        }
      
        return lignes
      }, [actesAvecNumero])
         
    
    const ajouter = useFavorisStore((s) => s.ajouterActeFavori)
    const retirer = useFavorisStore((s) => s.retirerActeFavori)
    const isFavori = useFavorisStore((s) => s.acteFavorisIds)

    const ajouterFavori = async (id: string) => {
      await ajouter(id)
      toast.success(`Acte #${id} ajouté aux favoris`)
    }

    const retirerFavori = async (id: string) => {
      await retirer(id)
      toast(`Acte #${id} retiré des favoris`, {
        icon: "⭐",
        duration: 4000,
      })
    }
  
    return (
      <>
        <table className="mt-4 w-full text-sm border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-2 py-1">#</th>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Résumé</th>
              <th className="px-2 py-1">Transcription</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lignesAvecNumero.map(({ numero, acte }) => (
              <tr key={numero} className="border-t hover:bg-gray-50">
                <td className="px-2 py-1">{numero}</td>
                <td className="px-2 py-1">
                  {acte?.seances?.[0]?.date?.exact
                    ? formatDateToNumericFrench(acte.seances[0].date.exact)
                    : "—"}
                </td>
                <td className="px-2 py-1">{acte?.label ?? "—"}</td>
                <td className="px-2 py-1">{acte?.statut?.transcription === "faite" ? "✅" : "❌"}</td>
                <td className="px-2 py-1">
                  {acte ? (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() =>
                          isFavori.includes(acte.id)
                            ? retirerFavori(acte.id)
                            : ajouterFavori(acte.id)
                        }
                        title={
                          isFavori.includes(acte.id)
                            ? "Retirer des favoris"
                            : "Marquer comme favori"
                        }
                        className={isFavori.includes(acte.id)
                          ? "text-yellow-500 hover:text-yellow-600 transition-all duration-200 transform hover:scale-110"
                          : "text-gray-400 hover:text-yellow-500 transition-all duration-200 transform hover:scale-110"}
                      >
                        <Star
                          className={`w-5 h-5 transition-colors duration-200 ${
                            isFavori.includes(acte.id) ? "fill-yellow-500" : ""
                          }`}
                        />
                      </button>

                      <Link to={`/ac-actes/${acte.id}`}>
                        <Button size="sm" variant="outline">
                          Voir
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

              </tr>
            ))}
  
            {actesSansNumero.length > 0 && (
              <>
                <tr>
                  <td colSpan={5} className="text-center py-2 text-muted-foreground border-t bg-gray-50">
                    Actes présents mais sans numéro
                  </td>
                </tr>
  
                {actesSansNumero.map((acte) => {
                  const notaire = acte.notaires?.find(n => n.role === "principal")?.notaire
  
                  return (
                    <tr key={acte.id} className="border-t hover:bg-gray-50">
                      <td className="px-2 py-1">?</td>
                      <td className="px-2 py-1">
                        {formatDateToNumericFrench(acte.seances?.[0]?.date?.exact ?? "—")}
                      </td>
                      <td className="px-2 py-1">{acte.label}</td>
                      <td className="px-2 py-1">
                        {acte.statut?.transcription === "faite" ? "✅" : "❌"}
                      </td>
                      <td className="px-2 py-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedActe(acte)}>
                              Ajouter un numéro d’acte
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ajouter un numéro d’acte</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              <Label>Notaire</Label>
                              <Input
                                readOnly
                                value={
                                  notaire
                                    ? `${notaire.titre ?? ""} ${notaire.nom} ${notaire.prenom ?? ""}`.trim()
                                    : ""
                                }
                              />
                              <Label>Date</Label>
                              <Input
                                readOnly
                                value={formatDateToNumericFrench(acte.seances?.[0]?.date?.exact ?? "")}
                              />
                              <Label>Résumé</Label>
                              <Input readOnly value={acte.label} />
                              <Label>Numéro d’acte</Label>
                              <Input
                                type="text"
                                placeholder="Ex : 12, 45bis..."
                                value={selectedActe?.id === acte.id ? numeroActe : ""}
                                onChange={(e) => {
                                  if (selectedActe?.id === acte.id)
                                    setNumeroActe(e.target.value)
                                }}
                              />
                              <div className="pt-4 flex justify-end space-x-2">
                              <Button
                                onClick={async () => {
                                    if (!numeroActe.trim() || selectedActe?.id !== acte.id) return

                                    const success = await updateNumeroActe(acte.id, numeroActe.trim())

                                    if (success) {
                                    setSelectedActe(null)
                                    setNumeroActe("")
                                    } else {
                                    alert("Une erreur est survenue lors de la mise à jour.")
                                    }
                                }}
                                >
                                Enregistrer
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  )
                })}
              </>
            )}
          </tbody>
        </table>
      </>
    )
  }  