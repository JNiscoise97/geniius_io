//ReferenceArchiveTab.tsx

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { EtatCivilActe } from "@/types/etatcivil"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { ListeChipsViewSmart } from "@/components/shared/ListeChipsViewSmart"
import { toIds, toLabels } from "@/utils/dictionnaireValue"
import { DictionnaireEditorPanel, type DictionnaireKind } from "@/components/shared/DictionnaireEditorPanel"



type LieuSituation = "bureau_courant" | "autre_bureau" | "transporte"

type ReferenceArchiveTabProps = {
  acte: EtatCivilActe
  bureauLabel?: string
  onUpdated?: () => Promise<void> | void
}

type ActeSource = {
  id: string
  acte_id: string
  depot_type: string | null
  nom_depot: string | null
  serie: string | null
  cote: string | null
  registre: string | null
  folio_page: string | null
  vue_image: string | null
  support: string | null
  langue: string | null
  ecriture: string | null
  etat_conservation: string | null
  note: string | null
}

type SourceDraft = {
  id?: string
  depot_type: string
  nom_depot: string
  serie: string
  cote: string
  registre: string
  folio_page: string
  vue_image: string
  support: string
  langue: string
  ecriture: string
  etat_conservation: string
  note: string
}

type FormState = {
  type_acte: string
  type_acte_ref: { ids: string[]; labels: string[] } | null
  numero_acte: string
  date: string
  heure: string
  bureau_enregistrement_label: string

  lieu_situation: LieuSituation
  lieu_autre_bureau: string
  lieu_transport_raison: string

  // legacy (à supprimer plus tard)
  comparution_observations: string

  mentions_marginales_presentes: boolean
  auteur_fonction: string
}

