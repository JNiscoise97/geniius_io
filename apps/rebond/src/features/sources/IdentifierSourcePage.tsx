// IdentifierSourcePage.tsx
// Page "Identifier une source" — même style visuel que SourcesCorpusPage.
// Layout 2 colonnes : formulaire (gauche) + aperçu live (droite).

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Layers, Library, Bell, ChevronLeft, Loader2, Search, X,
  CheckCircle2, Building2, CalendarDays,
  ScrollText, Landmark, Newspaper, FileText, BookOpen,
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart'
import { EtatCivilStep } from './EtatCivilStep'
import type { BureauOption } from './source.types'

// ── Helpers titre (même logique que SourceDialog) ─────────────────────────────

function normSpaces(s: string) { return (s ?? '').replace(/\s+/g, ' ').trim() }
function stripAllSpaces(s: string) { return (s ?? '').replace(/\s+/g, '') }
function formatDeSerie(s: string) {
  const low = normSpaces(s).toLowerCase()
  return /^[aeiouyàâäáæãåèêëéìîïíòôöóœùûüúÿh]/i.test(low) ? `d'${low}` : `de ${low}`
}
function joinWithEt(items: string[]) {
  const c = items.map(normSpaces).filter(Boolean)
  if (!c.length) return ''
  if (c.length === 1) return c[0]
  if (c.length === 2) return `${c[0]} et ${c[1]}`
  return `${c.slice(0, -1).join(', ')} et ${c[c.length - 1]}`
}
function joinWithSlash(items: string[]) { return items.map(normSpaces).filter(Boolean).join(' / ') }

// ── Types ─────────────────────────────────────────────────────────────────────

type TypeUniteOption = { id: string; code: string; label: string }
type SerieOption     = { id: string; code: string; label: string }
type TypeActeOption  = { id: string; label_pluriel: string; ordre: number | null }

type DepotOption = {
  id: string
  nomDepot: string
  instNom:   string | null
  instSigle: string | null
  ville:     string | null
  pays:      string | null
  label:     string
}

type SimilarSource = {
  id: string
  titre: string
  couverture_label: string | null
  statut: string
  nb_exemplaires: number
}

