import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSnippetStore } from "@/store/useSnippetStore"
import { v4 as uuidv4 } from "uuid"
import { BackToHomeButton } from "@/components/shared/BackToRebondHomeButton"
import { supabase } from "@/lib/supabase"

export default function SnippetManager() {
  const { snippets, fetchSnippets } = useSnippetStore()
  const [clé, setClé] = useState("")
  const [valeur, setValeur] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchSnippets()
  }, [])

  const handleAdd = async () => {
    if (!clé.trim() || !valeur.trim()) {
      setMessage("Veuillez remplir les deux champs.")
      return
    }

    const { error } = await supabase.from("snippets").insert({
      id: uuidv4(),
      clé: clé.trim(),
      valeur: valeur.trim(),
    })

    if (error) {
      setMessage("Erreur à l’ajout.")
      return
    }

    setClé("")
    setValeur("")
    setMessage("Snippet ajouté.")
    fetchSnippets()
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <BackToHomeButton />
      <h1 className="text-2xl font-bold">Gestion des snippets</h1>

      <div className="space-y-2">
        <label>Clé *</label>
        <Input value={clé} onChange={(e) => setClé(e.target.value)} placeholder="Ex: CM" />

        <label>Valeur *</label>
        <Input value={valeur} onChange={(e) => setValeur(e.target.value)} placeholder="Ex: Contrat de mariage" />

        <Button onClick={handleAdd}>Ajouter le snippet</Button>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>

      <hr />

      <h2 className="text-lg font-semibold">Snippets existants</h2>
      <ul className="list-disc list-inside text-sm">
        {snippets.map((s) => (
          <li key={s.id}>
            <code>::{s.clé}</code> → {s.valeur}
          </li>
        ))}
      </ul>
    </div>
  )
}
