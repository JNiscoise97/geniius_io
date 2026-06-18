// IdentifierSourceDialog.tsx
// Modale dédiée à l'étape "Identifier" du cycle de vie d'une source (P1.1 step 1).
// Crée : ref_unites_documentaires (statut='a_qualifier') + ref_exemplaires (cote optionnelle)
//         + pivots EC si ETAT_CIVIL + ref_acces_numeriques si URL fournie.

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart'
import { EtatCivilStep } from './EtatCivilStep'
import type { BureauOption } from './source.types'

// ── Helpers de génération du titre (même logique que SourceDialog) ────────────

function normSpaces(s: string) {
  return (s ?? '').replace(/\s+/g, ' ').trim()
}
function stripAllSpaces(s: string) {
  return (s ?? '').replace(/\s+/g, '')
}
function formatDeSerie(serie: string): string {
  const s = normSpaces(serie).toLowerCase()
  if (!s) return ''
  const startsWithVowel = /^[aeiouyàâäáæãåèêëéìîïíòôöóœùûüúÿh]/i.test(s)
  return startsWithVowel ? `d'${s}` : `de ${s}`
}
function joinWithEt(items: string[]) {
  const clean = items.map(normSpaces).filter(Boolean)
  if (clean.length === 0) return ''
  if (clean.length === 1) return clean[0]
  if (clean.length === 2) return `${clean[0]} et ${clean[1]}`
  return `${clean.slice(0, -1).join(', ')} et ${clean[clean.length - 1]}`
}
function joinWithSlash(items: string[]) {
  return items.map(normSpaces).filter(Boolean).join(' / ')
}

// ── Types internes ────────────────────────────────────────────────────────────

type TypeUniteOption = { id: string; code: string; label: string }
type SerieOption     = { id: string; code: string; label: string }
type DepotOption     = { id: string; label: string }
type TypeActeOption  = { id: string; label_pluriel: string; ordre: number | null }