// Mapping série code → style visuel (même que SourcesCorpusPage TYPE_CONFIG)
const SERIE_TYPE_CONFIG: Record<string, {
  label: string; Icon: React.ElementType
  color: string; bg: string; border: string
}> = {
  ETAT_CIVIL: { label: 'État civil', Icon: ScrollText, color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  FONCIER:    { label: 'Foncier',    Icon: Landmark,   color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200' },
  ANNUAIRE:   { label: 'Annuaire',   Icon: Newspaper,  color: 'text-sky-700',    bg: 'bg-sky-50',    border: 'border-sky-200' },
  NOTARIAL:   { label: 'Notarial',   Icon: FileText,   color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  PAROISSIAL: { label: 'Paroissial', Icon: BookOpen,   color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
}
const DEFAULT_TYPE = { label: 'Source', Icon: Library, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }

// ── Composant ─────────────────────────────────────────────────────────────────

export function IdentifierSourcePage() {
  const navigate = useNavigate()

  // ── Form state ──────────────────────────────────────────────────────────────
  const [typeUniteRef, setTypeUniteRef] = useState<string | null>(null)
  const [serieRef,     setSerieRef]     = useState<string | null>(null)
  const [couverture,   setCouverture]   = useState('')
  const [enLigne,      setEnLigne]      = useState(false)
  const [url,          setUrl]          = useState('')
  const [depotId,      setDepotId]      = useState('')
  const [depotSearch,  setDepotSearch]  = useState('')
  const [depotOpen,    setDepotOpen]    = useState(false)
  const [coteLocale,   setCoteLocale]   = useState('')
  const [bureauIds,    setBureauIds]    = useState<string[]>([])
  const [typeActeIds,  setTypeActeIds]  = useState<string[]>([])
  const [submitting,   setSubmitting]   = useState(false)
  const [similarSources, setSimilarSources] = useState<SimilarSource[]>([])
  const [loadingSimilar,  setLoadingSimilar]  = useState(false)

  // ── Lookups ─────────────────────────────────────────────────────────────────
  const [typeUnites,  setTypeUnites]  = useState<TypeUniteOption[]>([])
  const [series,      setSeries]      = useState<SerieOption[]>([])
  const [bureaux,     setBureaux]     = useState<BureauOption[]>([])
  const [depots,      setDepots]      = useState<DepotOption[]>([])
  const [typesActes,  setTypesActes]  = useState<TypeActeOption[]>([])
  const [loading,     setLoading]     = useState(true)

  const depotSearchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void (async () => {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        supabase.from('ref_type_unite').select('id, code, label').order('position').order('label'),
        supabase.from('ref_series_documentaires').select('id, code, label').order('label'),
        supabase.from('etat_civil_bureaux').select('id, nom, commune, departement, region').order('nom'),
        supabase.from('ref_depots')
          .select('id, nom, ville, pays, institution:ref_institutions (nom, sigle)')
          .order('institution(nom)', { ascending: true })
          .order('nom', { ascending: true }),
        supabase.from('ref_ec_type_acte').select('id, label_pluriel, position').order('position').order('label_pluriel'),
      ])

      if (r1.data) setTypeUnites(r1.data as TypeUniteOption[])
      if (r2.data) setSeries(r2.data as SerieOption[])
      if (r3.data) setBureaux((r3.data as any[]).map(b => ({
        id: b.id, nom: b.nom ?? '—', commune: b.commune ?? null,
        departement: b.departement ?? null, region: b.region ?? null,
        label: b.commune ? `${b.nom} (${b.commune})` : b.nom,
      })))
      if (r4.data) setDepots((r4.data as any[]).map(d => {
        const inst = d.institution as { nom?: string; sigle?: string } | null
        const instNom   = inst?.nom ?? null
        const instSigle = inst?.sigle ?? null
        const label = instSigle
          ? `${instSigle} — ${d.nom}`
          : `${instNom ?? 'Institution inconnue'} — ${d.nom}`
        return { id: d.id, nomDepot: d.nom, instNom, instSigle, ville: d.ville ?? null, pays: d.pays ?? null, label }
      }))
      if (r5.data) setTypesActes((r5.data as any[]).map(a => ({
        id: a.id, label_pluriel: a.label_pluriel, ordre: a.position ?? null,
      })))
      setLoading(false)
    })()
  }, [])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const serieItem    = useMemo(() => series.find(s => s.id === serieRef), [series, serieRef])
  const serieLabel   = serieItem?.label ?? ''
  const serieCode    = (serieItem?.code ?? '').toUpperCase()
  const isEtatCivil  = serieCode === 'ETAT_CIVIL'
  const typeUniteLabel = useMemo(() => typeUnites.find(t => t.id === typeUniteRef)?.label ?? '', [typeUnites, typeUniteRef])
  const selectedDepot  = useMemo(() => depots.find(d => d.id === depotId) ?? null, [depots, depotId])

  const selectedBureauxLabels = useMemo(() => {
    const map = new Map(bureaux.map(b => [b.id, b.label]))
    return bureauIds.map(id => map.get(id)).filter(Boolean) as string[]
  }, [bureaux, bureauIds])

  const selectedTypeActeLabels = useMemo(() => {
    const map = new Map(typesActes.map(t => [t.id, { label: t.label_pluriel, ordre: t.ordre ?? 9999 }]))
    return typeActeIds
      .map(id => map.get(id)).filter(Boolean)
      .sort((a, b) => a!.ordre - b!.ordre || a!.label.localeCompare(b!.label, 'fr'))
      .map(x => x!.label)
  }, [typesActes, typeActeIds])

  // Recherche dépôt : filtre sur inst sigle/nom, ville, nom dépôt
  const filteredDepots = useMemo(() => {
    const q = depotSearch.trim().toLowerCase()
    if (!q) return depots
    return depots.filter(d =>
      d.instSigle?.toLowerCase().includes(q) ||
      d.instNom?.toLowerCase().includes(q) ||
      d.nomDepot.toLowerCase().includes(q) ||
      d.ville?.toLowerCase().includes(q) ||
      d.pays?.toLowerCase().includes(q)
    )
  }, [depots, depotSearch])

  // ── Sources similaires ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!serieRef) { setSimilarSources([]); return }
    let cancelled = false
    setLoadingSimilar(true)
    void (async () => {
      const { data } = await supabase
        .from('ref_unites_documentaires')
        .select('id, titre, couverture_label, statut, ref_exemplaires(id)')
        .eq('serie_ref', serieRef)
        .is('parent_ud_id', null)
        .order('couverture_sort_start', { ascending: true, nullsFirst: false })
        .limit(30)
      if (cancelled) return
      let results: SimilarSource[] = (data ?? []).map((d: any) => ({
        id: d.id,
        titre: d.titre,
        couverture_label: d.couverture_label,
        statut: d.statut,
        nb_exemplaires: Array.isArray(d.ref_exemplaires) ? d.ref_exemplaires.length : 0,
      }))
      if (isEtatCivil && bureauIds.length > 0) {
        const { data: pivotData } = await supabase
          .from('ref_unites_documentaires_bureaux')
          .select('unite_id')
          .in('bureau_id', bureauIds)
        if (!cancelled) {
          const matchingIds = new Set((pivotData ?? []).map((p: any) => p.unite_id))
          results = results.filter(r => matchingIds.has(r.id))
        }
      }
      if (!cancelled) {
        setSimilarSources(results)
        setLoadingSimilar(false)
      }
    })()
    return () => { cancelled = true }
  }, [serieRef, bureauIds, isEtatCivil])

  // ── Titre auto-généré ────────────────────────────────────────────────────────
  const titre = useMemo(() => {
    const periodeStr = couverture.trim() ? stripAllSpaces(normSpaces(couverture)) : ''
    const parts: string[] = []
    if (typeUniteLabel && serieLabel) parts.push(`${typeUniteLabel} ${formatDeSerie(serieLabel)}`)
    else if (serieLabel) parts.push(serieLabel)
    else if (typeUniteLabel) parts.push(typeUniteLabel)

    if (isEtatCivil) {
      const actes = joinWithEt(selectedTypeActeLabels).toLowerCase()
      if (actes && parts.length > 0) parts[0] = `${parts[0]} des ${actes}`
      const b = joinWithSlash(selectedBureauxLabels)
      if (b) parts.push(`– ${b}`)
    }
    if (periodeStr) parts.push(`(${periodeStr})`)
    return parts.join(' ').replace(/\s+–\s+/g, ' – ').replace(/\s+/g, ' ').trim()
  }, [typeUniteLabel, serieLabel, couverture, isEtatCivil, selectedTypeActeLabels, selectedBureauxLabels])

  // ── Validation ───────────────────────────────────────────────────────────────
  const canSubmit = useMemo(() =>
    !!typeUniteRef && !!serieRef && !!depotId &&
    (!isEtatCivil || (bureauIds.length > 0 && typeActeIds.length > 0)),
    [typeUniteRef, serieRef, depotId, isEtatCivil, bureauIds, typeActeIds]
  )

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    let uniteId: string | null = null
    try {
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
        .select('id').single()
      if (eUnite) throw eUnite
      uniteId = unite.id

      if (isEtatCivil) {
        if (bureauIds.length) {
          const { error } = await supabase.from('ref_unites_documentaires_bureaux')
            .insert(bureauIds.map(bid => ({ unite_id: uniteId!, bureau_id: bid })))
          if (error) throw error
        }
        if (typeActeIds.length) {
          const { error } = await supabase.from('ref_unites_documentaires_types_actes')
            .insert(typeActeIds.map(tid => ({ unite_id: uniteId!, type_acte_id: tid })))
          if (error) throw error
        }
      }

      const { data: ex, error: eEx } = await supabase
        .from('ref_exemplaires')
        .insert({ unite_documentaire_id: uniteId, depot_id: depotId, cote_locale: coteLocale.trim() || null })
        .select('id').single()
      if (eEx) throw eEx

      if (enLigne && url.trim()) {
        const { error } = await supabase.from('ref_acces_numeriques')
          .insert({ exemplaire_id: ex.id, url_base: url.trim() })
        if (error) throw error
      }

      toast.success('Source identifiée')
      navigate('/mock/sources-corpus')
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message ?? 'Erreur lors de la création')
      if (uniteId) await supabase.from('ref_unites_documentaires').delete().eq('id', uniteId)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Sélection dépôt ──────────────────────────────────────────────────────────
  function selectDepot(d: DepotOption) {
    setDepotId(d.id)
    setDepotSearch('')
    setDepotOpen(false)
  }
  function clearDepot() {
    setDepotId('')
    setDepotSearch('')
    setDepotOpen(false)
    setTimeout(() => depotSearchRef.current?.focus(), 50)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold text-gray-900 tracking-tight">REBOND</span>
          <span className="text-gray-300 text-sm">/</span>
          <button
            onClick={() => navigate('/mock/sources-corpus')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <Library className="w-4 h-4" />Patrimoine documentaire
          </button>
          <span className="text-gray-300 text-sm">/</span>
          <span className="text-sm font-medium text-gray-800">Identifier une source</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-1"><Bell className="w-5 h-5 text-gray-400" /></button>
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">JB</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Hero row */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/mock/sources-corpus')}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />Retour
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Identifier une source</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Étape 1 sur 3 · La qualification et la documentation se feront ensuite.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/mock/sources-corpus')}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Création…</>
                : <><CheckCircle2 className="w-4 h-4" />Identifier cette source</>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400 gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />Chargement des référentiels…
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_360px] gap-6 items-start">

            {/* ── Colonne gauche ─────────────────────────────────────────── */}
            <div className="space-y-4">

              {/* Titre auto-généré */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Titre · généré automatiquement
                </p>
                <div className={[
                  'rounded-lg border px-4 py-3 text-sm font-medium min-h-[44px]',
                  titre
                    ? 'border-indigo-100 bg-indigo-50/40 text-gray-900'
                    : 'border-gray-100 bg-gray-50 text-gray-400 italic',
                ].join(' ')}>
                  {titre || 'Renseigne le format et le type pour générer le titre…'}
                </div>
              </div>

              {/* Section Description */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Description du fonds
                </p>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    Format physique <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-[11px] text-gray-400 -mt-0.5">
                    Le support matériel du fonds (registre, volume, liasse…)
                  </p>
                  <RefSinglePickerSmart
                    table="ref_type_unite"
                    mode="edit"
                    value={typeUniteRef}
                    onChange={setTypeUniteRef}
                    titleOverride="Format physique"
                    placeholderEmpty="Sélectionner un format…"
                    orderBy={{ column: 'position', ascending: true }}
                    columns={{ code: true, label: true, description: true }}
                    showDescriptionUnderRadio
                    actionsInvisible={false}
                  />
                </div>

                <div className="h-px bg-gray-100" />

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">
                    Type de source <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-[11px] text-gray-400 -mt-0.5">
                    La nature des documents produits (état civil, notarial, foncier…)
                  </p>
                  <RefSinglePickerSmart
                    table="ref_series_documentaires"
                    mode="edit"
                    value={serieRef}
                    onChange={v => { setSerieRef(v); setBureauIds([]); setTypeActeIds([]) }}
                    titleOverride="Type de source"
                    placeholderEmpty="Sélectionner un type…"
                    columns={{ code: true, label: true, description: true }}
                    showDescriptionUnderRadio
                    actionsInvisible={false}
                  />
                </div>

                <div className="h-px bg-gray-100" />

                <div className="space-y-1.5">
                  <Label htmlFor="couverture" className="text-xs font-medium text-gray-700">
                    Période couverte
                    <span className="ml-1.5 text-[11px] font-normal text-gray-400">(optionnel)</span>
                  </Label>
                  <p className="text-[11px] text-gray-400 -mt-0.5">
                    Exemples : 1780-1810 · an IV-1830 · 1780, 1790-1800
                  </p>
                  <Input
                    id="couverture"
                    value={couverture}
                    onChange={e => setCouverture(e.target.value)}
                    placeholder="ex. 1860-1902"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Section État civil (conditionnelle) */}
              {isEtatCivil && (
                <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center">
                      <ScrollText className="w-3 h-3 text-blue-600" />
                    </div>
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      Précisions état civil
                    </p>
                  </div>
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

              {/* Section Conservation */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Conservation &amp; localisation
                </p>

                {/* ── Recherche dépôt ──────────────────────────────────────── */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-700">
                    Institution / dépôt de conservation <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-[11px] text-gray-400 -mt-0.5">
                    Recherche par sigle, nom d'institution ou ville (AD, ANOM, BnF…)
                  </p>

                  {/* Chip quand sélectionné */}
                  {selectedDepot ? (
                    <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                      <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {selectedDepot.instSigle ?? selectedDepot.instNom ?? 'Institution'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {selectedDepot.nomDepot}
                          {selectedDepot.ville ? ` · ${selectedDepot.ville}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={clearDepot}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
                        title="Modifier la sélection"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* Champ de recherche */
                    <div className="space-y-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          ref={depotSearchRef}
                          value={depotSearch}
                          onChange={e => { setDepotSearch(e.target.value); setDepotOpen(true) }}
                          onFocus={() => setDepotOpen(true)}
                          onBlur={() => setTimeout(() => setDepotOpen(false), 150)}
                          placeholder="ANOM, Archives de Guadeloupe, Basse-Terre…"
                          className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        />
                      </div>

                      {/* Liste des résultats */}
                      {depotOpen && (
                        <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                          <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                            {filteredDepots.length === 0 ? (
                              <p className="px-4 py-3 text-sm text-gray-400 italic">
                                Aucun résultat pour « {depotSearch} »
                              </p>
                            ) : filteredDepots.slice(0, 20).map(d => (
                              <button
                                key={d.id}
                                onMouseDown={() => selectDepot(d)}
                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-start gap-3 group"
                              >
                                <Building2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0 group-hover:text-indigo-500" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-700">
                                    {d.instSigle
                                      ? <><span className="font-semibold">{d.instSigle}</span> · {d.instNom}</>
                                      : d.instNom ?? 'Institution inconnue'
                                    }
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {d.nomDepot}{d.ville ? ` · ${d.ville}` : ''}{d.pays && d.pays !== 'France' ? ` · ${d.pays}` : ''}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                          {filteredDepots.length > 20 && (
                            <p className="px-4 py-2 text-[11px] text-gray-400 border-t border-gray-100 bg-gray-50">
                              {filteredDepots.length - 20} résultats supplémentaires — affine ta recherche
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="h-px bg-gray-100" />

                {/* Cote locale */}
                <div className="space-y-1.5">
                  <Label htmlFor="cote" className="text-xs font-medium text-gray-700">
                    Cote locale
                    <span className="ml-1.5 text-[11px] font-normal text-gray-400">
                      (optionnel — tu peux la compléter plus tard)
                    </span>
                  </Label>
                  <Input
                    id="cote"
                    value={coteLocale}
                    onChange={e => setCoteLocale(e.target.value)}
                    placeholder="ex. 1E125 · 7DDPC24 · 5MI 12"
                    className="text-sm font-mono"
                  />
                </div>

                <div className="h-px bg-gray-100" />

                {/* En ligne */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      id="en-ligne"
                      checked={enLigne}
                      onCheckedChange={v => { setEnLigne(!!v); if (!v) setUrl('') }}
                    />
                    <div>
                      <Label htmlFor="en-ligne" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Disponible en ligne
                      </Label>
                      <p className="text-[11px] text-gray-400">Un accès numérique existe (scan, visionneuse…)</p>
                    </div>
                  </div>

                  {enLigne && (
                    <div className="space-y-1.5 pl-7">
                      <Label htmlFor="url" className="text-xs font-medium text-gray-700">
                        URL <span className="ml-1.5 text-[11px] font-normal text-gray-400">(optionnel)</span>
                      </Label>
                      <Input
                        id="url"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://…"
                        type="url"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Colonne droite : sources similaires ──────────────────── */}
            <div className="sticky top-24">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Sources similaires
                  </p>
                  {serieRef && !loadingSimilar && (
                    <span className="text-xs text-gray-400 tabular-nums">
                      {similarSources.length} trouvée{similarSources.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Body */}
                {!serieRef ? (
                  <p className="px-5 py-8 text-xs text-gray-400 italic text-center leading-relaxed">
                    Sélectionne un type de source pour voir les sources existantes et éviter les doublons.
                  </p>
                ) : loadingSimilar ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-xs text-gray-400">
                    <Loader2 className="w-3 h-3 animate-spin" />Recherche…
                  </div>
                ) : similarSources.length === 0 ? (
                  <div className="px-5 py-8 text-center space-y-1">
                    <p className="text-sm font-medium text-gray-600">Aucune source de ce type</p>
                    <p className="text-xs text-gray-400">Tu peux créer la première !</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
                    {similarSources.map(s => (
                      <div key={s.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                        <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">{s.titre}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {s.couverture_label && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                              <CalendarDays className="w-2.5 h-2.5" />{s.couverture_label}
                            </span>
                          )}
                          <span className={[
                            'text-[10px] font-medium px-1.5 py-0.5 rounded',
                            s.statut === 'actif'       ? 'bg-emerald-50 text-emerald-600' :
                            s.statut === 'a_qualifier' ? 'bg-orange-50 text-orange-600' :
                            'bg-gray-50 text-gray-500',
                          ].join(' ')}>
                            {s.statut === 'actif' ? 'Actif' : s.statut === 'a_qualifier' ? 'À qualifier' : s.statut}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {s.nb_exemplaires} ex.
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
