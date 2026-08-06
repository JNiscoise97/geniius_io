import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useNotaireStore } from "@/store/notaires"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BackToHomeButton } from "@/components/shared/BackToRebondHomeButton"

type NotaireFormState = {
  nom: string
  prenom: string
  titre: string
  etude: string
  lieu_exercice: string
  notes: string
}

export default function NotaireEdit() {
  const navigate = useNavigate()
  const { id } = useParams()

  const notaires = useNotaireStore((s) => s.notaires)
  const updateNotaire = useNotaireStore((s) => s.updateNotaire)

  const notaire = useMemo(() => {
    if (!id) return undefined
    return notaires.find((n) => n.id === id)
  }, [id, notaires])

  const [form, setForm] = useState<NotaireFormState>({
    nom: "",
    prenom: "",
    titre: "",
    etude: "",
    lieu_exercice: "",
    notes: "",
  })

  const [error, setError] = useState("")

  useEffect(() => {
    if (!notaire) return
    setForm({
      nom: notaire.nom ?? "",
      prenom: notaire.prenom ?? "",
      titre: notaire.titre ?? "",
      etude: notaire.etude ?? "",
      lieu_exercice: notaire.lieu_exercice ?? "",
      notes: notaire.notes ?? "",
    })
  }, [notaire])

  const handleChange = (key: keyof NotaireFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!id) {
      setError("Identifiant manquant dans l’URL.")
      return
    }

    if (!form.nom.trim()) {
      setError("Le nom est obligatoire.")
      return
    }

    setError("")
    await updateNotaire(id, form)
    navigate("/notaires/liste")
  }

  if (!id) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <BackToHomeButton />
        <p className="text-red-600">URL invalide : id manquant.</p>
      </div>
    )
  }

  if (!notaire) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <BackToHomeButton />
        <h1 className="text-2xl font-bold">Modifier un notaire</h1>
        <p className="text-red-600">Notaire introuvable (id: {id}).</p>
        <Button variant="outline" onClick={() => navigate("/notaires/liste")}>
          Retour à la liste
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <BackToHomeButton />
      <h1 className="text-2xl font-bold">Modifier un notaire</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Nom *</label>
          <Input value={form.nom} onChange={(e) => handleChange("nom", e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">Prénom</label>
          <Input value={form.prenom} onChange={(e) => handleChange("prenom", e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">Titre</label>
          <Input value={form.titre} onChange={(e) => handleChange("titre", e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">Étude</label>
          <Input value={form.etude} onChange={(e) => handleChange("etude", e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">Lieu d’exercice</label>
          <Input value={form.lieu_exercice} onChange={(e) => handleChange("lieu_exercice", e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">Notes</label>
          <Textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit">Enregistrer</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/notaires/liste")}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  )
}