type Props = {
  open: boolean
  onClose: () => void
  onCreated: () => void | Promise<void>
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function IdentifierSourceDialog({ open, onClose, onCreated }: Props) {

  // ── Form state ──────────────────────────────────────────────────────────────
  const [typeUniteRef, setTypeUniteRef] = useState<string | null>(null)
  const [serieRef,     setSerieRef]     = useState<string | null>(null)
  const [couverture,   setCouverture]   = useState('')
  const [enLigne,      setEnLigne]      = useState(false)
  const [url,          setUrl]          = useState('')
  const [depotId,      setDepotId]      = useState<string>('')
  const [coteLocale,   setCoteLocale]   = useState('')
  const [bureauIds,    setBureauIds]    = useState<string[]>([])
  const [typeActeIds,  setTypeActeIds]  = useState<string[]>([])
  const [submitting,   setSubmitting]   = useState(false)

  // ── Lookups ─────────────────────────────────────────────────────────────────
  const [typeUnites,   setTypeUnites]   = useState<TypeUniteOption[]>([])
  const [series,       setSeries]       = useState<SerieOption[]>([])
  const [bureaux,      setBureaux]      = useState<BureauOption[]>([])
  const [depots,       setDepots]       = useState<DepotOption[]>([])
  const [typesActes,   setTypesActes]   = useState<TypeActeOption[]>([])
  const [loading,      setLoading]      = useState(false)

  // ── Load lookups on open ────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    setLoading(true)
    void (async () => {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        supabase.from('ref_type_unite').select('id, code, label').order('position').order('label'),
        supabase.from('ref_series_documentaires').select('id, code, label').order('label'),
        supabase.from('etat_civil_bureaux').select('id, nom, commune, departement, region').order('nom'),
        supabase
          .from('ref_depots')
          .select('id, nom, institution:ref_institutions (nom, sigle)')
          .order('institution(nom)', { ascending: true })
          .order('nom', { ascending: true }),
        supabase.from('ref_ec_type_acte').select('id, label_pluriel, position').order('position').order('label_pluriel'),
      ])

      if (r1.data) setTypeUnites(r1.data as TypeUniteOption[])
      if (r2.data) setSeries(r2.data as SerieOption[])

      if (r3.data) {
        setBureaux((r3.data as any[]).map(b => ({
          id: b.id,
          nom: b.nom ?? '—',
          commune: b.commune ?? null,
          departement: b.departement ?? null,
          region: b.region ?? null,
          label: b.commune ? `${b.nom} (${b.commune})` : b.nom,
        })))
      }

      if (r4.data) {
        setDepots((r4.data as any[]).map(d => {
          const inst = d.institution as { nom?: string; sigle?: string } | null
          const label = inst?.sigle
            ? `${inst.sigle} — ${d.nom}`
            : `${inst?.nom ?? 'Institution'} — ${d.nom}`
          return { id: d.id, label }
        }))
      }

      if (r5.data) {
        setTypesActes((r5.data as any[]).map(a => ({
          id: a.id,
          label_pluriel: a.label_pluriel,
          ordre: a.position ?? null,
        })))
      }

      setLoading(false)
    })()
  }, [open])

  // ── Reset on close ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) return
    setTypeUniteRef(null)
    setSerieRef(null)
    setCouverture('')
    setEnLigne(false)
    setUrl('')
    setDepotId('')
    setCoteLocale('')
    setBureauIds([])
    setTypeActeIds([])
  }, [open])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const serieItem   = useMemo(() => series.find(s => s.id === serieRef), [series, serieRef])
  const serieLabel  = serieItem?.label ?? ''
  const isEtatCivil = (serieItem?.code ?? '').toUpperCase() === 'ETAT_CIVIL'

  const typeUniteLabel = useMemo(
    () => typeUnites.find(t => t.id === typeUniteRef)?.label ?? '',
    [typeUnites, typeUniteRef],
  )

  const selectedBureauxLabels = useMemo(() => {
    const map = new Map(bureaux.map(b => [b.id, b.label]))
    return bureauIds.map(id => map.get(id)).filter(Boolean) as string[]
  }, [bureaux, bureauIds])

  const selectedTypeActeLabels = useMemo(() => {
    const map = new Map(typesActes.map(t => [t.id, { label_pluriel: t.label_pluriel, ordre: t.ordre ?? 9999 }]))
    return typeActeIds
      .map(id => map.get(id))
      .filter(Boolean)
      .sort((a, b) => a!.ordre - b!.ordre || a!.label_pluriel.localeCompare(b!.label_pluriel, 'fr'))
      .map(x => x!.label_pluriel)
  }, [typesActes, typeActeIds])

  // ── Titre auto-généré ────────────────────────────────────────────────────────
  const titre = useMemo(() => {
    const periodeNoSpaces = couverture.trim() ? stripAllSpaces(normSpaces(couverture)) : ''
    const parts: string[] = []

    if (typeUniteLabel && serieLabel) {
      parts.push(`${typeUniteLabel} ${formatDeSerie(serieLabel)}`)
    } else if (serieLabel) {
      parts.push(serieLabel)
    } else if (typeUniteLabel) {
      parts.push(typeUniteLabel)
    }

    if (isEtatCivil) {
      const actes = joinWithEt(selectedTypeActeLabels).toLowerCase()
      if (actes && parts.length > 0) parts[0] = `${parts[0]} des ${actes}`
      const b = joinWithSlash(selectedBureauxLabels)
      if (b) parts.push(`– ${b}`)
    }

    if (periodeNoSpaces) parts.push(`(${periodeNoSpaces})`)

    return parts.join(' ').replace(/\s+–\s+/g, ' – ').replace(/\s+/g, ' ').trim()
  }, [typeUniteLabel, serieLabel, couverture, isEtatCivil, selectedTypeActeLabels, selectedBureauxLabels])

  // ── Validation ───────────────────────────────────────────────────────────────
  const canSubmit = useMemo(() => {
    if (!typeUniteRef || !serieRef || !depotId) return false
    if (isEtatCivil && (bureauIds.length === 0 || typeActeIds.length === 0)) return false
    return true
  }, [typeUniteRef, serieRef, depotId, isEtatCivil, bureauIds, typeActeIds])

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    let uniteId: string | null = null
    try {
      // 1) Unité documentaire
      const { data: unite, error: eUnite } = await supabase
        .from('ref_unites_documentaires')
        .insert({
          type_unite_ref: typeUniteRef,
          titre: titre || 'Source sans titre',
          serie_ref: serieRef,
          couverture_label: couverture.trim() || null,
          statut: 'a_qualifier',
          workflow_statut: 'a_transcrire',
        })
        .select('id')
        .single()
      if (eUnite) throw eUnite
      uniteId = unite.id

      // 2) Pivots EC
      if (isEtatCivil) {
        if (bureauIds.length) {
          const { error } = await supabase
            .from('ref_unites_documentaires_bureaux')
            .insert(bureauIds.map(bid => ({ unite_id: uniteId!, bureau_id: bid })))
          if (error) throw error
        }
        if (typeActeIds.length) {
          const { error } = await supabase
            .from('ref_unites_documentaires_types_actes')
            .insert(typeActeIds.map(tid => ({ unite_id: uniteId!, type_acte_id: tid })))
          if (error) throw error
        }
      }

      // 3) Exemplaire (dépôt requis, cote optionnelle)
      const { data: ex, error: eEx } = await supabase
        .from('ref_exemplaires')
        .insert({
          unite_documentaire_id: uniteId,
          depot_id: depotId,
          cote_locale: coteLocale.trim() || null,
        })
        .select('id')
        .single()
      if (eEx) throw eEx

      // 4) Accès numérique si URL fournie
      if (enLigne && url.trim()) {
        const { error } = await supabase
          .from('ref_acces_numeriques')
          .insert({ exemplaire_id: ex.id, url_base: url.trim() })
        if (error) throw error
      }

      toast.success('Source identifiée')
      await onCreated()
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message ?? 'Erreur lors de la création')
      // rollback best-effort
      if (uniteId) {
        await supabase.from('ref_unites_documentaires').delete().eq('id', uniteId)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={v => !v ? onClose() : undefined}>
      <DialogContent
        className="flex flex-col overflow-hidden p-0"
        style={{ width: '640px', maxWidth: '95vw', height: '85vh', maxHeight: 'none' }}
      >
        {/* Header */}
        <div className="shrink-0 border-b px-6 py-4">
          <DialogHeader className="p-0">
            <DialogTitle>Identifier une source</DialogTitle>
          </DialogHeader>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">

          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement…
            </div>
          ) : (
            <>
              {/* Titre auto-généré */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Titre (généré automatiquement)
                </Label>
                <Input
                  value={titre}
                  readOnly
                  placeholder="Renseigne le format et le type pour générer le titre…"
                  className="bg-muted text-sm"
                />
              </div>

              {/* Type d'unité */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Format physique <span className="text-destructive">*</span>
                </Label>
                <RefSinglePickerSmart
                  table="ref_type_unite"
                  mode="edit"
                  value={typeUniteRef}
                  onChange={setTypeUniteRef}
                  titleOverride="Format physique"
                  placeholderEmpty="Sélectionner…"
                  orderBy={{ column: 'position', ascending: true }}
                  columns={{ code: true, label: true, description: true }}
                  showDescriptionUnderRadio
                />
              </div>

              {/* Série / Type de source */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Type de source <span className="text-destructive">*</span>
                </Label>
                <RefSinglePickerSmart
                  table="ref_series_documentaires"
                  mode="edit"
                  value={serieRef}
                  onChange={setSerieRef}
                  titleOverride="Type de source"
                  placeholderEmpty="Sélectionner…"
                  columns={{ code: true, label: true, description: true }}
                  showDescriptionUnderRadio
                />
              </div>

              {/* Période couverte */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Période couverte <span className="text-muted-foreground font-normal">(optionnel)</span>
                </Label>
                <Input
                  value={couverture}
                  onChange={e => setCouverture(e.target.value)}
                  placeholder="ex. 1780-1810, an IV-1830"
                  className="text-sm"
                />
              </div>

              {/* En ligne */}
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="en-ligne"
                  checked={enLigne}
                  onCheckedChange={v => { setEnLigne(!!v); if (!v) setUrl('') }}
                />
                <Label htmlFor="en-ligne" className="text-sm font-medium cursor-pointer">
                  Disponible en ligne
                </Label>
              </div>

              {/* URL si en ligne */}
              {enLigne && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    URL <span className="text-muted-foreground font-normal">(optionnel)</span>
                  </Label>
                  <Input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://…"
                    type="url"
                    className="text-sm"
                  />
                </div>
              )}

              {/* Champs État civil */}
              {isEtatCivil && (
                <div className="rounded-md border p-4 space-y-3 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    État civil
                  </p>
                  <EtatCivilStep
                    isEtatCivil={isEtatCivil}
                    serieLabel={serieLabel}
                    bureaux={bureaux}
                    bureauIds={bureauIds}
                    setBureauIds={setBureauIds}
                    typeActeIds={typeActeIds}
                    setTypeActeIds={setTypeActeIds}
                  />
                </div>
              )}

              {/* Dépôt */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Dépôt <span className="text-destructive">*</span>
                </Label>
                <Select value={depotId} onValueChange={setDepotId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Sélectionner un dépôt…" />
                  </SelectTrigger>
                  <SelectContent>
                    {depots.map(d => (
                      <SelectItem key={d.id} value={d.id} className="text-sm">
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cote locale */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Cote locale <span className="text-muted-foreground font-normal">(optionnel)</span>
                </Label>
                <Input
                  value={coteLocale}
                  onChange={e => setCoteLocale(e.target.value)}
                  placeholder="ex. 1E125 ou 7DDPC24"
                  className="text-sm"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t px-6 py-4">
          <DialogFooter className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Dépôt requis · Format et type requis
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Identifier
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
