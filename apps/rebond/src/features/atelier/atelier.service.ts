// atelier.service.ts — accès données pour l'atelier documentaire (transcription).
//
// Modèle brouillon/version (refondu le 2026-08-08) : rebond.transcriptions
// (contenu, zones, qualité) est le brouillon vivant, mis à jour en continu
// (auto-save texte, écriture immédiate pour zones/qualité) ;
// rebond.transcription_versions est un instantané figé des TROIS facettes
// (texte + zones_snapshot + qualite_snapshot), créé explicitement via
// "Enregistrer une version". Les commentaires ancrés sont exclus de ce
// mécanisme (fil de discussion continu, pas un fait documentaire versionné) —
// voir TranscriptionEditorPage.tsx pour le calcul d'isDirty côté frontend.
//
// TODO module restant (à reprendre) :
// - Ajout d'une suite de mots illisibles (marqueur dédié dans l'éditeur,
//   façon [ILLISIBLE...] de l'ancien système mais pensé pour Tiptap) — le
//   marquage "passage non transcrit" ci-dessous (2026-08-10,
//   tiptap/NonTranscritMark.ts) couvre peut-être déjà ce besoin (marque de
//   bascule applicable à n'importe quel bout de texte, pas juste un
//   paragraphe entier) ; à confirmer à l'usage avant d'ajouter un second
//   marqueur dédié pour un besoin très proche.
//
// "Section non transcrite" (2026-08-10, demande explicite) : bloc Tiptap
// atomique nonTranscrit (tiptap/NonTranscritNode.ts), bouton dans la barre
// d'outils de TranscriptionEditorPage.tsx — verrouillé et coloré (pas une
// marque de bascule éditable, refusé explicitement par l'utilisateur), pour
// signaler un passage sans empêcher de transcrire de vrais fragments autour.

import { supabase, supabaseRebond } from '@/lib/supabase'
import { unpackMarginalia } from '../patrimoine/citationJsonb'
import { CITATION_ACTE_TARGET_TYPES } from '../patrimoine/patrimoine.service'
import { QUALITE_VIDE } from './atelier.types'
import type {
  AtelierExemplaire, TranscriptionStatut, TranscriptionVersion, TranscriptionCommentaire, CommentaireStatut,
  TranscriptionZoneType, TranscriptionZone, TranscriptionQualite, ZoneAttendu, ZoneSnapshotEntry,
  TranscriptionSearchResult, HypActeContext, RepertoireEntreeRow,
} from './atelier.types'

type TranscriptionQualiteRow = {
  source_lecture_kind: string | null
  langue_ref: string | null
  ecriture_ref: string | null
  handwriting_legibility_ref: string | null
  completeness: string
  completeness_note: string | null
  reserve_level: string
  reserve_reason: string | null
}

function toQualite(row: TranscriptionQualiteRow): TranscriptionQualite {
  return {
    sourceLectureKind: row.source_lecture_kind as TranscriptionQualite['sourceLectureKind'],
    langueRef: row.langue_ref,
    ecritureRef: row.ecriture_ref,
    handwritingLegibilityRef: row.handwriting_legibility_ref,
    completeness: row.completeness as TranscriptionQualite['completeness'],
    completenessNote: row.completeness_note,
    reserveLevel: row.reserve_level as TranscriptionQualite['reserveLevel'],
    reserveReason: row.reserve_reason,
  }
}

// Métadonnées de hiérarchisation pour AtelierDocumentairePage.tsx (regroupement
// série > région > département > commune > bureau > année > registre).
// Volontairement séparé de patrimoine.service.ts (fetchDocuments) : ce sont
// des besoins spécifiques à cette vue, pas au reste du module Patrimoine —
// éviter d'alourdir sa requête partagée avec des jointures qu'elle n'utilise
// pas ailleurs.
//
// Chemin de données (important, pas celui qu'on imaginerait au premier
// abord) : un document (unite_documentaire) n'a PAS de bureau/registre
// directement, ni via unites_documentaires_bureaux/_types_actes (ces deux
// tables pivot existent mais ne sont quasi pas peuplées — 4-5 lignes au
// total sur toute la base, essai initial qui donnait une hiérarchie vide en
// usage réel). Le vrai chemin, richement peuplé (4200+ lignes) :
// unites_documentaires -> exemplaires -> citations (target_type='ec_acte')
// -> etat_civil_actes (bureau_id not null, annee, registre_id, numero_acte)
// -> etat_civil_bureaux / etat_civil_registres.
//
// Le registre lui-même n'a pas d'ordre propre en base — demandé
// explicitement : le trier par la même position que son type d'acte
// principal (ref_etat_civil_type_acte.position, via le pivot
// etat_civil_registres_type_acte — un registre peut mélanger plusieurs
// types, on garde la position minimale rencontrée).
// registreId séparé de registreLabel : le label est généré automatiquement
// à partir du seul type d'acte (cf. etat_civil_registres.md) — deux
// registres distincts (bureaux ou années différentes) peuvent porter le
// même libellé générique ("Registre des décès"). Le regroupement dans
// AtelierDocumentairePage.tsx doit se faire sur l'id réel, pas sur le
// texte affiché, pour ne pas fusionner à tort deux registres différents.
// domaine distingue quel chemin de données a résolu ce document — sert à
// AtelierDocumentairePage.tsx pour choisir la bonne liste de niveaux de
// hiérarchie (état civil : région>département>commune>bureau>année>registre ;
// hypothèques : région>conservation (réutilise le champ departement, pas de
// commune/département distincts dans ce domaine)>bureau>registre — 2026-08-10).
export type DocHierarchyMeta = {
  domaine: 'etat_civil' | 'hypotheques' | null
  region: string | null
  departement: string | null
  commune: string | null
  bureauLabel: string | null
  sortYear: number | null
  registreId: string | null
  registreLabel: string | null
  registreSortPosition: number | null
  numeroActe: string | null
}

