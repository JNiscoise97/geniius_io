import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { BackToHomeButton } from "@/components/shared/BackToRebondHomeButton"
import { Card, CardContent } from "@/components/ui/card"
import type { ActeBase, Notaire } from "@/types/acte"
import { formatDateToFrench, normalizeDateString } from "@/utils/date"
import { SnippetTextarea } from "@/components/shared/saisie/SaisieTextarea"

interface ActeMinimalData {
  label: string
  date: string
  notaireId: string
  typeOperation?: string[]
  reference?: string
  numeroActe: string
}

export default function ActeEnRoulement() {
  const [notaires, setNotaires] = useState<Notaire[]>([])


  const [form, setForm] = useState<ActeMinimalData>({
    label: "",
    date: "",
    notaireId: "",
    numeroActe: ""
  })
  const [notaireInput, setNotaireInput] = useState("")
  const [showNotaireMenu, setShowNotaireMenu] = useState(false)
  const [notaireError, setNotaireError] = useState(false)  

  const [lastActe, setLastActe] = useState<ActeBase | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const filteredNotaires = notaireInput.trim()
  ? notaires.filter((n) =>
      `${n.nom} ${n.prenom ?? ""}`.toLowerCase().includes(notaireInput.trim().toLowerCase())
    )
  : []

  useEffect(() => {
    const fetchNotaires = async () => {
      const { data } = await supabase.from("notaires").select("*").order("nom", { ascending: true })
      setNotaires(data || [])
    }
    fetchNotaires()
  }, [])

  const handleChange = (key: keyof ActeMinimalData, value: string | string[]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const replicateLast = () => {
    if (!lastActe) return
    const seanceDate = lastActe.seances?.[0]?.date?.exact ?? ""
    const notaireId = lastActe.notaires?.find(n => n.role === "principal")?.notaire_id ?? ""

    setForm({
      label: "",
      date: seanceDate,
      notaireId,
      typeOperation: lastActe.typeOperation ?? [],
      reference: lastActe.référencesSource?.[0]?.cote ?? "",
      numeroActe: lastActe.numero_acte ?? "",
    })
    setNotaireInput(
      lastActe.notaires?.[0]?.notaire
        ? `${lastActe.notaires[0].notaire.titre ?? ""} ${lastActe.notaires[0].notaire.nom} ${lastActe.notaires[0].notaire.prenom ?? ""}`.trim()
        : ""
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const normalizedDate = normalizeDateString(form.date)
    if (!form.label.trim() || !form.notaireId || !normalizedDate) {
      setError("Veuillez remplir tous les champs requis avec un format de date valide.")
      return
    }

    setLoading(true)

    const { data: acte, error: acteError } = await supabase.from("actes").insert([{ label: form.label.trim(), numero_acte: form.numeroActe?.trim() || null }]).select().single()
    if (acteError) {
      setError("Erreur ajout acte.")
      setLoading(false)
      return
    }

    await supabase.from("actes_notaires").insert({
      acte_id: acte.id,
      notaire_id: form.notaireId,
      role: "principal",
    })

    await supabase.from("seances").insert({
      acte_id: acte.id,
      date: { exact: normalizedDate },
    })

    const notaire = notaires.find(n => n.id === form.notaireId)
    setLastActe({
      ...acte,
      seances: [{ date: { exact: normalizedDate }, lieu: { nom: "", type: "indéfini" } }],
      notaires: [{ acte_id: acte.id, notaire_id: form.notaireId, role: "principal", notaire }],
      label: form.label.trim(),
    })

    setForm({ label: "", date: "", notaireId: "", numeroActe: "" })
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto p-4">
        <BackToHomeButton />
        <h1 className="text-2xl font-bold mb-4">Nouvel acte – Saisie par roulement</h1>
        <Card>
            <CardContent className="p-4">
                {lastActe && (
                    <section className="border p-4 bg-muted rounded shadow-sm">
                    <p className="text-sm font-semibold mb-2">Dernier acte enregistré :</p>
                    <p>📌 {lastActe.label}</p>
                    <p>📅 {lastActe.seances?.[0]?.date?.exact ? formatDateToFrench(lastActe.seances[0].date.exact) : "—"}</p>
                    <p>✍️ {
                        (() => {
                            const principal = lastActe.notaires?.find(n => n.role === "principal")
                            return principal?.notaire
                            ? `${principal.notaire.titre ?? ""} ${principal.notaire.nom ?? ""} ${principal.notaire.prenom ?? ""}`.trim()
                            : "—"
                        })()
                        }</p>

                    <Button variant="ghost" size="sm" onClick={replicateLast} className="mt-2">↻ Répliquer cet acte</Button>
                    </section>
                )}
            </CardContent>
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-lg font-semibold">➕ Nouvel acte</h2>

                    <div className="relative">
                      <label className="block mb-1 text-sm">Notaire *</label>
                      <Input
                        value={notaireInput}
                        onChange={(e) => {
                          setNotaireInput(e.target.value)
                          setShowNotaireMenu(true)
                          setForm((f) => ({ ...f, notaireId: "" }))
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            const match = notaires.find((n) =>
                              `${n.titre ? n.titre + " " : ""}${n.nom} ${n.prenom ?? ""}`.toLowerCase().trim() === notaireInput.toLowerCase().trim()
                            )
                            if (match) {
                              setForm((f) => ({ ...f, notaireId: match.id }))
                              setNotaireError(false)
                            } else {
                              setForm((f) => ({ ...f, notaireId: "" }))
                              setNotaireError(true)
                            }
                            setShowNotaireMenu(false)
                          }, 150)
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
                                setForm((f) => ({ ...f, notaireId: n.id }))
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


                    <div className="flex gap-4">
                      <div className="w-1/2">
                        <label className="block text-sm mb-1">Date *</label>
                        <Input
                          value={form.date}
                          onChange={(e) => handleChange("date", e.target.value)}
                          onBlur={() => {
                            const normalized = normalizeDateString(form.date)
                            if (normalized) {
                              handleChange("date", normalized)
                            }
                          }}
                          placeholder="Ex: 1946-10-29 ou 29/10/1946"
                        />
                      </div>

                      <div className="w-1/2">
                        <label className="block text-sm mb-1">N° acte</label>
                        <Input
                          value={form.numeroActe ?? ""}
                          onChange={(e) => handleChange("numeroActe", e.target.value)}
                          placeholder="Ex: 12, 18bis..."
                        />
                      </div>
                    </div>


                    <div>
                    <label className="block text-sm mb-1">Résumé *</label>
                    <SnippetTextarea value={form.label} onChange={(val) => handleChange("label", val)} placeholder="Titre ou résumé en quelques mots de l'acte" />

                    </div>

                    <Button type="submit" disabled={loading}>
                    {loading ? "Enregistrement..." : "Enregistrer"}
                    </Button>

                    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                </form>
            </CardContent>
        </Card>
    </div>
  )
}
