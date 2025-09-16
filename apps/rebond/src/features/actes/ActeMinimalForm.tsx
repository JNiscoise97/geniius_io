// ActeMinimalForm.tsx
 
import { useEffect, useState } from "react"
import { useActeStore } from "@/store/actes"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { BackToHomeButton } from "@/components/shared/BackToRebondHomeButton"
import { supabase } from "@/lib/supabase"

import type { ActeBase, Notaire } from "@/types/acte"
import { normalizeDateString, formatDateToFrench, isValidDateString } from "@/utils/date"
import { SnippetTextarea } from "@/components/shared/saisie/SaisieTextarea"

export default function ActeMinimalForm() {
  const addActe = useActeStore((state) => state.addActe)
  const navigate = useNavigate()

  const [notaires, setNotaires] = useState<Notaire[]>([])
  const [selectedNotaireId, setSelectedNotaireId] = useState<string>("")
  const [dateInput, setDateInput] = useState("")
  const [date, setDate] = useState("")
  const [dateError, setDateError] = useState(false)
  const [label, setResume] = useState("")
  const [notaireInput, setNotaireInput] = useState("")
  const [showNotaireMenu, setShowNotaireMenu] = useState(false)
  const [notaireError, setNotaireError] = useState(false)


  useEffect(() => {
    const fetchNotaires = async () => {
      const { data, error } = await supabase.from("notaires").select("*").order("nom", { ascending: true })
      if (error) {
        console.error("Erreur récupération notaires:", error.message)
      } else {
        setNotaires(data)
      }
    }

    fetchNotaires()
  }, [])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedNotaireId) {
      alert("Veuillez sélectionner un notaire.")
      return
    }
  
    const normalizedDate = normalizeDateString(date.trim())
  
    if (!normalizedDate) {
      alert("Veuillez saisir une date invalide.")
      return
    }
  
    const seance = {
      date: { exact: normalizedDate }
    }
    if (!label.trim()) {
      alert("Veuillez saisir un titre ou un court résumé de l'acte.")
      return
    }
    

    const newActe: Omit<ActeBase, "id"> = {
      label: label.trim()
    }

    await addActe(newActe, selectedNotaireId, seance)
    navigate("ac-actes/liste")
  }
  const filteredNotaires = notaireInput.trim()
  ? notaires.filter((n) =>
      `${n.nom} ${n.prenom ?? ""}`.toLowerCase().includes(notaireInput.trim().toLowerCase())
    )
  : []
  return (
    <div className="max-w-xl mx-auto p-4">
      <BackToHomeButton />
      <h1 className="text-2xl font-bold mb-4">Nouvel acte – Saisie rapide</h1>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block mb-1 text-sm">Notaire</label>
            <Input
              value={notaireInput}
              onChange={(e) => {
                setNotaireInput(e.target.value)
                setShowNotaireMenu(true)
                setSelectedNotaireId("")
              }}
              onBlur={() => {
                setTimeout(() => {
                  const match = notaires.find((n) =>
                    `${n.titre ? n.titre + " " : ""}${n.nom} ${n.prenom ?? ""}`.toLowerCase().trim() === notaireInput.toLowerCase().trim()
                  )
                  if (match) {
                    setSelectedNotaireId(match.id)
                    setNotaireError(false)
                  } else {
                    setSelectedNotaireId("")
                    setNotaireError(true)
                  }
                  setShowNotaireMenu(false)
                }, 150) // délai court pour permettre un clic sur un item
              }}
              placeholder="Tapez un nom ou prénom..."
              className={notaireError ? "border-red-500" : ""}
            />
            {notaireError && (
              <p className="text-red-600 text-sm mt-1">Aucun notaire correspondant.</p>
            )}

            {showNotaireMenu && filteredNotaires.length > 0 && (
              <div className="absolute z-50 bg-white border rounded shadow-md text-sm mt-1 max-h-40 overflow-y-auto w-full">
                {filteredNotaires.map((n) => (
                  <div
                    key={n.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onMouseDown={() => {
                      setSelectedNotaireId(n.id)
                      setNotaireInput(`${n.titre ? n.titre + " " : ""}${n.nom} ${n.prenom ?? ""}`)
                      setShowNotaireMenu(false)
                      setNotaireError(false)
                    }}
                  >
                    {n.titre ? `${n.titre} ` : ""}{n.nom} {n.prenom ?? ""}
                  </div>
                ))}
              </div>
            )}
          </div>


            <div>
              <label className="block mb-1 text-sm">Date</label>
              <Input
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                onBlur={() => {
                  const normalized = normalizeDateString(dateInput)
                  if (normalized && isValidDateString(normalized)) {
                    setDate(normalized)
                    setDateError(false)
                    setDateInput(formatDateToFrench(normalized)) // seulement si valide
                  } else if (!dateInput.trim()) {
                    setDate("")
                    setDateError(false)
                    // l'utilisateur n'a rien saisi → pas d'erreur
                  } else {
                    setDate("")
                    setDateError(true)
                    // ne pas modifier dateInput → on laisse la saisie utilisateur
                  }
                }}
                placeholder="Ex: 29/10/1946"
                className={dateError ? "border-red-500" : ""}
              />
              {dateError && (
                <p className="text-red-600 text-sm mt-1">
                  Format de date incorrect. Utilisez par exemple "29/10/1946" ou "29.06.1846".
                </p>
              )}
            </div>


            <div>
              <label className="block mb-1 text-sm">Titre de l'acte</label>
              <SnippetTextarea
                value={label}
                onChange={setResume}
                placeholder="Titre ou résumé en quelques mots de l'acte"
              />
            </div>

            <Button type="submit" className="w-full">
              Ajouter l’acte
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}