export async function fetchDocumentsHierarchyMeta(documentIds: string[]): Promise<Map<string, DocHierarchyMeta>> {
  const result = new Map<string, DocHierarchyMeta>()
  if (documentIds.length === 0) return result
  for (const id of documentIds) {
    result.set(id, {
      domaine: null, region: null, departement: null, commune: null, bureauLabel: null,
      sortYear: null, registreId: null, registreLabel: null, registreSortPosition: null, numeroActe: null,
    })
  }

  // couverture_sort_start reste un repli de tri (toujours renseigné, même
  // pour un document non état-civil) — etat_civil_actes.annee (plus précis,
  // spécifique à l'acte) prend le dessus plus bas quand il existe.
  const { data: unites } = await supabaseRebond.from('unites_documentaires')
    .select('id, couverture_sort_start')
    .in('id', documentIds)
  for (const u of unites ?? []) {
    const meta = result.get(u.id)
    if (meta) meta.sortYear = u.couverture_sort_start
  }

  const { data: exemplaires } = await supabaseRebond.from('exemplaires')
    .select('id, unite_documentaire_id')
    .in('unite_documentaire_id', documentIds)
  const docIdByExemplaire = new Map((exemplaires ?? []).map(e => [e.id, e.unite_documentaire_id]))
  const exemplaireIds = [...docIdByExemplaire.keys()]
  if (exemplaireIds.length === 0) return result

  // ec_acte = un acte individuel ; ec_table = un répertoire/table de
  // dépouillement (etat_civil_repertoires, "table annuelle/décennale") —
  // demandé explicitement : les tables doivent aussi se placer sous leur
  // bureau/année/registre, pas rester à plat sous la série. hyp_acte = un
  // acte hypothécaire (dépôt/transcription/inscription), ajouté le
  // 2026-08-10 (module Hypothèques, cf. schema-docs/hypotheques.md).
  const { data: citations } = await supabaseRebond.from('citations')
    .select('exemplaire_id, target_id, target_type')
    .in('target_type', ['ec_acte', 'ec_table', 'hyp_acte'])
    .in('exemplaire_id', exemplaireIds)
  // Un document peut avoir plusieurs exemplaires/citations (rare) — on garde
  // la première rencontrée comme représentante dans la hiérarchie.
  const citationByDoc = new Map<string, { targetType: 'ec_acte' | 'ec_table' | 'hyp_acte'; targetId: string }>()
  for (const c of citations ?? []) {
    const docId = docIdByExemplaire.get(c.exemplaire_id)
    if (docId && !citationByDoc.has(docId)) {
      citationByDoc.set(docId, { targetType: c.target_type as 'ec_acte' | 'ec_table' | 'hyp_acte', targetId: c.target_id })
    }
  }
  const acteIdByDoc = new Map<string, string>()
  const tableIdByDoc = new Map<string, string>()
  const hypActeIdByDoc = new Map<string, string>()
  for (const [docId, c] of citationByDoc) {
    if (c.targetType === 'ec_acte') acteIdByDoc.set(docId, c.targetId)
    else if (c.targetType === 'ec_table') tableIdByDoc.set(docId, c.targetId)
    else hypActeIdByDoc.set(docId, c.targetId)
  }
  const acteIds = [...new Set(acteIdByDoc.values())]
  const tableIds = [...new Set(tableIdByDoc.values())]
  const hypActeIds = [...new Set(hypActeIdByDoc.values())]
  if (acteIds.length === 0 && tableIds.length === 0 && hypActeIds.length === 0) return result

  const { data: actes } = acteIds.length
    ? await supabaseRebond.from('etat_civil_actes').select('id, bureau_id, annee, registre_id, numero_acte').in('id', acteIds)
    : { data: [] as Array<{ id: string; bureau_id: string | null; annee: number | null; registre_id: string | null; numero_acte: string | null }> }
  const acteById = new Map((actes ?? []).map(a => [a.id, a]))

  // Un répertoire (etat_civil_repertoires) n'a pas de registre_id direct —
  // seulement bureau_id + annee_debut/fin + type_acte_ids. On le rattache
  // au registre correspondant (même bureau, même année, type d'acte en
  // commun) plus bas, une fois les registres candidats de son bureau connus.
  type TableRow = { id: string; bureau_id: string | null; annee_debut: number; annee_fin: number | null; type_acte_ids: string[] }
  const { data: tables } = tableIds.length
    ? await supabaseRebond.from('etat_civil_repertoires').select('id, bureau_id, annee_debut, annee_fin, type_acte_ids').in('id', tableIds).returns<TableRow[]>()
    : { data: [] as TableRow[] }
  const tableById = new Map((tables ?? []).map(t => [t.id, t]))

  const bureauIds = [...new Set([
    ...(actes ?? []).map(a => a.bureau_id),
    ...(tables ?? []).map(t => t.bureau_id),
  ].filter((v): v is string => !!v))]
  const { data: bureaux } = bureauIds.length
    ? await supabaseRebond.from('etat_civil_bureaux').select('id, nom, commune, departement, region').in('id', bureauIds)
    : { data: [] as Array<{ id: string; nom: string; commune: string | null; departement: string | null; region: string | null }> }
  const bureauById = new Map((bureaux ?? []).map(b => [b.id, b]))

  // Registres directement référencés par un acte, + tous les registres des
  // bureaux ayant une table à rattacher (candidats pour le matching bureau
  // + année + type d'acte ci-dessous).
  const tableBureauIds = [...new Set((tables ?? []).map(t => t.bureau_id).filter((v): v is string => !!v))]
  const [{ data: registresParActe }, { data: registresParBureau }] = await Promise.all([
    (async () => {
      const ids = [...new Set((actes ?? []).map(a => a.registre_id).filter((v): v is string => !!v))]
      return ids.length
        ? supabaseRebond.from('etat_civil_registres').select('id, bureau_id, annee, label').in('id', ids)
        : { data: [] as Array<{ id: string; bureau_id: string; annee: number; label: string }> }
    })(),
    tableBureauIds.length
      ? supabaseRebond.from('etat_civil_registres').select('id, bureau_id, annee, label').in('bureau_id', tableBureauIds)
      : Promise.resolve({ data: [] as Array<{ id: string; bureau_id: string; annee: number; label: string }> }),
  ])
  const registreById = new Map<string, { id: string; bureau_id: string; annee: number; label: string }>()
  for (const r of [...(registresParActe ?? []), ...(registresParBureau ?? [])]) registreById.set(r.id, r)
  const registreIds = [...registreById.keys()]

  // Position de tri d'un registre = position minimale, parmi ses types
  // d'acte associés, dans ref_etat_civil_type_acte. Sert aussi à connaître
  // l'ensemble des type_acte_id d'un registre pour le matching des tables.
  const { data: registreTypesActes } = registreIds.length
    ? await supabaseRebond.from('etat_civil_registres_type_acte')
      .select('registre_id, type_acte_id, ref_etat_civil_type_acte ( position )')
      .in('registre_id', registreIds)
    : { data: [] as Array<{ registre_id: string; type_acte_id: string; ref_etat_civil_type_acte: { position: number | null } | { position: number | null }[] | null }> }
  const minPositionByRegistre = new Map<string, number>()
  const typeActeIdsByRegistre = new Map<string, Set<string>>()
  for (const row of registreTypesActes ?? []) {
    const t = Array.isArray(row.ref_etat_civil_type_acte) ? row.ref_etat_civil_type_acte[0] : row.ref_etat_civil_type_acte
    const position = t?.position ?? null
    if (position != null) {
      const current = minPositionByRegistre.get(row.registre_id)
      if (current == null || position < current) minPositionByRegistre.set(row.registre_id, position)
    }
    const set = typeActeIdsByRegistre.get(row.registre_id) ?? new Set<string>()
    set.add(row.type_acte_id)
    typeActeIdsByRegistre.set(row.registre_id, set)
  }

  function applyBureau(meta: DocHierarchyMeta, bureauId: string | null) {
    const bureau = bureauId ? bureauById.get(bureauId) : null
    if (bureau) {
      meta.bureauLabel = bureau.nom
      meta.commune = bureau.commune
      meta.departement = bureau.departement
      meta.region = bureau.region
    }
  }

  function applyRegistre(meta: DocHierarchyMeta, registreId: string) {
    const registre = registreById.get(registreId)
    if (!registre) return
    meta.registreId = registre.id
    meta.registreLabel = registre.label
    meta.registreSortPosition = minPositionByRegistre.get(registreId) ?? null
  }

  for (const [docId, acteId] of acteIdByDoc) {
    const meta = result.get(docId)
    const acte = acteById.get(acteId)
    if (!meta || !acte) continue
    meta.domaine = 'etat_civil'
    meta.numeroActe = acte.numero_acte
    if (acte.annee != null) meta.sortYear = acte.annee
    applyBureau(meta, acte.bureau_id)
    if (acte.registre_id) applyRegistre(meta, acte.registre_id)
  }

  // Une table (répertoire) ne cible qu'un seul registre si elle couvre une
  // seule année (periodicite "annuelle" en pratique) — une table décennale/
  // générale (annee_fin renseigné et différent) n'a pas de registre unique,
  // on la laisse sous bureau/année sans niveau registre (repli "Non
  // renseigné" au lieu d'un rattachement arbitraire/faux).
  for (const [docId, tableId] of tableIdByDoc) {
    const meta = result.get(docId)
    const table = tableById.get(tableId)
    if (!meta || !table) continue
    meta.domaine = 'etat_civil'
    meta.sortYear = table.annee_debut
    applyBureau(meta, table.bureau_id)
    const singleYear = table.annee_fin == null || table.annee_fin === table.annee_debut
    if (singleYear && table.bureau_id) {
      const candidates = [...registreById.values()].filter(r =>
        r.bureau_id === table.bureau_id
        && r.annee === table.annee_debut
        && table.type_acte_ids.some(id => typeActeIdsByRegistre.get(r.id)?.has(id)),
      )
      if (candidates.length > 0) {
        candidates.sort((a, b) => (minPositionByRegistre.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (minPositionByRegistre.get(b.id) ?? Number.MAX_SAFE_INTEGER))
        applyRegistre(meta, candidates[0].id)
      }
    }
  }

  // Hypothèques (2026-08-10) : chemin de données distinct, pas de pivot
  // many-to-many à résoudre (type_registre_ref est une FK directe sur
  // hypotheques_registres, cf. schema-docs/hypotheques.md) — beaucoup plus
  // simple que le bloc état civil ci-dessus. Trié par numero_volume
  // (numérotation continue du domaine, pas d'année ni de "position" de type
  // d'acte comme l'état civil).
  if (hypActeIds.length > 0) {
    const { data: hypActes } = await supabaseRebond.from('hypotheques_actes')
      .select('id, registre_id, numero_acte').in('id', hypActeIds)
    const hypActeById = new Map((hypActes ?? []).map(a => [a.id, a]))

    const hypRegistreIds = [...new Set((hypActes ?? []).map(a => a.registre_id).filter((v): v is string => !!v))]
    const { data: hypRegistres } = hypRegistreIds.length
      ? await supabaseRebond.from('hypotheques_registres').select('id, bureau_id, label, numero_volume').in('id', hypRegistreIds)
      : { data: [] as Array<{ id: string; bureau_id: string; label: string; numero_volume: number }> }
    const hypRegistreById = new Map((hypRegistres ?? []).map(r => [r.id, r]))

    const hypBureauIds = [...new Set((hypRegistres ?? []).map(r => r.bureau_id).filter((v): v is string => !!v))]
    const { data: hypBureaux } = hypBureauIds.length
      ? await supabaseRebond.from('hypotheques_bureaux').select('id, nom, conservation_id').in('id', hypBureauIds)
      : { data: [] as Array<{ id: string; nom: string; conservation_id: string }> }
    const hypBureauById = new Map((hypBureaux ?? []).map(b => [b.id, b]))

    const hypConservationIds = [...new Set((hypBureaux ?? []).map(b => b.conservation_id).filter((v): v is string => !!v))]
    const { data: hypConservations } = hypConservationIds.length
      ? await supabaseRebond.from('hypotheques_conservations').select('id, nom, region').in('id', hypConservationIds)
      : { data: [] as Array<{ id: string; nom: string; region: string }> }
    const hypConservationById = new Map((hypConservations ?? []).map(c => [c.id, c]))

    for (const [docId, hypActeId] of hypActeIdByDoc) {
      const meta = result.get(docId)
      const acte = hypActeById.get(hypActeId)
      if (!meta || !acte) continue
      meta.domaine = 'hypotheques'
      meta.numeroActe = acte.numero_acte

      const registre = acte.registre_id ? hypRegistreById.get(acte.registre_id) : null
      if (registre) {
        meta.registreId = registre.id
        meta.registreLabel = registre.label
        meta.registreSortPosition = registre.numero_volume

        const bureau = registre.bureau_id ? hypBureauById.get(registre.bureau_id) : null
        if (bureau) {
          meta.bureauLabel = bureau.nom
          const conservation = bureau.conservation_id ? hypConservationById.get(bureau.conservation_id) : null
          if (conservation) {
            meta.region = conservation.region
            // departement réutilisé pour "conservation" : pas de département/
            // commune distincts dans ce domaine, cf. type DocHierarchyMeta.
            meta.departement = conservation.nom
          }
        }
      }
    }
  }

  return result
}

export async function fetchDocumentHeader(documentId: string) {
  const { data: doc, error } = await supabaseRebond.from('unites_documentaires')
    .select('id, titre, couverture_label, parent_ud_id')
    .eq('id', documentId)
    .maybeSingle<{ id: string; titre: string; couverture_label: string | null; parent_ud_id: string | null }>()
  if (error || !doc) return { data: null, error }

  let registreName: string | null = null
  let registreVueRange: string | null = null
  if (doc.parent_ud_id) {
    const { data: parent } = await supabaseRebond.from('unites_documentaires')
      .select('titre').eq('id', doc.parent_ud_id).maybeSingle<{ titre: string }>()
    registreName = parent?.titre ?? null

    // Vue totale du registre — celle de son exemplaire de référence (ou, à
    // défaut, le premier connu), pour situer chaque acte dans l'étendue
    // numérisée totale ("vue X / Y"). Ajouté le 2026-08-10.
    const { data: parentExemplaires } = await supabaseRebond.from('exemplaires')
      .select('localisation_interne, est_reference')
      .eq('unite_documentaire_id', doc.parent_ud_id)
    const refEx = (parentExemplaires ?? []).find(e => e.est_reference) ?? (parentExemplaires ?? [])[0]
    registreVueRange = refEx?.localisation_interne ?? null
  }

  return { data: { ...doc, registreName, registreVueRange }, error: null }
}

// Recherche pour "Comparer avec un autre exemplaire" (TranscriptionEditorPage) :
// on ramène un lot borné des transcriptions les plus récemment touchées
// (en_cours/termine — non_commence n'a jamais de contenu réel) et le
// filtrage texte se fait ensuite côté client sur ce lot, comme la
// recherche de AtelierDocumentairePage — l'échelle du module ne justifie
// pas une recherche plein texte côté serveur.
export async function searchTranscribedExemplaires(excludeExemplaireId: string): Promise<TranscriptionSearchResult[]> {
  const { data, error } = await supabaseRebond.from('transcriptions')
    .select(`
      exemplaire_id, statut, updated_at,
      exemplaires ( id, cote_locale, unite_documentaire_id, unites_documentaires ( id, titre ) )
    `)
    .neq('exemplaire_id', excludeExemplaireId)
    .in('statut', ['en_cours', 'termine'])
    .order('updated_at', { ascending: false })
    .limit(300)
  if (error) throw error

  return (data ?? [])
    .map((row: any) => {
      const ex = Array.isArray(row.exemplaires) ? row.exemplaires[0] : row.exemplaires
      const doc = ex ? (Array.isArray(ex.unites_documentaires) ? ex.unites_documentaires[0] : ex.unites_documentaires) : null
      return {
        exemplaireId: row.exemplaire_id as string,
        documentId: ex?.unite_documentaire_id ?? null,
        documentTitre: doc?.titre ?? 'Document',
        coteLocale: ex?.cote_locale ?? null,
        statut: row.statut as TranscriptionStatut,
        updatedAt: row.updated_at as string,
      }
    })
    .filter((r): r is TranscriptionSearchResult => !!r.documentId)
}

export async function fetchExemplairesForDocument(documentId: string): Promise<{ data: AtelierExemplaire[]; error: Error | null }> {
  const { data: exRows, error: exErr } = await supabaseRebond.from('exemplaires')
    .select(`
      id, cote_locale, identifiant_interne, localisation_interne, note, est_reference,
      ref_natures ( label ),
      ref_depots ( nom, ref_institutions ( nom, sigle ) )
    `)
    .eq('unite_documentaire_id', documentId)
    .order('created_at', { ascending: true })
  if (exErr) return { data: [], error: exErr }

  const rows = exRows ?? []
  const ids = rows.map((r: any) => r.id as string)

  const transcriptionByExemplaire = new Map<string, { statut: TranscriptionStatut; updated_at: string }>()
  if (ids.length) {
    const { data: trs } = await supabaseRebond.from('transcriptions')
      .select('exemplaire_id, statut, updated_at')
      .in('exemplaire_id', ids)
    for (const t of trs ?? []) {
      transcriptionByExemplaire.set(t.exemplaire_id, { statut: t.statut as TranscriptionStatut, updated_at: t.updated_at })
    }
  }

  // Numéro d'acte + vue propre à chaque exemplaire (demande explicite,
  // 2026-08-10) — via sa citation ec_acte/hyp_acte. locating.systems[0].raw
  // en priorité, repli sur localisation_interne (déjà en main via `rows`,
  // même priorité que usePatrimoine.ts).
  const numeroActeByExemplaire = new Map<string, string | null>()
  const vueByExemplaire = new Map<string, string | null>()
  if (ids.length) {
    const { data: cits } = await supabaseRebond.from('citations')
      .select('exemplaire_id, target_id, target_type, locating')
      .in('exemplaire_id', ids).in('target_type', ['ec_acte', 'hyp_acte'])
    const ecActeIds = (cits ?? []).filter(c => c.target_type === 'ec_acte').map(c => c.target_id)
    const hypActeIds = (cits ?? []).filter(c => c.target_type === 'hyp_acte').map(c => c.target_id)
    const [{ data: ecActes }, { data: hypActes }] = await Promise.all([
      ecActeIds.length
        ? supabaseRebond.from('etat_civil_actes').select('id, numero_acte').in('id', ecActeIds)
        : Promise.resolve({ data: [] as Array<{ id: string; numero_acte: string | null }> }),
      hypActeIds.length
        ? supabaseRebond.from('hypotheques_actes').select('id, numero_acte').in('id', hypActeIds)
        : Promise.resolve({ data: [] as Array<{ id: string; numero_acte: string | null }> }),
    ])
    const numeroActeByTarget = new Map([...(ecActes ?? []), ...(hypActes ?? [])].map(a => [a.id, a.numero_acte]))
    for (const c of cits ?? []) {
      numeroActeByExemplaire.set(c.exemplaire_id, numeroActeByTarget.get(c.target_id) ?? null)
      const sys0 = (c.locating as any)?.systems?.[0]
      const raw = (sys0?.raw ?? (c.locating as any)?.raw)?.toString().trim() || null
      vueByExemplaire.set(c.exemplaire_id, raw)
    }
  }

  const data: AtelierExemplaire[] = rows.map((ex: any) => {
    const nature = Array.isArray(ex.ref_natures) ? ex.ref_natures[0] : ex.ref_natures
    const depot = Array.isArray(ex.ref_depots) ? ex.ref_depots[0] : ex.ref_depots
    const institution = depot ? (Array.isArray(depot.ref_institutions) ? depot.ref_institutions[0] : depot.ref_institutions) : null
    const depotLabel = depot ? [institution?.nom, depot.nom].filter(Boolean).join(' · ') || null : null
    const transcription = transcriptionByExemplaire.get(ex.id)

    return {
      id: ex.id,
      coteLocale: ex.cote_locale ?? null,
      identifiantInterne: ex.identifiant_interne ?? null,
      localisationInterne: ex.localisation_interne ?? null,
      note: ex.note ?? null,
      natureLabel: nature?.label ?? null,
      depotLabel,
      estReference: ex.est_reference ?? false,
      transcriptionStatut: transcription?.statut ?? 'non_commence',
      transcriptionUpdatedAt: transcription?.updated_at ?? null,
      numeroActe: numeroActeByExemplaire.get(ex.id) ?? null,
      vue: vueByExemplaire.get(ex.id) ?? ex.localisation_interne ?? null,
    }
  })

  return { data, error: null }
}

export async function fetchExemplaireContext(exemplaireId: string) {
  return supabaseRebond.from('exemplaires')
    .select(`
      id, cote_locale, unite_documentaire_id,
      unites_documentaires ( id, titre ),
      ref_depots ( nom, ref_institutions ( nom, sigle ) )
    `)
    .eq('id', exemplaireId)
    .maybeSingle()
}

export async function fetchTranscription(exemplaireId: string) {
  const { data, error } = await supabaseRebond.from('transcriptions')
    .select(`
      id, contenu, statut, updated_at,
      source_lecture_kind, langue_ref, ecriture_ref, handwriting_legibility_ref,
      completeness, completeness_note, reserve_level, reserve_reason,
      marque_transcrit_par_email, marque_transcrit_le
    `)
    .eq('exemplaire_id', exemplaireId)
    .maybeSingle<{
      id: string; contenu: unknown; statut: TranscriptionStatut; updated_at: string
      marque_transcrit_par_email: string | null; marque_transcrit_le: string | null
    } & TranscriptionQualiteRow>()
  if (error || !data) return { data, error }
  return { data: { ...data, qualite: toQualite(data) }, error: null }
}

export async function saveTranscription(exemplaireId: string, contenu: unknown, statut: TranscriptionStatut) {
  return supabaseRebond.from('transcriptions')
    .upsert({ exemplaire_id: exemplaireId, contenu, statut }, { onConflict: 'exemplaire_id' })
    .select('id, updated_at')
    .single()
}

// Garantit une ligne rebond.transcriptions pour cet exemplaire (créée vide
// si besoin) — nécessaire avant de créer une version ou un commentaire, qui
// pointent tous les deux vers transcriptions.id, pas exemplaire_id.
export async function ensureTranscriptionId(exemplaireId: string): Promise<string> {
  const { data: existing } = await supabaseRebond.from('transcriptions')
    .select('id').eq('exemplaire_id', exemplaireId).maybeSingle<{ id: string }>()
  if (existing?.id) return existing.id

  const { data, error } = await supabaseRebond.from('transcriptions')
    .insert({ exemplaire_id: exemplaireId, contenu: {}, statut: 'en_cours' })
    .select('id').single<{ id: string }>()
  if (error) throw error
  return data.id
}

// -------------------- Historique de versions --------------------

export async function fetchVersions(transcriptionId: string): Promise<TranscriptionVersion[]> {
  const { data, error } = await supabaseRebond.from('transcription_versions')
    .select('id, version, contenu, change_summary, zones_snapshot, qualite_snapshot, created_at')
    .eq('transcription_id', transcriptionId)
    .order('version', { ascending: false })
  if (error) throw error
  return (data ?? []).map(v => ({
    id: v.id,
    version: v.version,
    contenu: v.contenu,
    changeSummary: v.change_summary,
    zonesSnapshot: (v.zones_snapshot ?? []) as ZoneSnapshotEntry[],
    qualiteSnapshot: (v.qualite_snapshot && Object.keys(v.qualite_snapshot as object).length > 0
      ? v.qualite_snapshot
      : QUALITE_VIDE) as TranscriptionQualite,
    createdAt: v.created_at,
  }))
}

// zonesSnapshot/qualiteSnapshot : l'état des zones et de la qualité au
// moment du clic, fourni par l'appelant (page) qui a déjà cet état en
// mémoire — une version fige les trois facettes ensemble (voir en-tête).
export async function createVersionSnapshot(
  transcriptionId: string,
  contenu: unknown,
  changeSummary: string | null,
  zonesSnapshot: ZoneSnapshotEntry[],
  qualiteSnapshot: TranscriptionQualite,
): Promise<TranscriptionVersion> {
  const { data, error } = await supabaseRebond.from('transcription_versions')
    .insert({
      transcription_id: transcriptionId,
      contenu,
      change_summary: changeSummary,
      zones_snapshot: zonesSnapshot,
      qualite_snapshot: qualiteSnapshot,
    })
    .select('id, version, contenu, change_summary, zones_snapshot, qualite_snapshot, created_at')
    .single()
  if (error) throw error
  return {
    id: data.id,
    version: data.version,
    contenu: data.contenu,
    changeSummary: data.change_summary,
    zonesSnapshot: (data.zones_snapshot ?? []) as ZoneSnapshotEntry[],
    qualiteSnapshot: (data.qualite_snapshot ?? QUALITE_VIDE) as TranscriptionQualite,
    createdAt: data.created_at,
  }
}

// -------------------- Commentaires ancrés --------------------

export async function fetchComments(transcriptionId: string): Promise<TranscriptionCommentaire[]> {
  const { data, error } = await supabaseRebond.from('transcription_commentaires')
    .select('id, contenu, statut, created_at, resolved_at')
    .eq('transcription_id', transcriptionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(c => ({
    id: c.id,
    contenu: c.contenu,
    statut: c.statut as CommentaireStatut,
    createdAt: c.created_at,
    resolvedAt: c.resolved_at,
  }))
}

export async function createComment(transcriptionId: string, contenu: string): Promise<TranscriptionCommentaire> {
  const { data, error } = await supabaseRebond.from('transcription_commentaires')
    .insert({ transcription_id: transcriptionId, contenu })
    .select('id, contenu, statut, created_at, resolved_at')
    .single()
  if (error) throw error
  return {
    id: data.id,
    contenu: data.contenu,
    statut: data.statut as CommentaireStatut,
    createdAt: data.created_at,
    resolvedAt: data.resolved_at,
  }
}

export async function setCommentStatut(commentId: string, statut: CommentaireStatut) {
  const { error } = await supabaseRebond.from('transcription_commentaires')
    .update({ statut, resolved_at: statut === 'resolu' ? new Date().toISOString() : null })
    .eq('id', commentId)
  if (error) throw error
}

export async function deleteComment(commentId: string) {
  const { error } = await supabaseRebond.from('transcription_commentaires').delete().eq('id', commentId)
  if (error) throw error
}

// -------------------- Zones spécifiques --------------------

export async function fetchZoneTypes(): Promise<TranscriptionZoneType[]> {
  const { data, error } = await supabaseRebond.from('ref_transcription_zone_types')
    .select('id, code, label')
    .order('ordre', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function fetchZones(transcriptionId: string): Promise<TranscriptionZone[]> {
  const { data, error } = await supabaseRebond.from('transcription_zones')
    .select('id, zone_type_id, contenu, created_at')
    .eq('transcription_id', transcriptionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(z => ({
    id: z.id,
    zoneTypeId: z.zone_type_id,
    contenu: z.contenu,
    createdAt: z.created_at,
  }))
}

export async function createZone(transcriptionId: string, zoneTypeId: string, contenu: string): Promise<TranscriptionZone> {
  const { data, error } = await supabaseRebond.from('transcription_zones')
    .insert({ transcription_id: transcriptionId, zone_type_id: zoneTypeId, contenu })
    .select('id, zone_type_id, contenu, created_at')
    .single()
  if (error) throw error
  return { id: data.id, zoneTypeId: data.zone_type_id, contenu: data.contenu, createdAt: data.created_at }
}

export async function updateZone(zoneId: string, contenu: string) {
  const { error } = await supabaseRebond.from('transcription_zones').update({ contenu }).eq('id', zoneId)
  if (error) throw error
}

export async function deleteZone(zoneId: string) {
  const { error } = await supabaseRebond.from('transcription_zones').delete().eq('id', zoneId)
  if (error) throw error
}

// Remplace intégralement les zones du brouillon par celles d'un instantané
// de version — utilisé pour "Restaurer dans le brouillon" / "Annuler le
// brouillon" (cf. TranscriptionEditorPage.tsx, applyVersionToDraft). Pas de
// diff fin zone par zone : plus simple et sans ambiguïté qu'un merge, cohérent
// avec le fait qu'une restauration remplace tout le brouillon, pas juste une
// partie.
export async function replaceZones(transcriptionId: string, zonesSnapshot: ZoneSnapshotEntry[]): Promise<TranscriptionZone[]> {
  const { error: delErr } = await supabaseRebond.from('transcription_zones').delete().eq('transcription_id', transcriptionId)
  if (delErr) throw delErr
  if (zonesSnapshot.length === 0) return []

  const { data, error } = await supabaseRebond.from('transcription_zones')
    .insert(zonesSnapshot.map(z => ({ transcription_id: transcriptionId, zone_type_id: z.zoneTypeId, contenu: z.contenu })))
    .select('id, zone_type_id, contenu, created_at')
  if (error) throw error
  return (data ?? []).map(z => ({ id: z.id, zoneTypeId: z.zone_type_id, contenu: z.contenu, createdAt: z.created_at }))
}

// Ce qui est "attendu" par zone (mention marginale / signature / rature),
// tel que décrit dans Patrimoine documentaire (citations.marginalia, étape
// "Décrire") — complémentaire, pas dupliqué, au contenu relevé ici. Clé =
// code de rebond.ref_transcription_zone_types (mention_marginale, signature,
// rature_marginale), pas son id, pour rester indépendant des uuid générés.
export async function fetchZonesAttendu(exemplaireId: string): Promise<Record<string, ZoneAttendu>> {
  // Liste des target_type centralisée dans CITATION_ACTE_TARGET_TYPES
  // (patrimoine.service.ts) depuis le 2026-08-16 — un oubli ici avait déjà
  // laissé "Zones spécifiques" bloqué sur "Non qualifié" pour hyp_acte
  // (corrigé le 2026-08-10) puis à nouveau pour ac_acte (notariat).
  const { data: cit } = await supabaseRebond.from('citations')
    .select('marginalia')
    .eq('exemplaire_id', exemplaireId)
    .in('target_type', CITATION_ACTE_TARGET_TYPES)
    .maybeSingle<{ marginalia: unknown }>()

  const mar = unpackMarginalia((cit?.marginalia as any) ?? null)
  return {
    mention_marginale: { present: mar.marginal_mentions_present, count: mar.marginal_mentions_count },
    signature: { present: mar.signatures_present, count: mar.signatures_count },
    rature_marginale: { present: mar.marginal_crossouts_present, count: mar.marginal_crossouts_count },
  }
}

// -------------------- Qualité de la transcription --------------------

export async function updateQualite(transcriptionId: string, patch: Partial<TranscriptionQualite>) {
  const dbPatch: Partial<TranscriptionQualiteRow> = {}
  if ('sourceLectureKind' in patch) dbPatch.source_lecture_kind = patch.sourceLectureKind ?? null
  if ('langueRef' in patch) dbPatch.langue_ref = patch.langueRef ?? null
  if ('ecritureRef' in patch) dbPatch.ecriture_ref = patch.ecritureRef ?? null
  if ('handwritingLegibilityRef' in patch) dbPatch.handwriting_legibility_ref = patch.handwritingLegibilityRef ?? null
  if ('completeness' in patch) dbPatch.completeness = patch.completeness
  if ('completenessNote' in patch) dbPatch.completeness_note = patch.completenessNote ?? null
  if ('reserveLevel' in patch) dbPatch.reserve_level = patch.reserveLevel
  if ('reserveReason' in patch) dbPatch.reserve_reason = patch.reserveReason ?? null

  const { error } = await supabaseRebond.from('transcriptions').update(dbPatch).eq('id', transcriptionId)
  if (error) throw error
}

// -------------------- Marquer comme transcrit --------------------

// Historise qui a marqué la transcription comme terminée (pas un
// historique multi-entrées — juste la dernière personne, cf.
// schema-docs/transcriptions.md). Utilise le client `supabase` (session
// active), pas `supabaseRebond` (anon, sans session), pour connaître
// l'utilisateur courant.
export async function markAsTranscrit(transcriptionId: string): Promise<{ email: string | null; le: string }> {
  const { data: userData } = await supabase.auth.getUser()
  const email = userData.user?.email ?? null
  const userId = userData.user?.id ?? null
  const le = new Date().toISOString()

  const { error } = await supabaseRebond.from('transcriptions').update({
    statut: 'termine',
    marque_transcrit_par: userId,
    marque_transcrit_par_email: email,
    marque_transcrit_le: le,
  }).eq('id', transcriptionId)
  if (error) throw error

  return { email, le }
}

// -------------------- Renvois au répertoire (hypothèques) --------------------
// Pour chaque partie (vendeur/acheteur) mentionnée en marge d'un acte
// hypothécaire, une référence volume/case vers sa ligne dans un répertoire
// des formalités — répond au besoin "mentions marginales" décrit par
// l'utilisateur le 2026-08-10 (auparavant capturé en texte libre via
// transcription_zones "Mention marginale", faute de mieux). Écrit dans une
// vraie table structurée (rebond.hypotheques_repertoire_entrees) plutôt
// qu'en texte libre — décidé explicitement, priorisé après avoir constaté le
// besoin en usage réel.

export async function fetchHypActeContext(exemplaireId: string): Promise<HypActeContext | null> {
  const { data: cit } = await supabaseRebond.from('citations')
    .select('target_id').eq('exemplaire_id', exemplaireId).eq('target_type', 'hyp_acte').maybeSingle<{ target_id: string }>()
  if (!cit) return null

  const { data: acte } = await supabaseRebond.from('hypotheques_actes')
    .select('id, registre_id').eq('id', cit.target_id).maybeSingle<{ id: string; registre_id: string | null }>()
  if (!acte?.registre_id) return null

  const { data: registre } = await supabaseRebond.from('hypotheques_registres')
    .select('bureau_id, type_registre_ref').eq('id', acte.registre_id).maybeSingle<{ bureau_id: string; type_registre_ref: string }>()
  if (!registre) return null

  return { acteId: acte.id, bureauId: registre.bureau_id, typeFormaliteRef: registre.type_registre_ref }
}

export async function fetchRepertoireEntrees(acteId: string): Promise<RepertoireEntreeRow[]> {
  const { data } = await supabaseRebond.from('hypotheques_repertoire_entrees')
    .select('id, case_numero, description_courte, hypotheques_registres ( label, numero_volume )')
    .eq('acte_id', acteId).order('created_at', { ascending: true })
  return (data ?? []).map((r: any) => {
    const reg = Array.isArray(r.hypotheques_registres) ? r.hypotheques_registres[0] : r.hypotheques_registres
    return {
      id: r.id, description: r.description_courte, caseNumero: r.case_numero,
      registreLabel: reg?.label ?? 'Répertoire', numeroVolume: reg?.numero_volume ?? 0,
    }
  })
}

// find-or-create le volume de répertoire (même bureau que l'acte, type
// repertoire_formalites, même numéro de volume) — même logique que le
// wizard (ReferenceWizardPage.tsx, HypothequesWizardBody). Partagé entre
// ajout et édition (changer le numéro de volume d'un renvoi existant doit
// pouvoir le rattacher à un autre volume de répertoire, créé au besoin).
async function findOrCreateRepertoireRegistre(bureauId: string, numeroVolume: number): Promise<string> {
  const { data: typeRepertoire, error: typeErr } = await supabaseRebond.from('ref_hypotheques_type_registre')
    .select('id').eq('code', 'repertoire_formalites').single<{ id: string }>()
  if (typeErr) throw typeErr

  const { data: existing } = await supabaseRebond.from('hypotheques_registres')
    .select('id').eq('bureau_id', bureauId).eq('type_registre_ref', typeRepertoire.id).eq('numero_volume', numeroVolume)
    .maybeSingle<{ id: string }>()
  if (existing?.id) return existing.id

  const { data: created, error: createErr } = await supabaseRebond.from('hypotheques_registres')
    .insert({ bureau_id: bureauId, type_registre_ref: typeRepertoire.id, numero_volume: numeroVolume })
    .select('id').single<{ id: string }>()
  if (createErr) throw createErr
  return created.id
}

export async function addRepertoireEntree(
  ctx: HypActeContext, numeroVolume: number, caseNumero: string, description: string,
): Promise<void> {
  const registreId = await findOrCreateRepertoireRegistre(ctx.bureauId, numeroVolume)
  const { error: insErr } = await supabaseRebond.from('hypotheques_repertoire_entrees').insert({
    registre_id: registreId, case_numero: caseNumero, type_formalite_ref: ctx.typeFormaliteRef,
    description_courte: description || null, acte_id: ctx.acteId,
  })
  if (insErr) throw insErr
}

export async function updateRepertoireEntree(
  ctx: HypActeContext, id: string, numeroVolume: number, caseNumero: string, description: string,
): Promise<void> {
  const registreId = await findOrCreateRepertoireRegistre(ctx.bureauId, numeroVolume)
  const { error } = await supabaseRebond.from('hypotheques_repertoire_entrees').update({
    registre_id: registreId, case_numero: caseNumero, description_courte: description || null,
  }).eq('id', id)
  if (error) throw error
}

export async function removeRepertoireEntree(id: string) {
  const { error } = await supabaseRebond.from('hypotheques_repertoire_entrees').delete().eq('id', id)
  if (error) throw error
}

// Rouvre l'édition — ne touche pas marque_transcrit_par/_email/_le, qui
// reste la trace de la dernière marque "transcrit" même après réouverture.
export async function revertToEnCours(transcriptionId: string) {
  const { error } = await supabaseRebond.from('transcriptions').update({ statut: 'en_cours' }).eq('id', transcriptionId)
  if (error) throw error
}
