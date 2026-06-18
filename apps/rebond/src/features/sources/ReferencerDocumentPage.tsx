// ReferencerDocumentPage.tsx
// Recherche d'abord — puis crée ou rattache selon ce qu'on trouve.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Layers, Library, Bell, ChevronLeft, Loader2, Search, X,
  CheckCircle2, Building2, ChevronRight, Plus,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BureauCreateModal } from '@/features/etat-civil/suivi/BureauCreateModal'
import { RegistreCreateModal } from '@/features/etat-civil/suivi/RegistreCreateModal'
import type { EtatCivilBureau, EtatCivilRegistre } from '@/types/etatcivil'

// ── Types ─────────────────────────────────────────────────────────────────────

type TypeActeOption = { id: string; code: string; label: string; color: string | null }
type SerieOption    = { id: string; code: string; label: string }
type DepotOption    = { id: string; nomDepot: string; instNom: string | null; instSigle: string | null; ville: string | null }
type UDResult       = { id: string; titre: string; couverture_label: string | null }

type ExemplaireResult = {
  citationId: string
  loc_raw: string | null
  depotSigle: string | null
  depotNom: string | null
  depotVille: string | null
  cote: string | null
  udId: string | null
  udTitre: string | null
}

type ActeSearchResult = {
  id: string
  label: string | null
  type_acte: string | null
  type_acte_ref: string | null
  date: string | null
  annee: number | null
  numero_acte: string | null
  bureauNom: string | null
  exemplaires: ExemplaireResult[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSingle<T>(x: T | T[] | null | undefined): T | null {
  if (!x) return null
  return Array.isArray(x) ? (x[0] ?? null) : x
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function ReferencerDocumentPage() {
  const navigate = useNavigate()

  // ── Filtres ──────────────────────────────────────────────────────────────────
  const [searchText,    setSearchText]    = useState('')
  const [filterSerieId, setFilterSerieId] = useState<string | null>(null)

  // ── Résultats ────────────────────────────────────────────────────────────────
  const [searchState,  setSearchState]  = useState<'idle' | 'loading' | 'done'>('idle')
  const [results,      setResults]      = useState<ActeSearchResult[]>([])
  const [visibleCount, setVisibleCount] = useState(5)
  const [selectedActe, setSelectedActe] = useState<ActeSearchResult | null>(null)
  const [createMode,   setCreateMode]   = useState(false)

  // ── Formulaire acte (create) ─────────────────────────────────────────────────
  const [serieChipsExpanded,         setSerieChipsExpanded]         = useState(false)
  const [typeChipsExpanded,          setTypeChipsExpanded]          = useState(false)
  const [bureauModalOpen,            setBureauModalOpen]            = useState(false)
  const [registreModalOpen,          setRegistreModalOpen]          = useState(false)
  const [createSerieId,              setCreateSerieId]              = useState<string | null>(null)
  const [createTypeId,               setCreateTypeId]               = useState<string | null>(null)
  const [createBureauId,             setCreateBureauId]             = useState<string | null>(null)
  const [createBureauSearch,         setCreateBureauSearch]         = useState('')
  const [createBureauOpen,           setCreateBureauOpen]           = useState(false)
  const [createRegistreId,           setCreateRegistreId]           = useState<string | null>(null)
  const [createRegistreSearch,       setCreateRegistreSearch]       = useState('')
  const [createRegistreOpen,         setCreateRegistreOpen]         = useState(false)
  const [createNotaireRegistreId,    setCreateNotaireRegistreId]    = useState<string | null>(null)
  const [createNotaireRegistreSearch,setCreateNotaireRegistreSearch]= useState('')
  const [createNotaireRegistreOpen,  setCreateNotaireRegistreOpen]  = useState(false)
  const [createLabel,  setCreateLabel]  = useState('')
  const [createNumero, setCreateNumero] = useState('')

  // ── Source parente (UD parente de l'UD acte) ─────────────────────────────────
  const [parentUdMode,      setParentUdMode]      = useState<'search' | 'approx'>('search')
  const [parentUdSearch,    setParentUdSearch]    = useState('')
  const [parentUdResults,   setParentUdResults]   = useState<UDResult[]>([])
  const [parentUdSearching, setParentUdSearching] = useState(false)
  const [selectedParentUd,  setSelectedParentUd]  = useState<UDResult | null>(null)
  const [parentUdApprox,    setParentUdApprox]    = useState('')

  // ── Formulaire exemplaire ────────────────────────────────────────────────────
  const [depotId,     setDepotId]     = useState('')
  const [depotSearch, setDepotSearch] = useState('')
  const [depotOpen,   setDepotOpen]   = useState(false)
  const [coteLocale,  setCoteLocale]  = useState('')
  const [locRaw,      setLocRaw]      = useState('')

  // ── Lookups ───────────────────────────────────────────────────────────────────
  const [typesActes,      setTypesActes]      = useState<TypeActeOption[]>([])
  const [series,          setSeries]          = useState<SerieOption[]>([])
  const [depots,          setDepots]          = useState<DepotOption[]>([])
  const [bureaux,         setBureaux]         = useState<{id:string; nom:string; commune:string|null}[]>([])
  const [registres,       setRegistres]       = useState<{id:string; label:string; annee:number; type_acte:string|null}[]>([])
  const [notaireRegistres,setNotaireRegistres]= useState<{id:string; registre:string}[]>([])
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const depotSearchRef = useRef<HTMLInputElement>(null)

  // ── Load lookups ──────────────────────────────────────────────────────────────
  useEffect(() => {
    void (async () => {
      const [r1, r2, r3, r4] = await Promise.all([
        supabase.from('ref_ec_type_acte').select('id, code, label, color').order('position').order('label'),
        supabase.from('ref_series_documentaires').select('id, code, label').order('label'),
        supabase.from('ref_depots')
          .select('id, nom, ville, institution:ref_institutions (nom, sigle)')
          .order('institution(nom)', { ascending: true }).order('nom'),
        supabase.from('etat_civil_bureaux').select('id, nom, commune').order('commune').order('nom'),
      ])
      if (r1.data) setTypesActes(r1.data as TypeActeOption[])
      if (r2.data) setSeries(r2.data as SerieOption[])
      if (r3.data) setDepots((r3.data as any[]).map(d => {
        const inst = d.institution as { nom?: string; sigle?: string } | null
        return { id: d.id, nomDepot: d.nom, instNom: inst?.nom ?? null, instSigle: inst?.sigle ?? null, ville: d.ville ?? null }
      }))
      if (r4.data) setBureaux(r4.data as any[])
      setLoading(false)
    })()
  }, [])

  // ── Registres EC (chargés quand le bureau de création change) ────────────────
  useEffect(() => {
    setCreateRegistreId(null)
    setRegistres([])
    if (!createBureauId) return
    void supabase
      .from('etat_civil_registres')
      .select('id, label, annee, type_acte')
      .eq('bureau_id', createBureauId)
      .order('annee')
      .then(({ data }) => setRegistres((data ?? []) as any[]))
  }, [createBureauId])

  // ── Registres notariaux (recherche texte libre) ───────────────────────────────
  useEffect(() => {
    const q = createNotaireRegistreSearch.trim()
    if (q.length < 2) { setNotaireRegistres([]); return }
    const t = setTimeout(() => {
      void supabase
        .from('notaire_registres')
        .select('id, registre')
        .ilike('registre', `%${q}%`)
        .limit(10)
        .then(({ data }) => setNotaireRegistres((data ?? []) as any[]))
    }, 300)
    return () => clearTimeout(t)
  }, [createNotaireRegistreSearch])

  // ── Parent UD search ──────────────────────────────────────────────────────────
  useEffect(() => {
    const q = parentUdSearch.trim()
    if (q.length < 2) { setParentUdResults([]); return }
    setParentUdSearching(true)
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('ref_unites_documentaires')
        .select('id, titre, couverture_label')
        .is('parent_ud_id', null)
        .ilike('titre', `%${q}%`)
        .limit(10)
      setParentUdResults((data ?? []) as UDResult[])
      setParentUdSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [parentUdSearch])

  // ── Recherche actes ───────────────────────────────────────────────────────────
  const handleSearch = async () => {
    const q = searchText.trim()
    if (!q && !filterSerieId) return
    setSearchState('loading')
    setSelectedActe(null)
    setCreateMode(false)
    setVisibleCount(5)
    try {

    // null = aucun filtre série → cherche dans les deux tables
    const serieCode: string | null = filterSerieId
      ? (series.find(s => s.id === filterSerieId)?.code?.toUpperCase() ?? null)
      : null

    // ── Série non encore prise en charge ────────────────────────────────────
    if (serieCode && serieCode !== 'ETAT_CIVIL' && serieCode !== 'NOTARIAT') {
      toast.info('Recherche non encore disponible pour cette série')
      setResults([])
      setSearchState('done')
      return
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    const fetchNotarial = async (): Promise<ActeSearchResult[]> => {
      let qN = supabase.from('actes').select('id, label')
      if (q) qN = qN.ilike('label', `%${q}%`)
      const { data, error } = await qN.order('created_at', { ascending: false }).limit(50)
      if (error) throw error

      const actes = data ?? []
      if (!actes.length) return []

      const acteIds = actes.map((a: any) => a.id)
      const { data: citData, error: citError } = await supabase
        .from('citations')
        .select('id, target_id, note, exemplaire_id')
        .eq('target_type', 'ac_acte')
        .in('target_id', acteIds)
      if (citError) throw citError

      const citations = citData ?? []
      const exIds = [...new Set(citations.map((c: any) => c.exemplaire_id).filter(Boolean) as string[])]
      const exByExId = new Map<string, any>()
      if (exIds.length) {
        const { data: exData, error: exError } = await supabase
          .from('v_exemplaires_pick')
          .select('exemplaire_id, cote_locale, depot_nom, institution_nom, institution_sigle, unite_id, unite_titre')
          .in('exemplaire_id', exIds)
        if (exError) throw exError
        for (const row of exData ?? []) {
          if (!exByExId.has(row.exemplaire_id)) exByExId.set(row.exemplaire_id, row)
        }
      }
      const citsByActe = new Map<string, any[]>()
      for (const c of citations) {
        const list = citsByActe.get(c.target_id) ?? []
        list.push(c)
        citsByActe.set(c.target_id, list)
      }

      return actes.map((a: any) => {
        const cits: any[] = citsByActe.get(a.id) ?? []
        const exemplaires: ExemplaireResult[] = cits.map((c: any) => {
          const ex = c.exemplaire_id ? exByExId.get(c.exemplaire_id) : null
          return {
            citationId: c.id,
            loc_raw:    c.note ?? null,
            depotSigle: ex?.institution_sigle ?? null,
            depotNom:   ex?.depot_nom ?? null,
            depotVille: null,
            cote:       ex?.cote_locale ?? null,
            udId:       ex?.unite_id ?? null,
            udTitre:    ex?.unite_titre ?? null,
          }
        })
        return {
          id: a.id, label: a.label ?? null, type_acte: 'notarial', type_acte_ref: null,
          date: null, annee: null, numero_acte: null, bureauNom: null, exemplaires,
        }
      })
    }

    const fetchEC = async (): Promise<ActeSearchResult[]> => {
      let qE = supabase
        .from('etat_civil_actes')
        .select('id, label, type_acte, type_acte_ref, date, annee, numero_acte, bureau:etat_civil_bureaux!bureau_id(nom, commune)')
      if (q) qE = qE.ilike('label', `%${q}%`)
      const { data: actesData, error: actesError } = await qE.order('annee', { ascending: false }).limit(50)
      if (actesError) throw actesError

      const actes = actesData ?? []
      if (!actes.length) return []

      const acteIds = actes.map((a: any) => a.id)
      const { data: citData, error: citError } = await supabase
        .from('citations')
        .select('id, target_id, note, exemplaire_id')
        .eq('target_type', 'ec_acte')
        .in('target_id', acteIds)
      if (citError) throw citError

      const citations = citData ?? []
      const exIds = [...new Set(citations.map((c: any) => c.exemplaire_id).filter(Boolean) as string[])]

      const exByExId = new Map<string, any>()
      if (exIds.length) {
        const { data: exData, error: exError } = await supabase
          .from('v_exemplaires_pick')
          .select('exemplaire_id, cote_locale, depot_nom, institution_nom, institution_sigle, unite_id, unite_titre')
          .in('exemplaire_id', exIds)
        if (exError) throw exError
        for (const row of exData ?? []) {
          if (!exByExId.has(row.exemplaire_id)) exByExId.set(row.exemplaire_id, row)
        }
      }

      const citsByActe = new Map<string, any[]>()
      for (const c of citations) {
        const list = citsByActe.get(c.target_id) ?? []
        list.push(c)
        citsByActe.set(c.target_id, list)
      }

      return actes.map((a: any) => {
        const bureau = toSingle(a.bureau)
        const cits: any[] = citsByActe.get(a.id) ?? []
        const exemplaires: ExemplaireResult[] = cits.map((c: any) => {
          const ex = c.exemplaire_id ? exByExId.get(c.exemplaire_id) : null
          return {
            citationId: c.id,
            loc_raw:    c.note ?? null,
            depotSigle: ex?.institution_sigle ?? null,
            depotNom:   ex?.depot_nom ?? null,
            depotVille: null,
            cote:       ex?.cote_locale ?? null,
            udId:       ex?.unite_id ?? null,
            udTitre:    ex?.unite_titre ?? null,
          }
        })
        return {
          id: a.id, label: a.label, type_acte: a.type_acte, type_acte_ref: a.type_acte_ref,
          date: a.date, annee: a.annee, numero_acte: a.numero_acte,
          bureauNom: bureau ? (bureau.commune ? `${bureau.nom} (${bureau.commune})` : bureau.nom) : null,
          exemplaires,
        }
      })
    }

    // ── Exécution selon filtre série ─────────────────────────────────────────
    let mapped: ActeSearchResult[]
    if (serieCode === 'NOTARIAT') {
      mapped = await fetchNotarial()
    } else if (serieCode === 'ETAT_CIVIL') {
      mapped = await fetchEC()
    } else {
      // Aucun filtre → les deux tables en parallèle
      const [ecRes, notRes] = await Promise.all([fetchEC(), fetchNotarial()])
      mapped = [...ecRes, ...notRes]
    }

    setResults(mapped)
    setSearchState('done')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur inattendue')
      setSearchState('done')
    }
  }

  // Quand on sélectionne un acte, pré-remplir l'UD depuis son premier exemplaire
  function handleSelectActe(acte: ActeSearchResult) {
    setSelectedActe(acte)
    setCreateMode(false)
    setDepotId(''); setDepotSearch(''); setCoteLocale(''); setLocRaw('')
  }

  function handleCreateMode() {
    setCreateMode(true)
    setSelectedActe(null)
    setSerieChipsExpanded(false)
    setTypeChipsExpanded(false)
    setCreateSerieId(null)
    setCreateTypeId(null)
    setCreateBureauId(null); setCreateBureauSearch(''); setCreateBureauOpen(false)
    setCreateRegistreId(null); setCreateRegistreSearch(''); setCreateRegistreOpen(false)
    setCreateNotaireRegistreId(null); setCreateNotaireRegistreSearch(''); setCreateNotaireRegistreOpen(false)
    setCreateLabel(''); setCreateNumero('')
    setSelectedParentUd(null); setParentUdSearch('')
    setDepotId(''); setDepotSearch(''); setCoteLocale(''); setLocRaw('')
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const createSerieCode = useMemo(
    () => series.find(s => s.id === createSerieId)?.code?.toUpperCase() ?? null,
    [series, createSerieId]
  )
  const isCreateEC       = createSerieCode === 'ETAT_CIVIL'
  const isCreateNotarial = createSerieCode === 'NOTARIAT'

  const selectedCreateBureau = useMemo(
    () => bureaux.find(b => b.id === createBureauId) ?? null,
    [bureaux, createBureauId]
  )
  const selectedCreateRegistre = useMemo(
    () => registres.find(r => r.id === createRegistreId) ?? null,
    [registres, createRegistreId]
  )
  const filteredCreateBureaux = useMemo(() => {
    const q = createBureauSearch.trim().toLowerCase()
    if (!q) return bureaux.slice(0, 20)
    return bureaux.filter(b =>
      b.nom.toLowerCase().includes(q) || b.commune?.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [bureaux, createBureauSearch])

  const filteredCreateRegistres = useMemo(() => {
    const q = createRegistreSearch.trim().toLowerCase()
    if (!q) return registres
    return registres.filter(r =>
      r.label.toLowerCase().includes(q) || String(r.annee).includes(q)
    )
  }, [registres, createRegistreSearch])

  const selectedDepot = useMemo(() => depots.find(d => d.id === depotId) ?? null, [depots, depotId])

  const filteredDepots = useMemo(() => {
    const q = depotSearch.trim().toLowerCase()
    if (!q) return depots
    return depots.filter(d =>
      d.instSigle?.toLowerCase().includes(q) ||
      d.instNom?.toLowerCase().includes(q) ||
      d.nomDepot.toLowerCase().includes(q) ||
      d.ville?.toLowerCase().includes(q)
    )
  }, [depots, depotSearch])

  const canSubmit = useMemo(() => {
    if (!depotId) return false
    if (createMode && !createSerieId) return false
    if (createMode && !createLabel.trim()) return false
    return !!(selectedActe || createMode)
  }, [depotId, createMode, createSerieId, createLabel, selectedActe])

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    let acteId: string | null = selectedActe?.id ?? null
    let createdActeId: string | null = null
    let createdUdId:   string | null = null
    try {
      // 1) Créer l'acte si besoin
      if (!acteId) {
        if (isCreateNotarial) {
          const { data, error } = await supabase
            .from('actes')
            .insert({ label: createLabel.trim() || null, numero_acte: createNumero.trim() || null, notaire_registre_id: createNotaireRegistreId || null })
            .select('id').single()
          if (error) throw error
          acteId = data.id; createdActeId = data.id
        } else {
          const type = typesActes.find(t => t.id === createTypeId)
          const { data, error } = await supabase
            .from('etat_civil_actes')
            .insert({ type_acte_ref: createTypeId ?? null, type_acte: type?.code ?? null, label: createLabel.trim() || null, numero_acte: createNumero.trim() || null, bureau_id: createBureauId ?? null, registre_id: createRegistreId ?? null, status: 'DRAFT' })
            .select('id').single()
          if (error) throw error
          acteId = data.id; createdActeId = data.id
        }
      }

      const isNotarial = isCreateNotarial || selectedActe?.type_acte === 'notarial'
      const acteLabel = selectedActe?.label ?? (createLabel.trim() || 'Acte sans titre')
      const parentUdId = selectedParentUd?.id
        ?? (parentUdMode === 'approx' && parentUdApprox.trim()
          ? await (async () => {
              const serieForParent = createMode
                ? createSerieId
                : (isNotarial
                    ? (series.find(s => s.code?.toUpperCase() === 'NOTARIAT')?.id ?? null)
                    : (series.find(s => s.code?.toUpperCase() === 'ETAT_CIVIL')?.id ?? null))
              const { data, error } = await supabase
                .from('ref_unites_documentaires')
                .insert({ titre: parentUdApprox.trim(), serie_ref: serieForParent, workflow_statut: 'en_attente', statut: 'a_qualifier' })
                .select('id').single()
              if (error) throw error
              return data.id as string
            })()
          : null)

      // 2) Trouver ou créer l'UD de l'acte
      const { data: existingCits } = await supabase
        .from('citations')
        .select('exemplaire_id')
        .eq('target_type', isNotarial ? 'ac_acte' : 'ec_acte')
        .eq('target_id', acteId!)
        .limit(1)

      let actUdId: string | null = null
      if (existingCits?.length) {
        const { data: existingEx } = await supabase
          .from('ref_exemplaires')
          .select('unite_documentaire_id')
          .eq('id', existingCits[0].exemplaire_id)
          .single()
        actUdId = existingEx?.unite_documentaire_id ?? null
      }

      if (!actUdId) {
        const serieForUd = createMode
          ? createSerieId
          : (isNotarial
              ? (series.find(s => s.code?.toUpperCase() === 'NOTARIAT')?.id ?? null)
              : (series.find(s => s.code?.toUpperCase() === 'ETAT_CIVIL')?.id ?? null))
        const { data, error } = await supabase
          .from('ref_unites_documentaires')
          .insert({ titre: acteLabel, serie_ref: serieForUd, parent_ud_id: parentUdId ?? null, workflow_statut: 'en_attente', statut: 'a_qualifier' })
          .select('id').single()
        if (error) throw error
        actUdId = data.id; createdUdId = data.id
      } else if (parentUdId) {
        await supabase.from('ref_unites_documentaires').update({ parent_ud_id: parentUdId }).eq('id', actUdId)
      }

      // 3) Créer l'exemplaire + la citation
      const { data: ex, error: eEx } = await supabase
        .from('ref_exemplaires')
        .insert({ unite_documentaire_id: actUdId, depot_id: depotId, cote_locale: coteLocale.trim() || null })
        .select('id').single()
      if (eEx) throw eEx

      const { error: eCit } = await supabase
        .from('citations')
        .insert({ target_type: isNotarial ? 'ac_acte' : 'ec_acte', target_id: acteId, exemplaire_id: ex.id, locating: {}, note: locRaw.trim() || null })
      if (eCit) throw eCit

      toast.success('Document référencé')
      navigate('/mock/sources-corpus')
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message ?? 'Erreur lors du référencement')
      if (createdActeId) {
        const table = isCreateNotarial ? 'actes' : 'etat_civil_actes'
        await supabase.from(table).delete().eq('id', createdActeId)
      }
      if (createdUdId) await supabase.from('ref_unites_documentaires').delete().eq('id', createdUdId)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Depot helpers ─────────────────────────────────────────────────────────────
  function selectDepot(d: DepotOption) { setDepotId(d.id); setDepotSearch(''); setDepotOpen(false) }
  function clearDepot() { setDepotId(''); setDepotSearch(''); setDepotOpen(false); setTimeout(() => depotSearchRef.current?.focus(), 50) }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  const showForm = !!(selectedActe || createMode)

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
          <button onClick={() => navigate('/mock/sources-corpus')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors">
            <Library className="w-4 h-4" />Patrimoine documentaire
          </button>
          <span className="text-gray-300 text-sm">/</span>
          <span className="text-sm font-medium text-gray-800">Référencer un document</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-1"><Bell className="w-5 h-5 text-gray-400" /></button>
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">JB</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">

        {/* Hero */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/mock/sources-corpus')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft className="w-4 h-4" />Retour
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Référencer un document</h1>
            <p className="text-sm text-gray-500 mt-0.5">Recherche d'abord — crée seulement si introuvable.</p>
          </div>
        </div>

        {/* ── Section 1 : Recherche ────────────────────────────────────── */}
        {showForm ? (
          /* Collapsed : résumé de la recherche + bouton modifier */
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-600 ">
                {searchText.trim() || <span className="italic text-gray-400">Tous les actes</span>}
              </span>
              {filterSerieId && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
                  {series.find(s => s.id === filterSerieId)?.label}
                </span>
              )}
            </div>
            <button
              onClick={() => { setSelectedActe(null); setCreateMode(false) }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0 transition-colors"
            >
              Modifier
            </button>
          </div>
        ) : (
          /* Expanded : formulaire complet */
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recherche</p>

            {/* Champ texte unique */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Numéro, label, date…"
                className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filtre série (optionnel) */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Série <span className="font-normal normal-case">(optionnel)</span></p>
              <div className="flex flex-wrap gap-2">
                {series.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setFilterSerieId(filterSerieId === s.id ? null : s.id)}
                    className={[
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      filterSerieId === s.id
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600',
                    ].join(' ')}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={!searchText.trim() && !filterSerieId}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {searchState === 'loading'
                ? <><Loader2 className="w-4 h-4 animate-spin" />Recherche…</>
                : <><Search className="w-4 h-4" />Rechercher</>}
            </button>
          </div>
        )}

        {/* ── Section 2 : Résultats ─────────────────────────────────────── */}
        {searchState === 'done' && (
          <div className="space-y-4">

            {results.length === 0 ? (
              /* Aucun résultat */
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center space-y-3">
                <p className="text-sm font-medium text-gray-700">Aucun acte trouvé avec ces critères</p>
                <p className="text-xs text-gray-400">Il n'existe pas encore dans la base — tu peux le créer maintenant.</p>
                <button
                  onClick={handleCreateMode}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />Créer cet acte
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 px-1">
                  {results.length} acte{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''} — sélectionne le bon ou crée-en un.
                </p>

                {(selectedActe ? [selectedActe] : results.slice(0, visibleCount)).map(acte => {
                  const typeLabel = typesActes.find(t => t.id === acte.type_acte_ref)?.label ?? acte.type_acte ?? '—'
                  const isSelected = selectedActe?.id === acte.id
                  return (
                    <button
                      key={acte.id}
                      onClick={() => isSelected ? setSelectedActe(null) : handleSelectActe(acte)}
                      className={[
                        'w-full text-left rounded-xl border shadow-sm p-5 transition-all space-y-4',
                        isSelected
                          ? 'border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-200'
                          : 'border-gray-100 bg-white hover:border-indigo-200',
                      ].join(' ')}
                    >
                      {/* Header acte */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                            {typeLabel}
                          </span>
                          {acte.numero_acte && (
                            <span className="text-xs font-mono text-gray-600">n°{acte.numero_acte}</span>
                          )}
                          {(acte.date ?? acte.annee) && (
                            <span className="text-xs text-gray-500">{acte.date ?? acte.annee}</span>
                          )}
                          {acte.bureauNom && (
                            <span className="text-xs text-gray-400">· {acte.bureauNom}</span>
                          )}
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'rotate-90 text-indigo-500' : 'text-gray-300'}`} />
                      </div>

                      {acte.label && (
                        <p className="text-sm font-medium text-gray-800 leading-snug">{acte.label}</p>
                      )}

                      {/* Exemplaires existants */}
                      {acte.exemplaires.length > 0 ? (
                        <div className="space-y-2 pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            {acte.exemplaires.length} exemplaire{acte.exemplaires.length > 1 ? 's' : ''} connu{acte.exemplaires.length > 1 ? 's' : ''}
                          </p>
                          {acte.exemplaires.map(ex => (
                            <div key={ex.citationId} className="flex items-start gap-2 text-xs text-gray-500">
                              <Building2 className="w-3.5 h-3.5 shrink-0 text-gray-400 mt-0.5" />
                              <span>
                                <span className="font-medium text-gray-700">{ex.depotSigle ?? ex.depotNom ?? '?'}</span>
                                {ex.cote && <span className="font-mono ml-1">· {ex.cote}</span>}
                                {ex.loc_raw && <span className="ml-1 text-gray-400">· {ex.loc_raw}</span>}
                                {ex.udTitre && <span className="ml-1 text-gray-400">· {ex.udTitre}</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 pt-3 border-t border-gray-100 italic">
                          Aucun exemplaire rattaché
                        </p>
                      )}
                    </button>
                  )
                })}

                {/* Voir plus */}
                {!selectedActe && visibleCount < results.length && (
                  <button
                    onClick={() => setVisibleCount(v => v + 5)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                  >
                    Voir plus ({results.length - visibleCount} restant{results.length - visibleCount > 1 ? 's' : ''})
                  </button>
                )}

                {/* Bouton créer — uniquement quand tous les résultats sont affichés et rien de sélectionné */}
                {!selectedActe && visibleCount >= results.length && (
                  <button
                    onClick={handleCreateMode}
                    className={[
                      'w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all',
                      createMode
                        ? 'border-indigo-300 bg-indigo-50/60 text-indigo-700 ring-2 ring-indigo-200'
                        : 'border-dashed border-gray-300 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 bg-white',
                    ].join(' ')}
                  >
                    <Plus className="w-4 h-4" />Ce n'est pas dans les résultats — créer un nouvel acte
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Section 3 : Formulaire (acte sélectionné ou création) ───── */}
        {showForm && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">
                {createMode ? 'Créer l\'acte + rattacher' : 'Rattacher un exemplaire'}
              </p>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Acte à créer (createMode uniquement) */}
            {createMode && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">L'acte</p>

                {/* Série */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-700">Série <span className="text-red-500">*</span></Label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {(createSerieId && !serieChipsExpanded
                      ? series.filter(s => s.id === createSerieId)
                      : series
                    ).map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          const next = createSerieId === s.id ? null : s.id
                          setCreateSerieId(next)
                          setCreateTypeId(null); setCreateBureauId(null); setCreateRegistreId(null); setCreateNotaireRegistreId(null)
                          setSerieChipsExpanded(false); setTypeChipsExpanded(false)
                        }}
                        className={[
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                          createSerieId === s.id
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600',
                        ].join(' ')}
                      >{s.label}</button>
                    ))}
                    {createSerieId && !serieChipsExpanded && (
                      <button onClick={() => setSerieChipsExpanded(true)} className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
                        {series.length - 1} autres…
                      </button>
                    )}
                    {createSerieId && serieChipsExpanded && (
                      <button onClick={() => setSerieChipsExpanded(false)} className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
                        Réduire
                      </button>
                    )}
                  </div>
                </div>

                {/* Champs conditionnels ETAT_CIVIL */}
                {isCreateEC && (
                  <>
                    {/* Type d'acte */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-700">Type d'acte</Label>
                      <div className="flex flex-wrap gap-2 items-center">
                        {(createTypeId && !typeChipsExpanded
                          ? typesActes.filter(t => t.id === createTypeId)
                          : typesActes
                        ).map(t => (
                          <button
                            key={t.id}
                            onClick={() => { setCreateTypeId(createTypeId === t.id ? null : t.id); setTypeChipsExpanded(false) }}
                            className={[
                              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                              createTypeId === t.id
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600',
                            ].join(' ')}
                          >{t.label}</button>
                        ))}
                        {createTypeId && !typeChipsExpanded && (
                          <button onClick={() => setTypeChipsExpanded(true)} className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
                            {typesActes.length - 1} autres…
                          </button>
                        )}
                        {createTypeId && typeChipsExpanded && (
                          <button onClick={() => setTypeChipsExpanded(false)} className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
                            Réduire
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bureau */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-700">Bureau d'état civil</Label>
                      {selectedCreateBureau ? (
                        <div className="flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
                          <span className="flex-1 text-sm text-gray-800">{selectedCreateBureau.nom}{selectedCreateBureau.commune ? ` — ${selectedCreateBureau.commune}` : ''}</span>
                          <button onClick={() => { setCreateBureauId(null); setCreateRegistreId(null) }} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            value={createBureauSearch}
                            onChange={e => { setCreateBureauSearch(e.target.value); setCreateBureauOpen(true) }}
                            onFocus={() => setCreateBureauOpen(true)}
                            onBlur={() => setTimeout(() => setCreateBureauOpen(false), 150)}
                            placeholder="Chercher un bureau…"
                            className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          {createBureauOpen && (
                            <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                              <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                                {filteredCreateBureaux.map(b => (
                                  <button key={b.id} onMouseDown={() => { setCreateBureauId(b.id); setCreateBureauSearch(''); setCreateBureauOpen(false) }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-sm">
                                    <span className="font-medium text-gray-800">{b.nom}</span>
                                    {b.commune && <span className="ml-2 text-xs text-gray-400">{b.commune}</span>}
                                  </button>
                                ))}
                                <button onMouseDown={() => { setCreateBureauOpen(false); setBureauModalOpen(true) }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-sm text-indigo-600 font-medium flex items-center gap-2">
                                  <Plus className="w-3.5 h-3.5" />Créer un bureau
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Registre (filtré par bureau) */}
                    {createBureauId && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700">Registre</Label>
                        {selectedCreateRegistre ? (
                          <div className="flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
                            <span className="flex-1 text-sm text-gray-800">{selectedCreateRegistre.label} — {selectedCreateRegistre.annee}</span>
                            <button onClick={() => setCreateRegistreId(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : registres.length === 0 ? (
                          <div className="flex items-center gap-3">
                            <p className="text-xs text-gray-400 italic">Aucun registre pour ce bureau</p>
                            <button onClick={() => setRegistreModalOpen(true)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                              <Plus className="w-3 h-3" />Créer
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              value={createRegistreSearch}
                              onChange={e => { setCreateRegistreSearch(e.target.value); setCreateRegistreOpen(true) }}
                              onFocus={() => setCreateRegistreOpen(true)}
                              onBlur={() => setTimeout(() => setCreateRegistreOpen(false), 150)}
                              placeholder="Chercher un registre…"
                              className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {createRegistreOpen && (
                              <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                                <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                                  {filteredCreateRegistres.map(r => (
                                    <button key={r.id} onMouseDown={() => { setCreateRegistreId(r.id); setCreateRegistreSearch(''); setCreateRegistreOpen(false) }}
                                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-sm">
                                      <span className="font-medium text-gray-800">{r.label}</span>
                                      <span className="ml-2 text-xs text-gray-400">{r.annee}{r.type_acte ? ` · ${r.type_acte}` : ''}</span>
                                    </button>
                                  ))}
                                  <button onMouseDown={() => { setCreateRegistreOpen(false); setRegistreModalOpen(true) }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-sm text-indigo-600 font-medium flex items-center gap-2">
                                    <Plus className="w-3.5 h-3.5" />Créer un registre
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Champs conditionnels NOTARIAT */}
                {isCreateNotarial && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700">Registre notarial</Label>
                    {createNotaireRegistreId ? (
                      <div className="flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
                        <span className="flex-1 text-sm text-gray-800">{notaireRegistres.find(r => r.id === createNotaireRegistreId)?.registre ?? createNotaireRegistreId}</span>
                        <button onClick={() => setCreateNotaireRegistreId(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          value={createNotaireRegistreSearch}
                          onChange={e => { setCreateNotaireRegistreSearch(e.target.value); setCreateNotaireRegistreOpen(true) }}
                          onFocus={() => setCreateNotaireRegistreOpen(true)}
                          onBlur={() => setTimeout(() => setCreateNotaireRegistreOpen(false), 150)}
                          placeholder="Chercher un registre notarial…"
                          className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {createNotaireRegistreOpen && notaireRegistres.length > 0 && (
                          <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                            <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                              {notaireRegistres.map(r => (
                                <button key={r.id} onMouseDown={() => { setCreateNotaireRegistreId(r.id); setCreateNotaireRegistreSearch(''); setCreateNotaireRegistreOpen(false) }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-sm text-gray-800">
                                  {r.registre}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Label + Numéro (communs) */}
                {createSerieId && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs font-medium text-gray-700">Label <span className="text-red-500">*</span></Label>
                      <Input value={createLabel} onChange={e => setCreateLabel(e.target.value)} placeholder="ex. Décès de Jean Dupont" className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">Numéro d'acte <span className="text-[11px] font-normal text-gray-400">(optionnel)</span></Label>
                      <Input value={createNumero} onChange={e => setCreateNumero(e.target.value)} placeholder="ex. 42" className="text-sm font-mono" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* UD de l'acte (lecture seule) */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Le document</p>
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <Library className="w-4 h-4 text-gray-400 shrink-0" />
                <p className="text-sm font-medium text-gray-700 italic">
                  {selectedActe?.label ?? (createLabel.trim() || 'Titre à définir')}
                </p>
              </div>
              <p className="text-[11px] text-gray-400">Créé automatiquement à partir du label de l'acte.</p>
            </div>

            {/* Source parente (optionnel) */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Source parente <span className="text-[11px] font-normal">(optionnel)</span></p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Le registre ou la collection qui contient cet acte</p>
                </div>
                <button
                  onClick={() => { setParentUdMode(parentUdMode === 'search' ? 'approx' : 'search'); setSelectedParentUd(null); setParentUdSearch('') }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium shrink-0"
                >
                  {parentUdMode === 'search' ? '+ Note approximative' : '← Rechercher'}
                </button>
              </div>

              {parentUdMode === 'search' ? (
                <div className="space-y-2">
                  {selectedParentUd ? (
                    <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                      <Library className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{selectedParentUd.titre}</p>
                        {selectedParentUd.couverture_label && <p className="text-xs text-gray-500">{selectedParentUd.couverture_label}</p>}
                      </div>
                      <button onClick={() => { setSelectedParentUd(null); setParentUdSearch('') }} className="p-1 text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          value={parentUdSearch}
                          onChange={e => setParentUdSearch(e.target.value)}
                          placeholder="Registre des naissances de Deshaies (1889)…"
                          className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      {parentUdSearching && <div className="flex items-center gap-2 px-1 py-1 text-xs text-gray-400"><Loader2 className="w-3 h-3 animate-spin" />Recherche…</div>}
                      {parentUdResults.length > 0 && (
                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                          <div className="divide-y divide-gray-50 max-h-40 overflow-y-auto">
                            {parentUdResults.map(ud => (
                              <button key={ud.id} onClick={() => { setSelectedParentUd(ud); setParentUdSearch('') }} className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors">
                                <p className="text-sm font-medium text-gray-800">{ud.titre}</p>
                                {ud.couverture_label && <p className="text-xs text-gray-500">{ud.couverture_label}</p>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {!selectedParentUd && !parentUdSearching && parentUdSearch.trim().length < 2 && (
                        <p className="text-xs text-gray-400 italic">Tape pour chercher, ou "+ Note approximative" si tu n'as qu'une idée.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Note approximative</Label>
                  <Input value={parentUdApprox} onChange={e => setParentUdApprox(e.target.value)} placeholder="ex. Registres paroissiaux de Deshaies, trouvé sur Geneanet" className="text-sm" />
                  <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100 mt-2">
                    Une source approximative sera créée en statut <strong>en attente</strong> — à qualifier plus tard.
                  </p>
                </div>
              )}
            </div>

            {/* Exemplaire */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">L'exemplaire <span className="text-red-500">*</span></p>
                <p className="text-[11px] text-gray-400 mt-1">Où as-tu trouvé ce document ?</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Institution / dépôt <span className="text-red-500">*</span></Label>
                {selectedDepot ? (
                  <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                    <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{selectedDepot.instSigle ?? selectedDepot.instNom ?? 'Institution'}</p>
                      <p className="text-xs text-gray-500">{selectedDepot.nomDepot}{selectedDepot.ville ? ` · ${selectedDepot.ville}` : ''}</p>
                    </div>
                    <button onClick={clearDepot} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        ref={depotSearchRef}
                        value={depotSearch}
                        onChange={e => { setDepotSearch(e.target.value); setDepotOpen(true) }}
                        onFocus={() => setDepotOpen(true)}
                        onBlur={() => setTimeout(() => setDepotOpen(false), 150)}
                        placeholder="ANOM, Archives de Guadeloupe…"
                        className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {depotOpen && (
                      <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                        <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                          {filteredDepots.length === 0
                            ? <p className="px-4 py-3 text-sm text-gray-400 italic">Aucun résultat</p>
                            : filteredDepots.slice(0, 20).map(d => (
                              <button key={d.id} onMouseDown={() => selectDepot(d)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-start gap-3 group">
                                <Building2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0 group-hover:text-indigo-500" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800  group-hover:text-indigo-700">
                                    {d.instSigle ? <><span className="font-semibold">{d.instSigle}</span> · {d.instNom}</> : d.instNom ?? 'Institution inconnue'}
                                  </p>
                                  <p className="text-xs text-gray-500">{d.nomDepot}{d.ville ? ` · ${d.ville}` : ''}</p>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Cote <span className="text-[11px] font-normal text-gray-400">(optionnel)</span></Label>
                  <Input value={coteLocale} onChange={e => setCoteLocale(e.target.value)} placeholder="ex. 1E125" className="text-sm font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Folio / page <span className="text-[11px] font-normal text-gray-400">(optionnel)</span></Label>
                  <Input value={locRaw} onChange={e => setLocRaw(e.target.value)} placeholder="ex. f. 42v" className="text-sm font-mono" />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Enregistrement…</>
                : <><CheckCircle2 className="w-4 h-4" />Référencer ce document</>}
            </button>
          </div>
        )}

      </main>

      {/* ── Modales ──────────────────────────────────────────────────────────── */}
      <BureauCreateModal
        open={bureauModalOpen}
        onClose={() => setBureauModalOpen(false)}
        bureauxExistants={[] as EtatCivilBureau[]}
        onBureauCreated={(b) => {
          setBureaux(prev => [...prev, { id: b.id, nom: b.nom, commune: b.commune ?? null }])
          setCreateBureauId(b.id)
          setBureauModalOpen(false)
        }}
      />

      {createBureauId && (
        <RegistreCreateModal
          open={registreModalOpen}
          onClose={() => setRegistreModalOpen(false)}
          bureauId={createBureauId}
          registresExistants={[] as EtatCivilRegistre[]}
          onRegistreCreated={(r) => {
            setRegistres(prev => [...prev, { id: r.id, label: r.label, annee: r.annee, type_acte: r.type_acte ?? null }])
            setCreateRegistreId(r.id)
            setRegistreModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
