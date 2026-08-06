import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useNotaireStore } from "@/store/notaires"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BackToHomeButton } from "@/components/shared/BackToRebondHomeButton"

export default function NotaireForm() {
  const navigate = useNavigate()
  const addNotaire = useNotaireStore((state) => state.addNotaire)

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    titre: "",
    etude: "",
    lieu_exercice: "",
    notes: "",
  })

  const [error, setError] = useState("")

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.nom.trim()) {
      setError("Le nom est obligatoire.")
      return
    }

    await addNotaire(form)
    navigate("/notaires/liste")
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <BackToHomeButton />
      <h1 className="text-2xl font-bold">Ajouter un notaire</h1>

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

        <Button type="submit">Enregistrer</Button>
      </form>
    </div>
  )
}