function toDateInput(v: any) {
  if (!v) return ""
  const d = typeof v === "string" ? new Date(v) : v
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return ""
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function normalizeSourceRow(s: Partial<ActeSource> | null | undefined): SourceDraft {
  return {
    id: s?.id,
    depot_type: s?.depot_type ?? "",
    nom_depot: s?.nom_depot ?? "",
    serie: s?.serie ?? "",
    cote: s?.cote ?? "",
    registre: s?.registre ?? "",
    folio_page: s?.folio_page ?? "",
    vue_image: s?.vue_image ?? "",
    support: s?.support ?? "",
    langue: s?.langue ?? "",
    ecriture: s?.ecriture ?? "",
    etat_conservation: s?.etat_conservation ?? "",
    note: s?.note ?? "",
  }
}

export default function ReferenceArchiveTab({ acte, bureauLabel, onUpdated }: ReferenceArchiveTabProps) {
  const acteId = acte.id
  const label = acte.label ?? ""
  const tar = (acte as any).type_acte_ref

  const initialState: FormState = useMemo(
    () => ({
      type_acte: (acte as any).type_acte ?? "",


      type_acte_ref: tar?.id ? { ids: [tar.id], labels: [tar.label ?? ""] } : null, numero_acte: String((acte as any).numero_acte ?? ""),
      date: toDateInput((acte as any).date),
      heure: (acte as any).heure ?? "",
      bureau_enregistrement_label: bureauLabel ?? "",

      lieu_situation: ((acte as any).lieu_situation as LieuSituation) ?? "bureau_courant",
      lieu_autre_bureau: (acte as any).lieu_autre_bureau ?? "",
      lieu_transport_raison: (acte as any).lieu_transport_raison ?? "",

      // legacy (à supprimer plus tard)
      comparution_observations: (acte as any).comparution_observations ?? "",

      mentions_marginales_presentes: Boolean((acte as any).mentions_marginales_presentes),
      auteur_fonction: (acte as any).auteur_fonction ?? "",
    }),
    [acte, bureauLabel]
  )

  const [form, setForm] = useState<FormState>(initialState)
  const [saving, setSaving] = useState(false)
  const [loadingSources, setLoadingSources] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [sources, setSources] = useState<SourceDraft[]>([])

  const [dictOpen, setDictOpen] = useState(false)
  const [dictArgs, setDictArgs] = useState<{
    kind: DictionnaireKind
    title: string
    multi: boolean
    defaultSelectedIds: string[]
    onValidate: (items: { id: string; code: string; label: string }[]) => Promise<void> | void
  } | null>(null)

  useEffect(() => {
    setForm(initialState)
  }, [initialState])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoadingSources(true)
      setErrorMsg(null)

      const { data, error } = await supabase
        .from("etat_civil_actes_sources")
        .select(
          "id, acte_id, depot_type, nom_depot, serie, cote, registre, folio_page, vue_image, support, langue, ecriture, etat_conservation, note"
        )
        .eq("acte_id", acteId)
        .order("created_at", { ascending: true })

      if (cancelled) return

      if (error) {
        setErrorMsg(error.message)
        setSources([])
        setLoadingSources(false)
        return
      }

      const rows = (data ?? []).map((r: ActeSource) => normalizeSourceRow(r))
      setSources(rows.length ? rows : [normalizeSourceRow(null)])
      setLoadingSources(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [acteId])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateSource = (idx: number, patch: Partial<SourceDraft>) => {
    setSources((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  }

  const addSource = () => {
    setSources((prev) => [...prev, normalizeSourceRow(null)])
  }

  const duplicateSource = (idx: number) => {
    setSources((prev) => {
      const copy = { ...prev[idx] }
      delete copy.id
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]
    })
  }

  const removeSource = (idx: number) => {
    setSources((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, i) => i !== idx)
    })
  }

  const upsertSources = async () => {
    const payload = sources
      .map((s) => ({
        id: s.id,
        acte_id: acteId,
        depot_type: s.depot_type || null,
        nom_depot: s.nom_depot || null,
        serie: s.serie || null,
        cote: s.cote || null,
        registre: s.registre || null,
        folio_page: s.folio_page || null,
        vue_image: s.vue_image || null,
        support: s.support || null,
        langue: s.langue || null,
        ecriture: s.ecriture || null,
        etat_conservation: s.etat_conservation || null,
        note: s.note || null,
      }))
      .filter((row) => {
        const hasAny =
          row.depot_type ||
          row.nom_depot ||
          row.serie ||
          row.cote ||
          row.registre ||
          row.folio_page ||
          row.vue_image ||
          row.support ||
          row.langue ||
          row.ecriture ||
          row.etat_conservation ||
          row.note
        return Boolean(hasAny)
      })

    const keepIds = payload.map((p) => p.id).filter(Boolean) as string[]

    if (payload.length) {
      const { error } = await supabase.from("etat_civil_actes_sources").upsert(payload, { onConflict: "id" })
      if (error) throw error
    }

    const { data: existing, error: errExisting } = await supabase.from("etat_civil_actes_sources").select("id").eq("acte_id", acteId)
    if (errExisting) throw errExisting

    const existingIds = (existing ?? []).map((r: any) => r.id as string)
    const toDelete = existingIds.filter((id) => !keepIds.includes(id))

    if (toDelete.length) {
      const { error } = await supabase.from("etat_civil_actes_sources").delete().in("id", toDelete)
      if (error) throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)

    const patch: Record<string, any> = {
      type_acte: form.type_acte || null,
      type_acte_ref: form.type_acte_ref?.ids?.[0] ?? null,
      numero_acte: form.numero_acte || null,
      date: form.date || null,
      heure: form.heure || null,

      lieu_situation: form.lieu_situation,
      lieu_autre_bureau: form.lieu_situation === "autre_bureau" ? form.lieu_autre_bureau || null : null,
      lieu_transport_raison: form.lieu_situation === "transporte" ? form.lieu_transport_raison || null : null,

      // legacy (à supprimer plus tard)
      comparution_observations: form.lieu_situation === "transporte" ? form.comparution_observations || null : null,

      mentions_marginales_presentes: Boolean(form.mentions_marginales_presentes),
      auteur_fonction: form.auteur_fonction || null,
    }

    const { error } = await supabase.from("etat_civil_actes").update(patch).eq("id", acteId)

    if (error) {
      setErrorMsg(error.message)
      setSaving(false)
      return
    }

    try {
      await upsertSources()
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Erreur lors de l’enregistrement des sources.")
      setSaving(false)
      return
    }

    setSaving(false)
    await onUpdated?.()
  }

  const currentTypeActeLabels = toLabels((form as any).type_acte_ref) // ou form.type_acte_ref
  const currentTypeActeIds = toIds((form as any).type_acte_ref)

  const openDictionnaire = (
    kind: DictionnaireKind,
    title: string,
    multi = true,
    defaultSelectedIds: string[] = [],
  ) => {
    setDictArgs({
      kind,
      title,
      multi,
      defaultSelectedIds,
      onValidate: async (items) => {
        const ids = items.map((i) => i.id)
        const labels = items.map((i) => i.label)
        setField("type_acte_ref", { ids, labels })

        setDictOpen(false)
      },
    })
    setDictOpen(true)
  };

  const clearDictValue = (field: "type_acte_ref") => {
    setField(field, null)
  }
  return (
    <div className="p-4">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-10">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Référence archive</h2>
            <div className="mt-1 space-y-1">
              <p className="text-sm leading-relaxed text-slate-700">
                Cet onglet vous permet de décrire l’acte en tant que document d’archive : registre, date, lieu de rédaction,
                dépôts de conservation et état du document.
              </p>
              <p>
                <span className="font-semibold text-sm text-slate-700">Il sert à retrouver et citer précisément l’acte.</span>
              </p>
            </div>
          </div>

          <div className="w-fit">
            <label className="block text-xs font-medium text-slate-700">Label</label>
            <div className="mt-1 inline-flex w-fit items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {label}
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Identification</h3>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-6">
              <label className="block text-xs font-medium text-slate-700">Identifiant unique</label>
              <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{acteId}</div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-700">Type d’acte</label>

              <ListeChipsViewSmart
                titre="Type d'acte"
                values={currentTypeActeLabels}
                onEdit={() =>
                  openDictionnaire(
                    "type_acte_ref",
                    "Modifier le type d'acte",
                    false,
                    currentTypeActeIds
                  )
                }
                onDelete={() => clearDictValue("type_acte_ref")}
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-700">Numéro d’acte</label>
              <input
                type="text"
                name="numero_acte"
                value={form.numero_acte}
                onChange={(e) => setField("numero_acte", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-slate-700">Date d’enregistrement</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={(e) => setField("date", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-slate-700">Heure d’enregistrement</label>
              <input
                type="time"
                name="heure"
                value={form.heure}
                onChange={(e) => setField("heure", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-slate-700">Bureau d’enregistrement (affichage)</label>
              <input
                type="text"
                name="bureau_enregistrement_label"
                value={form.bureau_enregistrement_label}
                onChange={(e) => setField("bureau_enregistrement_label", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
              />
              <p className="mt-1 text-xs text-slate-500">Ce libellé n’est pas stocké sur l’acte (source = bureau_id).</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Lieu de rédaction</h3>

          <div className="mt-4 space-y-4">
            <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <legend className="px-1 text-xs font-medium text-slate-700">Situation</legend>

              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-12">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 md:col-span-4">
                  <input
                    type="radio"
                    name="lieu_situation"
                    value="bureau_courant"
                    checked={form.lieu_situation === "bureau_courant"}
                    onChange={() => setField("lieu_situation", "bureau_courant")}
                    className="mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Bureau courant</div>
                    <div className="text-xs text-slate-600">Rédigé au bureau d’état-civil indiqué.</div>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 md:col-span-4">
                  <input
                    type="radio"
                    name="lieu_situation"
                    value="autre_bureau"
                    checked={form.lieu_situation === "autre_bureau"}
                    onChange={() => setField("lieu_situation", "autre_bureau")}
                    className="mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Autre bureau</div>
                    <div className="text-xs text-slate-600">Rédigé dans un autre bureau.</div>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 md:col-span-4">
                  <input
                    type="radio"
                    name="lieu_situation"
                    value="transporte"
                    checked={form.lieu_situation === "transporte"}
                    onChange={() => setField("lieu_situation", "transporte")}
                    className="mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Acte transporté</div>
                    <div className="text-xs text-slate-600">Rédigé hors du bureau.</div>
                  </div>
                </label>
              </div>
            </fieldset>

            {form.lieu_situation === "autre_bureau" && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <label className="block text-xs font-medium text-slate-700">Nom du bureau</label>
                <input
                  type="text"
                  value={form.lieu_autre_bureau}
                  onChange={(e) => setField("lieu_autre_bureau", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                />
              </div>
            )}

            {form.lieu_situation === "transporte" && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="md:col-span-12">
                    <label className="block text-xs font-medium text-slate-700">Raison du transport</label>
                    <textarea
                      value={form.lieu_transport_raison}
                      onChange={(e) => setField("lieu_transport_raison", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                    ></textarea>
                  </div>

                  <div className="md:col-span-12">
                    <div className="flex items-center justify-between gap-3">
                      <label className="block text-xs font-medium text-red-700">Comparution observations (legacy)</label>
                      <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
                        À supprimer
                      </span>
                    </div>
                    <textarea
                      value={form.comparution_observations}
                      onChange={(e) => setField("comparution_observations", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 shadow-sm outline-none placeholder:text-red-400 focus:border-red-300"
                    ></textarea>
                    <p className="mt-1 text-xs text-red-700">
                      Champ hérité (legacy). À remplacer par des champs structurés + <span className="font-medium">mentions_toponymes</span>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <SectionSources sources={sources} loading={loadingSources} onAdd={addSource} onDuplicate={duplicateSource} onRemove={removeSource} onChange={updateSource} />

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Auteur institutionnel</h3>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-slate-700">Fonction</label>
              <select
                value={form.auteur_fonction}
                onChange={(e) => setField("auteur_fonction", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
              >
                <option value=""></option>
                <option>Officier d’état civil</option>
                <option>Prêtre</option>
                <option>Greffier</option>
                <option>Autre</option>
              </select>
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-500">Le nom de l’officiant est rattaché aux acteurs (niveau “entités/acteurs”), pas à l’acte.</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Mentions marginales</h3>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.mentions_marginales_presentes}
                  onChange={(e) => setField("mentions_marginales_presentes", e.target.checked)}
                  className="h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-0"
                />
                Présence de mentions marginales
              </label>
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-500">Le contenu des mentions marginales se trouve dans l'onglet dédié.</p>
        </section>

        {errorMsg && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{errorMsg}</div>}

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
      <Sheet open={dictOpen} onOpenChange={setDictOpen}>
        <SheetContent side="right" className="w-[520px] sm:w-[640px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{dictArgs?.title ?? "Dictionnaire"}</SheetTitle>
            <SheetDescription>Sélection d’une valeur de dictionnaire</SheetDescription>
          </SheetHeader>

          {dictArgs && (
            <DictionnaireEditorPanel
              kind={dictArgs.kind}
              title={dictArgs.title}
              multi={dictArgs.multi}
              defaultSelectedIds={dictArgs.defaultSelectedIds}
              onValidate={dictArgs.onValidate}
              onCancel={() => setDictOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

    </div>
  )
}

function SectionSources({
  sources,
  loading,
  onAdd,
  onDuplicate,
  onRemove,
  onChange,
}: {
  sources: SourceDraft[]
  loading: boolean
  onAdd: () => void
  onDuplicate: (idx: number) => void
  onRemove: (idx: number) => void
  onChange: (idx: number, patch: Partial<SourceDraft>) => void
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Sources & références par dépôts</h3>
          <p className="mt-1 text-sm text-slate-600">Ajoutez une référence par dépôt (mairie, archives départementales, tribunal…).</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
        >
          + Ajouter une source
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {loading && <div className="text-sm text-slate-600">Chargement…</div>}

        {!loading &&
          sources.map((s, idx) => (
            <div key={s.id ?? idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">Source #{idx + 1}</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDuplicate(idx)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50"
                  >
                    Dupliquer
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-700">Dépôt</label>
                  <select
                    value={s.depot_type}
                    onChange={(e) => onChange(idx, { depot_type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                  >
                    <option value=""></option>
                    <option>Mairie</option>
                    <option>Archives départementales</option>
                    <option>Archives du tribunal</option>
                    <option>ANOM</option>
                    <option>Autre</option>
                  </select>
                </div>

                <div className="md:col-span-8">
                  <label className="block text-xs font-medium text-slate-700">Nom du dépôt</label>
                  <input
                    type="text"
                    value={s.nom_depot}
                    onChange={(e) => onChange(idx, { nom_depot: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-700">Série</label>
                  <input
                    type="text"
                    value={s.serie}
                    onChange={(e) => onChange(idx, { serie: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-700">Cote</label>
                  <input
                    type="text"
                    value={s.cote}
                    onChange={(e) => onChange(idx, { cote: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="block text-xs font-medium text-slate-700">Nom du registre</label>
                  <input
                    type="text"
                    value={s.registre}
                    onChange={(e) => onChange(idx, { registre: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-700">Folio / page</label>
                  <input
                    type="text"
                    value={s.folio_page}
                    onChange={(e) => onChange(idx, { folio_page: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-700">Vue / image</label>
                  <input
                    type="text"
                    value={s.vue_image}
                    onChange={(e) => onChange(idx, { vue_image: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-700">Support</label>
                  <select
                    value={s.support}
                    onChange={(e) => onChange(idx, { support: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                  >
                    <option value=""></option>
                    <option>Numérisé</option>
                    <option>Microfilm</option>
                    <option>Original papier</option>
                    <option>Copie</option>
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-700">Langue</label>
                  <input
                    type="text"
                    value={s.langue}
                    onChange={(e) => onChange(idx, { langue: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-700">Écriture</label>
                  <select
                    value={s.ecriture}
                    onChange={(e) => onChange(idx, { ecriture: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                  >
                    <option value=""></option>
                    <option>Manuscrite</option>
                    <option>Dactylographiée</option>
                    <option>Imprimée</option>
                    <option>Mixte</option>
                  </select>
                </div>

                <div className="md:col-span-12">
                  <label className="block text-xs font-medium text-slate-700">État de conservation</label>
                  <textarea
                    value={s.etat_conservation}
                    onChange={(e) => onChange(idx, { etat_conservation: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                  ></textarea>
                </div>

                <div className="md:col-span-12">
                  <label className="block text-xs font-medium text-slate-700">Note</label>
                  <textarea
                    value={s.note}
                    onChange={(e) => onChange(idx, { note: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
                  ></textarea>
                </div>
              </div>
            </div>
          ))}
      </div>
    </section>
  )
}
