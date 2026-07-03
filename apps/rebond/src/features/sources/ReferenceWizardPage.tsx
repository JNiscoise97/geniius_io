import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Layers, Library, Bell, ChevronLeft, Loader2, CheckCircle2,
  AlertTriangle, X, Building2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { insertDocumentUD } from './patrimoine.service'

// ── Types ─────────────────────────────────────────────────────────────────────

type RWStep = 'serie' | 'type' | 'acte' | 'ask-table' | 'table' | 'ask-registre' | 'registre' | 'summary'
type RWLevel = { intitule: string; institution: string; cote: string; url: string; position: string; notes: string }
const RW_EMPTY: RWLevel = { intitule: '', institution: '', cote: '', url: '', position: '', notes: '' }

type SerieOption = { id: string; code: string; label: string }

type DomainActe = {
  id: string
  type_acte: string | null
  date: string | null
  annee: number | null
  numero_acte: string | null
  bureau_nom: string | null
}

type DepotOption = {
  id: string
  institution_sigle: string | null
  institution_nom: string | null
  type_code: string | null
  type_label: string | null
  plateforme_label: string | null
  is_online: boolean
}

type ParentExemplaire = {
  id: string
  cote_locale: string | null
  institution_sigle: string | null
  institution_nom: string | null
  depot_nom: string | null
}

type UDMatch = {
  id: string
  titre: string
  workflow_statut: string
  statut: string | null
  exemplaires: Array<{
    id: string
    cote_locale: string | null
    depot_id: string | null
    depot_nom: string | null
    institution_sigle: string | null
    institution_nom: string | null
    vue: string | null
    parentExemplaire: ParentExemplaire | null
  }>
  domainActe: DomainActe | null
}

// ── Vocabulary ────────────────────────────────────────────────────────────────

type LevelVocab = { label: string; desc: string; placeholder: string }
type SerieVocab = { level1: LevelVocab; level2: LevelVocab; level3: LevelVocab }

const DEFAULT_VOCAB: SerieVocab = {
  level1: { label: 'Un document',          desc: 'Acte, rapport, fiche, courrier…',             placeholder: 'Ex. Rapport sur la commune de Basse-Terre' },
  level2: { label: 'Une section / index',  desc: 'Table des matières, index, rubrique…',         placeholder: 'Ex. Index alphabétique 1880–1889' },
  level3: { label: 'Un volume / registre', desc: 'Registre, liasse, dossier collectif…',         placeholder: 'Ex. Registre des délibérations 1888' },
}

const VOCAB: Record<string, SerieVocab> = {
  ETAT_CIVIL: {
    level1: { label: 'Un acte',               desc: 'Naissance, mariage, décès, mention marginale…',    placeholder: 'Ex. Acte de naissance de Henri BLUKER' },
    level2: { label: 'Une table / index',      desc: 'Table alphabétique, table décennale…',             placeholder: 'Ex. Table alphabétique des naissances 1880–1889' },
    level3: { label: 'Un registre',            desc: 'Registre annuel ou pluriannuel…',                  placeholder: 'Ex. Registre des naissances — Deshaies 1888' },
  },
  PAROISSIAL: {
    level1: { label: 'Un acte',               desc: 'Baptême, mariage, sépulture…',                     placeholder: 'Ex. Baptême de Marie-Josephe MOCO' },
    level2: { label: 'Une table / index',      desc: 'Table alphabétique, index des actes…',             placeholder: 'Ex. Table des baptêmes 1760–1790' },
    level3: { label: 'Un registre',            desc: 'Registre paroissial annuel ou pluriannuel…',       placeholder: 'Ex. Registre paroissial — Saint-François 1760' },
  },
  TABLES_DECENNALES: {
    level1: { label: 'Une entrée de table',   desc: 'Ligne dans la table décennale…',                   placeholder: 'Ex. Entrée BLUKER Henri — naissances 1891' },
    level2: { label: 'Une section alphabétique', desc: 'Section A–D, E–K…',                             placeholder: 'Ex. Section A–D' },
    level3: { label: 'Une table décennale',   desc: 'Table couvrant une décennie…',                     placeholder: 'Ex. Table décennale des naissances 1853–1862 — Deshaies' },
  },
  NOTARIAT: {
    level1: { label: 'Un acte notarié',       desc: 'Vente, succession, contrat de mariage, inventaire…', placeholder: 'Ex. Vente — DUPONT à MARTIN, 12 mars 1888' },
    level2: { label: 'Un index / répertoire', desc: 'Répertoire des actes, index des parties…',          placeholder: 'Ex. Répertoire 1er semestre 1888' },
    level3: { label: 'Un minutier',           desc: 'Minutier ou registre du notaire…',                  placeholder: 'Ex. Minutier de Maître LAMY — 1888' },
  },
  HYPOTHEQUES: {
    level1: { label: 'Une transcription / inscription', desc: 'Transcription, inscription, radiation…', placeholder: 'Ex. Transcription — Vente parcelle n°42' },
    level2: { label: 'Une table',             desc: 'Table des vendeurs, acquéreurs, biens…',            placeholder: 'Ex. Table alphabétique des vendeurs 1880–1890' },
    level3: { label: 'Un registre',           desc: 'Registre des hypothèques, des transcriptions…',     placeholder: 'Ex. Registre des transcriptions vol. 12 — 1888' },
  },
  CADASTRE: {
    level1: { label: 'Un document cadastral', desc: 'Plan parcellaire, fiche de propriétaire…',          placeholder: 'Ex. Parcelle n°42 — propriétaire DURAND' },
    level2: { label: 'Une section cadastrale', desc: 'Section A, B, C, lieu-dit…',                      placeholder: 'Ex. Section B — Lieu-dit Les Abymes' },
    level3: { label: 'Une matrice / atlas',   desc: 'Matrice cadastrale, atlas des sections…',           placeholder: 'Ex. Matrice cadastrale — Commune de Sainte-Anne 1835' },
  },
  RECENSEMENTS: {
    level1: { label: 'Un foyer / feuille',    desc: 'Foyer recensé, feuille nominative…',                placeholder: 'Ex. Foyer BLUKER — 3 rue de la Liberté' },
    level2: { label: 'Un quartier / rue',      desc: 'Ilot, quartier, subdivision géographique…',        placeholder: 'Ex. Quartier du Centre' },
    level3: { label: 'Un registre de recensement', desc: 'Recensement d\'une commune, liste de population…', placeholder: 'Ex. Recensement 1891 — Commune de Deshaies' },
  },
  LISTES_ELECTORALES: {
    level1: { label: 'Une entrée / électeur', desc: 'Ligne d\'inscription électorale…',                  placeholder: 'Ex. BLUKER Henri — inscrit le 12 mars 1905' },
    level2: { label: 'Une section de liste',  desc: 'Subdivision géographique de la liste…',             placeholder: 'Ex. Section du Bourg' },
    level3: { label: 'Une liste électorale',  desc: 'Liste électorale d\'une commune…',                  placeholder: 'Ex. Liste électorale — Basse-Terre 1905' },
  },
  IMMIGRATION: {
    level1: { label: 'Un contrat / dossier',  desc: 'Contrat d\'engagement, liste de passagers…',        placeholder: 'Ex. Contrat d\'engagement — RAMSAMY 1858' },
    level2: { label: 'Une section de liste',  desc: 'Groupe de contrats, période d\'arrivée…',           placeholder: 'Ex. Arrivées janvier–mars 1858' },
    level3: { label: 'Un registre',           desc: 'Registre des engagés, des arrivées…',               placeholder: 'Ex. Registre des engagés indiens 1854' },
  },
  NATURALISATION: {
    level1: { label: 'Un dossier / acte',     desc: 'Dossier de naturalisation, déclaration, admission…', placeholder: 'Ex. Dossier de naturalisation — CHEN Fu 1920' },
    level2: { label: 'Un index',              desc: 'Index alphabétique des demandes…',                  placeholder: 'Ex. Index alphabétique 1900–1920' },
    level3: { label: 'Un registre',           desc: 'Registre des naturalisations…',                     placeholder: 'Ex. Registre des naturalisations — Guadeloupe 1900–1930' },
  },
  ESCLAVAGE: {
    level1: { label: 'Un document',           desc: 'Inventaire d\'habitation, liste, transaction…',     placeholder: 'Ex. Inventaire d\'habitation Dufour 1826' },
    level2: { label: 'Une section',           desc: 'Partie ou rubrique du document…',                   placeholder: 'Ex. Liste des esclaves — section II' },
    level3: { label: 'Un registre / fonds',   desc: 'Registre de plantation, fonds d\'habitation…',      placeholder: 'Ex. Registre de l\'habitation DUFOUR 1820–1835' },
  },
  AFFRANCHISSEMENTS: {
    level1: { label: 'Un acte',               desc: 'Acte d\'affranchissement, déclaration…',            placeholder: 'Ex. Affranchissement de Cécile, habitante Dufour' },
    level2: { label: 'Un index',              desc: 'Index alphabétique des affranchis…',                placeholder: 'Ex. Index alphabétique des affranchis 1840–1848' },
    level3: { label: 'Un registre',           desc: 'Registre des affranchissements…',                   placeholder: 'Ex. Registre des affranchissements — Basse-Terre 1840' },
  },
  NOUVEAUX_LIBRES: {
    level1: { label: 'Une entrée',            desc: 'Attribution de patronyme, enregistrement…',         placeholder: 'Ex. BLUKER Henri — ex-habitation Dufour' },
    level2: { label: 'Une section',           desc: 'Groupe alphabétique ou subdivision…',               placeholder: 'Ex. Lettres A–D' },
    level3: { label: 'Un registre',           desc: 'Registre des nouveaux libres 1848…',                placeholder: 'Ex. Registre des nouveaux libres — Pointe-à-Pitre 1848' },
  },
  JUSTICE: {
    level1: { label: 'Un acte / jugement',    desc: 'Jugement, procédure, minute, tutelle…',             placeholder: 'Ex. Jugement de tutelle — mineur BLUKER 1902' },
    level2: { label: 'Un répertoire',         desc: 'Répertoire des affaires, index des parties…',       placeholder: 'Ex. Répertoire des affaires civiles 1900–1910' },
    level3: { label: 'Un registre / minutier',desc: 'Minutier, registre de procédures…',                 placeholder: 'Ex. Minutier civil — Tribunal de Basse-Terre 1902' },
  },
  ADMINISTRATION: {
    level1: { label: 'Un document',           desc: 'Arrêté, rapport, correspondance, note…',            placeholder: 'Ex. Arrêté du Gouverneur du 12 mars 1888' },
    level2: { label: 'Une rubrique',          desc: 'Rubrique ou section du registre…',                  placeholder: 'Ex. Correspondances avec le Ministère' },
    level3: { label: 'Un registre / liasse',  desc: 'Registre de correspondances, liasse…',              placeholder: 'Ex. Registre des arrêtés — Guadeloupe 1888' },
  },
  MILITAIRE: {
    level1: { label: 'Une fiche / dossier',   desc: 'Fiche matricule, dossier de pension, décoration…',  placeholder: 'Ex. Fiche matricule — BLUKER Henri, classe 1910' },
    level2: { label: 'Un index / répertoire', desc: 'Répertoire de la classe, index des conscrits…',     placeholder: 'Ex. Répertoire de la classe 1910' },
    level3: { label: 'Un registre matricule', desc: 'Registre d\'une classe de conscription…',           placeholder: 'Ex. Registre matricule — Classe 1910, Bureau de Basse-Terre' },
  },
  PRESSE: {
    level1: { label: 'Un article',            desc: 'Article, annonce légale, avis, fait divers…',       placeholder: 'Ex. Avis de décès — BLUKER, Le Nouvelliste du 14 mars 1888' },
    level2: { label: 'Une rubrique',          desc: 'Rubrique nécrologique, annonces, faits divers…',    placeholder: 'Ex. Rubrique — Naissances, mariages, décès' },
    level3: { label: 'Une édition',           desc: 'Numéro de journal, date de parution…',              placeholder: 'Ex. Le Courrier de la Guadeloupe — 14 mars 1888' },
  },
  ICONOGRAPHIE: {
    level1: { label: 'Un document',           desc: 'Photo, carte postale, gravure, portrait…',          placeholder: 'Ex. Portrait de groupe — Famille BLUKER, Pointe-à-Pitre 1910' },
    level2: { label: 'Une série / thème',     desc: 'Série iconographique, thème commun…',               placeholder: 'Ex. Vues du port de Pointe-à-Pitre' },
    level3: { label: 'Un album / fonds',      desc: 'Album photographique, fonds iconographique…',       placeholder: 'Ex. Fonds photographique HUGO — ANOM' },
  },
  CARTOGRAPHIE: {
    level1: { label: 'Une carte / plan',      desc: 'Carte, plan de ville, plan parcellaire…',           placeholder: 'Ex. Plan de la ville de Basse-Terre 1888' },
    level2: { label: 'Un feuillet',           desc: 'Feuille d\'atlas, section de carte…',               placeholder: 'Ex. Feuille n°3 — Nord Guadeloupe' },
    level3: { label: 'Un atlas / recueil',    desc: 'Atlas géographique, recueil de cartes…',            placeholder: 'Ex. Atlas de la Guadeloupe 1878' },
  },
  MANUSCRITS: {
    level1: { label: 'Un document',           desc: 'Lettre, note, feuillet isolé…',                     placeholder: 'Ex. Lettre de Henri BLUKER à sa sœur, 12 mars 1920' },
    level2: { label: 'Un chapitre / section', desc: 'Partie d\'un carnet, d\'une correspondance…',       placeholder: 'Ex. Lettres 1919–1922' },
    level3: { label: 'Un carnet / correspondance', desc: 'Carnet personnel, ensemble de lettres…',       placeholder: 'Ex. Correspondance de Henri BLUKER 1910–1940' },
  },
  BIBLIOGRAPHIE: {
    level1: { label: 'Un article / ouvrage',  desc: 'Article de revue, monographie, mémoire…',           placeholder: 'Ex. "Les origines de l\'état civil en Guadeloupe" — MARTIN 1994' },
    level2: { label: 'Un chapitre / rubrique',desc: 'Chapitre, section thématique…',                     placeholder: 'Ex. Chapitre III — Période esclavagiste' },
    level3: { label: 'Une revue / collection',desc: 'Revue d\'histoire, série d\'ouvrages…',             placeholder: 'Ex. Généalogie & Histoire de la Caraïbe' },
  },
}

function getVocab(code: string | null): SerieVocab {
  if (!code) return DEFAULT_VOCAB
  return VOCAB[code] ?? DEFAULT_VOCAB
}

// target_type de citation correspondant à chaque série (null = pas encore de domaine métier)
const SERIE_TARGET_TYPE: Record<string, string> = {
  ETAT_CIVIL:  'ec_acte',
  PAROISSIAL:  'ec_acte',
  NOTARIAT:    'ac_acte',
}

// ── Table structurée ─────────────────────────────────────────────────────────

type EcTypeActe = { id: string; code: string; label: string; label_pluriel: string }

const TABLE_PERIODICITE = [
  { value: 'annuelle',   label: 'Annuelle'   },
  { value: 'decennale',  label: 'Décennale'  },
  { value: 'generale',   label: 'Générale'   },
] as const

const TABLE_CLASSEMENT = [
  { value: 'alphabetique',  label: 'Alphabétique'  },
  { value: 'chronologique', label: 'Chronologique' },
] as const

const STRUCTURED_TABLE_SERIES = new Set(['ETAT_CIVIL', 'PAROISSIAL'])

const PAROISSIAL_TYPE_CODES = new Set(['BAPTEME', 'MARIAGE', 'SEPULTURE', 'INHUMATION', 'NAISSANCE'])

function computeActesLabel(ids: string[], ecTypeActes: EcTypeActe[]): string {
  if (ids.length === 0 || ids.includes('tous')) return 'des actes'
  // ecTypeActes already ordered by position → filter preserves that order
  const labels = ecTypeActes.filter(t => ids.includes(t.id)).map(t => t.label_pluriel)
  if (labels.length === 1) return `des actes de ${labels[0]}`
  if (labels.length === 2) return `des actes de ${labels[0]} et ${labels[1]}`
  return `des actes de ${labels.slice(0, -1).join(', ')} et ${labels[labels.length - 1]}`
}

function computeTableIntitule(
  periodicite: string | null,
  classement: string | null,
  typeActeIds: string[],
  ecTypeActes: EcTypeActe[],
  anneeDebut: string,
  anneeFin: string,
  lieu: string,
): string | null {
  if (!periodicite || !anneeDebut.trim()) return null
  const periLabel  = TABLE_PERIODICITE.find(t => t.value === periodicite)?.label.toLowerCase() ?? periodicite
  const classLabel = classement ? ` ${TABLE_CLASSEMENT.find(t => t.value === classement)?.label.toLowerCase() ?? classement}` : ''
  const actesLabel = computeActesLabel(typeActeIds, ecTypeActes)
  const lieuPart   = lieu.trim() ? ` de la commune de ${lieu.trim()}` : ''
  const debut = anneeDebut.trim()
  const fin   = anneeFin.trim()
  const annees = fin && fin !== debut ? ` pour les années ${debut}–${fin}` : ` pour l'année ${debut}`
  return `Table ${periLabel}${classLabel} ${actesLabel}${lieuPart}${annees}`
}

function computeRegistreIntitule(
  typeActeIds: string[],
  ecTypeActes: EcTypeActe[],
  anneeDebut: string,
  anneeFin: string,
  lieu: string,
): string | null {
  if (!anneeDebut.trim()) return null
  const actesLabel = computeActesLabel(typeActeIds, ecTypeActes)
  const lieuPart   = lieu.trim() ? ` de la paroisse ${lieu.trim()}` : ''
  const debut = anneeDebut.trim()
  const fin   = anneeFin.trim()
  const annees = fin && fin !== debut ? `${debut}–${fin}` : debut
  return `Registre ${actesLabel}${lieuPart} de ${annees}`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'

// ── Sub-components ────────────────────────────────────────────────────────────

function RWStepSerie({ series, serieId, onChange }: {
  series: SerieOption[]; serieId: string | null; onChange: (id: string) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Dans quelle série documentaire as-tu trouvé ce document ?</p>
      <div className="flex flex-wrap gap-2">
        {series.map(s => (
          <button key={s.id} onClick={() => onChange(s.id)}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              serieId === s.id
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600',
            ].join(' ')}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function RWStepperBar({ step, findType, hasTable, hasRegistre }: {
  step: RWStep; findType: 'acte' | 'table' | 'registre'; hasTable: boolean | null; hasRegistre: boolean | null
}) {
  const afterActe  = ['ask-table', 'table', 'ask-registre', 'registre', 'summary'].includes(step)
  const afterTable = ['ask-registre', 'registre', 'summary'].includes(step)
  const items: Array<{ label: string; done: boolean; active: boolean }> = []
  if (findType === 'acte')
    items.push({ label: 'Document', done: afterActe, active: step === 'acte' })
  if (findType !== 'registre' && hasTable !== false)
    items.push({ label: 'Section',  done: afterTable && hasTable === true, active: step === 'table' })
  items.push({ label: 'Volume', done: step === 'summary' && hasRegistre === true, active: step === 'registre' })
  return (
    <div className="flex items-center gap-1">
      {items.map((item, idx) => (
        <div key={item.label} className="flex items-center gap-1 flex-1">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0 transition-colors ${
            item.done   ? 'bg-indigo-600 border-indigo-600 text-white' :
            item.active ? 'bg-indigo-50 border-indigo-400 text-indigo-600' :
                          'bg-gray-50 border-gray-200 text-gray-400'}`}>
            {item.done ? '✓' : idx + 1}
          </div>
          <span className={`text-xs font-medium ${item.active ? 'text-indigo-600' : item.done ? 'text-gray-600' : 'text-gray-400'}`}>{item.label}</span>
          {idx < items.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
        </div>
      ))}
    </div>
  )
}

function RWStepType({ vocab, findType, onChange }: {
  vocab: SerieVocab; findType: 'acte' | 'table' | 'registre'; onChange: (v: 'acte' | 'table' | 'registre') => void
}) {
  const opts = [
    { value: 'acte'     as const, ...vocab.level1 },
    { value: 'table'    as const, ...vocab.level2 },
    { value: 'registre' as const, ...vocab.level3 },
  ]
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Qu'avez-vous trouvé ?</p>
      <div className="space-y-2">
        {opts.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${findType === o.value ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
            <div className={`text-sm font-medium ${findType === o.value ? 'text-indigo-700' : 'text-gray-800'}`}>{o.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{o.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function RWStepDescribe({ kind, placeholder, level, patch }: {
  kind: 'table' | 'registre'; placeholder: string; level: RWLevel; patch: (f: keyof RWLevel, v: string) => void
}) {
  const posLabel = kind === 'table' ? 'Vues (début – fin)' : undefined
  const ouLabel  = kind === 'table' ? 'Position dans le document' : "C'est où ?"
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">C'est quoi ?</p>
        <div className="space-y-3">
          <Field label="Intitulé" required>
            <input value={level.intitule} onChange={e => patch('intitule', e.target.value)}
              placeholder={placeholder} className={inputCls} autoFocus />
          </Field>
        </div>
      </div>
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{ouLabel}</p>
        <div className="space-y-3">
          <Field label="Institution / dépôt">
            <input value={level.institution} onChange={e => patch('institution', e.target.value)} placeholder="Ex. ANOM, AD Réunion…" className={inputCls} />
          </Field>
          <Field label="Cote">
            <input value={level.cote} onChange={e => patch('cote', e.target.value)} placeholder="Ex. 5Mi/456" className={inputCls} />
          </Field>
          {posLabel && (
            <Field label={posLabel}>
              <input value={level.position} onChange={e => patch('position', e.target.value)} placeholder="Ex. 12" className={inputCls} />
            </Field>
          )}
        </div>
      </div>
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Comment y accéder ?</p>
        <Field label="URL">
          <input value={level.url} onChange={e => patch('url', e.target.value)} placeholder="https://…" className={inputCls} />
        </Field>
      </div>
      <div className="border-t border-slate-100 pt-4">
        <Field label="Notes (optionnel)">
          <textarea value={level.notes} onChange={e => patch('notes', e.target.value)}
            placeholder="Observations…" className={`${inputCls} min-h-[60px] resize-none`} />
        </Field>
      </div>
    </div>
  )
}

function RWStepAskContext({ question, detail, value, onChange }: {
  question: string; detail?: string; value: boolean | null; onChange: (v: boolean | null) => void
}) {
  const opts: { v: boolean | null; label: string }[] = [
    { v: true,  label: 'Oui' },
    { v: false, label: 'Non' },
    { v: null,  label: 'Je ne sais pas' },
  ]
  return (
    <div className="space-y-4 py-2">
      <p className="text-sm font-medium text-gray-700">{question}</p>
      {detail && <p className="text-xs text-gray-400">{detail}</p>}
      <div className="grid grid-cols-3 gap-3">
        {opts.map(o => (
          <button key={String(o.v)} onClick={() => onChange(o.v)}
            className={`rounded-xl border px-3 py-4 text-sm font-medium transition-colors ${value === o.v ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function DepotPicker({ depotQuery, setDepotQuery, depotResults, depotSearching, selectedDepot, setSelectedDepot, autoFocus }: {
  depotQuery: string; setDepotQuery: (v: string) => void
  depotResults: DepotOption[]; depotSearching: boolean
  selectedDepot: DepotOption | null; setSelectedDepot: (v: DepotOption | null) => void
  autoFocus?: boolean
}) {
  const instLabel = (d: DepotOption) => [d.institution_sigle, d.institution_nom].filter(Boolean).join(' — ')
  const AccessBadge = ({ online }: { online: boolean }) => (
    <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
      online ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-amber-50 text-amber-600 border-amber-200'
    }`}>
      {online ? 'En ligne' : 'Sur place'}
    </span>
  )

  if (selectedDepot) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-2">
        <AccessBadge online={selectedDepot.is_online} />
        <span className="flex-1 text-sm text-gray-800">
          <span className="font-medium">{instLabel(selectedDepot)}</span>
          {selectedDepot.type_label && (
            <span className="text-gray-400 ml-1.5">· {selectedDepot.type_label}</span>
          )}
        </span>
        <button onClick={() => { setSelectedDepot(null); setDepotQuery('') }} className="text-gray-400 hover:text-gray-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }
  return (
    <div className="relative">
      <input value={depotQuery} onChange={e => setDepotQuery(e.target.value)}
        placeholder="Ex. ANOM, AD Guadeloupe, BNF…" className={inputCls} autoFocus={autoFocus} />
      {depotSearching && (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
      )}
      {depotResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {depotResults.map(d => (
            <button key={d.id} onClick={() => { setSelectedDepot(d); setDepotQuery('') }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3">
              <AccessBadge online={d.is_online} />
              <span className="flex-1 text-sm font-medium text-gray-800">{instLabel(d)}</span>
              {d.type_label && <span className="text-xs text-gray-400 shrink-0">{d.type_label}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function RWStepSummary({ vocab, acte, selectedUd, hasTable, table, hasRegistre, registre }: {
  vocab: SerieVocab; acte: RWLevel; selectedUd: UDMatch | null
  hasTable: boolean | null; table: RWLevel; hasRegistre: boolean | null; registre: RWLevel
}) {
  const acteTitle   = selectedUd ? selectedUd.titre : (acte.intitule || '(sans titre)')
  const acteDetails = selectedUd
    ? selectedUd.exemplaires.map(ex => [ex.institution_sigle ?? ex.depot_nom, ex.cote_locale].filter(Boolean).join(' ')).filter(Boolean).join(', ')
    : [acte.institution, acte.cote].filter(Boolean).join(' · ')
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">Récapitulatif</p>
      <div className="rounded-xl border border-gray-200 overflow-hidden text-sm divide-y divide-gray-100">
        {hasRegistre && registre.intitule && (
          <div className="px-4 py-3 bg-gray-50">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">{vocab.level3.label}</div>
            <div className="font-medium text-gray-800">{registre.intitule}</div>
            {(registre.institution || registre.cote) && (
              <div className="text-xs text-gray-500 mt-0.5">{[registre.institution, registre.cote].filter(Boolean).join(' · ')}</div>
            )}
          </div>
        )}
        {hasTable && table.intitule && (
          <div className={`px-4 py-3 ${hasRegistre && registre.intitule ? 'pl-8' : ''}`}>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">{vocab.level2.label}</div>
            <div className="font-medium text-gray-800">{table.intitule}</div>
            {table.position && <div className="text-xs text-gray-500 mt-0.5">Position : {table.position}</div>}
          </div>
        )}
        <div className={`px-4 py-3 ${hasTable && table.intitule ? (hasRegistre && registre.intitule ? 'pl-12' : 'pl-8') : ''}`}>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="text-[10px] text-indigo-600 uppercase tracking-wide font-semibold">{vocab.level1.label}</div>
            {selectedUd && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">existant</span>}
          </div>
          <div className="font-medium text-gray-800">{acteTitle}</div>
          {acteDetails && <div className="text-xs text-gray-500 mt-0.5">{acteDetails}</div>}
          {!selectedUd && acte.position && <div className="text-xs text-gray-500">Vue {acte.position}</div>}
        </div>
      </div>
      <p className="text-xs text-gray-400">
        {selectedUd
          ? 'Document existant — un nouvel exemplaire et les informations de localisation seront complétés depuis sa fiche.'
          : 'Les exemplaires et accès numériques pourront être complétés depuis la page du document.'}
      </p>
    </div>
  )
}

function RWStepDescribeTableEC({
  ecTypeActes, serieCode,
  tablePeriodicite, setTablePeriodicite,
  tableClassement,  setTableClassement,
  tableTypeActeIds, setTableTypeActeIds,
  tableAnneeDebut, setTableAnneeDebut,
  tableAnneeFin, setTableAnneeFin,
  tableLieu, setTableLieu,
  bureauQuery, setBureauQuery, bureauResults, bureauSearching, selectedBureau, setSelectedBureau,
  tableIntitule,
  tableUdSearching, tableUdMatches,
  selectedTableUd, setSelectedTableUd,
  depotQuery, setDepotQuery, depotResults, depotSearching, selectedDepot, setSelectedDepot,
  level, patch,
}: {
  ecTypeActes: EcTypeActe[]; serieCode: string | null
  tablePeriodicite: string | null; setTablePeriodicite: (v: string) => void
  tableClassement: string | null;  setTableClassement:  (v: string | null) => void
  tableTypeActeIds: string[]; setTableTypeActeIds: (v: string[]) => void
  tableAnneeDebut: string; setTableAnneeDebut: (v: string) => void
  tableAnneeFin: string;   setTableAnneeFin:   (v: string) => void
  tableLieu: string;       setTableLieu:       (v: string) => void
  bureauQuery: string;     setBureauQuery:     (v: string) => void
  bureauResults: Array<{ id: string; nom: string; commune: string | null }>
  bureauSearching: boolean
  selectedBureau: { id: string; nom: string; commune: string | null } | null
  setSelectedBureau: (v: { id: string; nom: string; commune: string | null } | null) => void
  tableIntitule: string | null
  tableUdSearching: boolean
  tableUdMatches: Array<{ id: string; titre: string; statut: string | null; workflow_statut: string }>
  selectedTableUd: { id: string; titre: string } | null
  setSelectedTableUd: (v: { id: string; titre: string } | null) => void
  depotQuery: string; setDepotQuery: (v: string) => void
  depotResults: DepotOption[]; depotSearching: boolean
  selectedDepot: DepotOption | null; setSelectedDepot: (v: DepotOption | null) => void
  level: RWLevel; patch: (f: keyof RWLevel, v: string) => void
}) {
  const visibleTypes = serieCode === 'PAROISSIAL'
    ? ecTypeActes.filter(t => PAROISSIAL_TYPE_CODES.has(t.code))
    : ecTypeActes

  const chipCls = (active: boolean) => [
    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
    active
      ? 'bg-indigo-600 border-indigo-600 text-white'
      : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600',
  ].join(' ')

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">C'est quoi ?</p>
        <div className="space-y-4">
          <Field label="Périodicité" required>
            <div className="flex flex-wrap gap-2">
              {TABLE_PERIODICITE.map(opt => (
                <button key={opt.value} onClick={() => setTablePeriodicite(opt.value)} className={chipCls(tablePeriodicite === opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Classement">
            <div className="flex flex-wrap gap-2">
              {TABLE_CLASSEMENT.map(opt => (
                <button key={opt.value} onClick={() => setTableClassement(tableClassement === opt.value ? null : opt.value)} className={chipCls(tableClassement === opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Actes couverts">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTableTypeActeIds(tableTypeActeIds.includes('tous') ? [] : ['tous'])}
                className={chipCls(tableTypeActeIds.includes('tous'))}>
                Tous actes
              </button>
              {visibleTypes.map(t => (
                <button key={t.id}
                  onClick={() => {
                    const withoutTous = tableTypeActeIds.filter(x => x !== 'tous')
                    setTableTypeActeIds(
                      withoutTous.includes(t.id)
                        ? withoutTous.filter(x => x !== t.id)
                        : [...withoutTous, t.id]
                    )
                  }}
                  className={chipCls(tableTypeActeIds.includes(t.id))}>
                  {t.label_pluriel}
                </button>
              ))}
            </div>
          </Field>
          {serieCode === 'ETAT_CIVIL' ? (
            <Field label="Bureau d'état civil" required>
              {selectedBureau ? (
                <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-2">
                  <span className="flex-1 text-sm text-gray-800">
                    {selectedBureau.nom}
                    {selectedBureau.commune && selectedBureau.commune !== selectedBureau.nom && (
                      <span className="text-gray-500 ml-1">({selectedBureau.commune})</span>
                    )}
                  </span>
                  <button onClick={() => { setSelectedBureau(null); setBureauQuery('') }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input value={bureauQuery} onChange={e => setBureauQuery(e.target.value)}
                    placeholder="Rechercher un bureau…" className={inputCls} />
                  {bureauSearching && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                  {bureauResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {bureauResults.map(b => (
                        <button key={b.id} onClick={() => { setSelectedBureau(b); setBureauQuery('') }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-baseline gap-2">
                          <span className="font-medium text-gray-800">{b.nom}</span>
                          {b.commune && <span className="text-xs text-gray-400">{b.commune}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Field>
          ) : (
            <Field label="Paroisse">
              <input value={tableLieu} onChange={e => setTableLieu(e.target.value)}
                placeholder="Ex. Paroisse Saint-François…" className={inputCls} />
            </Field>
          )}
          <Field label="Période" required>
            <div className="flex items-center gap-2">
              <input value={tableAnneeDebut} onChange={e => setTableAnneeDebut(e.target.value)}
                placeholder="1880" maxLength={4} className={`${inputCls} w-24`} />
              <span className="text-gray-400">–</span>
              <input value={tableAnneeFin} onChange={e => setTableAnneeFin(e.target.value)}
                placeholder="1889" maxLength={4} className={`${inputCls} w-24`} />
            </div>
          </Field>
          {selectedTableUd ? (
            <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{selectedTableUd.titre}</p>
                <p className="text-xs text-indigo-600 mt-0.5">Table existante sélectionnée</p>
              </div>
              <button onClick={() => setSelectedTableUd(null)} className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              {tableIntitule && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Intitulé généré</p>
                  <p className="text-sm font-semibold text-slate-800">{tableIntitule}</p>
                </div>
              )}
              {tableUdSearching && (
                <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
                  <Loader2 className="w-3 h-3 animate-spin" />Recherche de doublons…
                </div>
              )}
              {!tableUdSearching && tableUdMatches.length > 0 && (
                <div className="rounded-xl border border-amber-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-100">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <p className="text-xs font-medium text-amber-700">
                      {tableUdMatches.length} table{tableUdMatches.length > 1 ? 's similaires trouvées' : ' similaire trouvée'} — vérifie avant de créer
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {tableUdMatches.map(ud => {
                      const s = ud.statut
                      const badgeCls = s === 'actif'       ? 'bg-green-100 text-green-700 border-green-200'
                                     : s === 'a_qualifier' ? 'bg-amber-100 text-amber-700 border-amber-200'
                                     :                       'bg-gray-100 text-gray-600 border-gray-200'
                      return (
                        <div key={ud.id} className="flex items-center gap-3 px-3 py-2.5 bg-white hover:bg-gray-50">
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <p className="text-sm font-medium text-gray-800">{ud.titre}</p>
                            {s && <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full border ${badgeCls}`}>{s.replace(/_/g, ' ')}</span>}
                          </div>
                          <button onClick={() => setSelectedTableUd({ id: ud.id, titre: ud.titre })}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 shrink-0 transition-colors">
                            Sélectionner
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {!tableUdSearching && tableIntitule && tableUdMatches.length === 0 && (
                <p className="text-xs text-emerald-600 px-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />Aucune table similaire trouvée
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">C'est où ?</p>
        <div className="space-y-3">
          <Field label="Dépôt / institution">
            <DepotPicker
              depotQuery={depotQuery} setDepotQuery={setDepotQuery}
              depotResults={depotResults} depotSearching={depotSearching}
              selectedDepot={selectedDepot} setSelectedDepot={setSelectedDepot}
            />
          </Field>
          <Field label="Cote">
            <input value={level.cote} onChange={e => patch('cote', e.target.value)} placeholder="Ex. 5Mi/456" className={inputCls} />
          </Field>
          <Field label="Vues (début – fin)">
            <input value={level.position} onChange={e => patch('position', e.target.value)} placeholder="Ex. 1–45" className={inputCls} />
          </Field>
        </div>
      </div>
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Comment y accéder ?</p>
        <Field label="URL">
          <input value={level.url} onChange={e => patch('url', e.target.value)} placeholder="https://…" className={inputCls} />
        </Field>
      </div>
      <div className="border-t border-slate-100 pt-4">
        <Field label="Notes (optionnel)">
          <textarea value={level.notes} onChange={e => patch('notes', e.target.value)}
            placeholder="Observations…" className={`${inputCls} min-h-[60px] resize-none`} />
        </Field>
      </div>
    </div>
  )
}

function RWStepDescribeRegistreEC({
  ecTypeActes, serieCode,
  registreTypeActeIds, setRegistreTypeActeIds,
  registreAnneeDebut, setRegistreAnneeDebut,
  registreAnneeFin, setRegistreAnneeFin,
  registreLieu, setRegistreLieu,
  bureauQuery, setBureauQuery, bureauResults, bureauSearching, selectedBureau, setSelectedBureau,
  registreIntitule,
  depotQuery, setDepotQuery, depotResults, depotSearching, selectedDepot, setSelectedDepot,
  level, patch,
}: {
  ecTypeActes: EcTypeActe[]; serieCode: string | null
  registreTypeActeIds: string[]; setRegistreTypeActeIds: (v: string[]) => void
  registreAnneeDebut: string; setRegistreAnneeDebut: (v: string) => void
  registreAnneeFin: string;   setRegistreAnneeFin:   (v: string) => void
  registreLieu: string;       setRegistreLieu:       (v: string) => void
  bureauQuery: string;     setBureauQuery:     (v: string) => void
  bureauResults: Array<{ id: string; nom: string; commune: string | null }>
  bureauSearching: boolean
  selectedBureau: { id: string; nom: string; commune: string | null } | null
  setSelectedBureau: (v: { id: string; nom: string; commune: string | null } | null) => void
  registreIntitule: string | null
  depotQuery: string; setDepotQuery: (v: string) => void
  depotResults: DepotOption[]; depotSearching: boolean
  selectedDepot: DepotOption | null; setSelectedDepot: (v: DepotOption | null) => void
  level: RWLevel; patch: (f: keyof RWLevel, v: string) => void
}) {
  const visibleTypes = serieCode === 'PAROISSIAL'
    ? ecTypeActes.filter(t => PAROISSIAL_TYPE_CODES.has(t.code))
    : ecTypeActes
  const chipCls = (active: boolean) => [
    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
    active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600',
  ].join(' ')

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">C'est quoi ?</p>
        <div className="space-y-4">
          <Field label="Actes couverts">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setRegistreTypeActeIds(registreTypeActeIds.includes('tous') ? [] : ['tous'])} className={chipCls(registreTypeActeIds.includes('tous'))}>
                Tous actes
              </button>
              {visibleTypes.map(t => (
                <button key={t.id}
                  onClick={() => {
                    const withoutTous = registreTypeActeIds.filter(x => x !== 'tous')
                    setRegistreTypeActeIds(withoutTous.includes(t.id) ? withoutTous.filter(x => x !== t.id) : [...withoutTous, t.id])
                  }}
                  className={chipCls(registreTypeActeIds.includes(t.id))}>
                  {t.label_pluriel}
                </button>
              ))}
            </div>
          </Field>
          {serieCode === 'ETAT_CIVIL' ? (
            <Field label="Bureau d'état civil" required>
              {selectedBureau ? (
                <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-2">
                  <span className="flex-1 text-sm text-gray-800">
                    {selectedBureau.nom}
                    {selectedBureau.commune && selectedBureau.commune !== selectedBureau.nom && (
                      <span className="text-gray-500 ml-1">({selectedBureau.commune})</span>
                    )}
                  </span>
                  <button onClick={() => { setSelectedBureau(null); setBureauQuery('') }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input value={bureauQuery} onChange={e => setBureauQuery(e.target.value)} placeholder="Rechercher un bureau…" className={inputCls} />
                  {bureauSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />}
                  {bureauResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {bureauResults.map(b => (
                        <button key={b.id} onClick={() => { setSelectedBureau(b); setBureauQuery('') }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-baseline gap-2">
                          <span className="font-medium text-gray-800">{b.nom}</span>
                          {b.commune && <span className="text-xs text-gray-400">{b.commune}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Field>
          ) : (
            <Field label="Paroisse">
              <input value={registreLieu} onChange={e => setRegistreLieu(e.target.value)} placeholder="Ex. Paroisse Saint-François…" className={inputCls} />
            </Field>
          )}
          <Field label="Période" required>
            <div className="flex items-center gap-2">
              <input value={registreAnneeDebut} onChange={e => setRegistreAnneeDebut(e.target.value)} placeholder="1880" maxLength={4} className={`${inputCls} w-24`} />
              <span className="text-gray-400">–</span>
              <input value={registreAnneeFin} onChange={e => setRegistreAnneeFin(e.target.value)} placeholder="1880" maxLength={4} className={`${inputCls} w-24`} />
            </div>
          </Field>
          {registreIntitule && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Intitulé généré</p>
              <p className="text-sm font-semibold text-slate-800">{registreIntitule}</p>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">C'est où ?</p>
        <div className="space-y-3">
          <Field label="Dépôt / institution">
            <DepotPicker depotQuery={depotQuery} setDepotQuery={setDepotQuery}
              depotResults={depotResults} depotSearching={depotSearching}
              selectedDepot={selectedDepot} setSelectedDepot={setSelectedDepot} />
          </Field>
          <Field label="Cote">
            <input value={level.cote} onChange={e => patch('cote', e.target.value)} placeholder="Ex. 5Mi/456" className={inputCls} />
          </Field>
          <Field label="Vues (début – fin)">
            <input value={level.position} onChange={e => patch('position', e.target.value)} placeholder="Ex. 1–250" className={inputCls} />
          </Field>
        </div>
      </div>
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Comment y accéder ?</p>
        <Field label="URL">
          <input value={level.url} onChange={e => patch('url', e.target.value)} placeholder="https://…" className={inputCls} />
        </Field>
      </div>
      <div className="border-t border-slate-100 pt-4">
        <Field label="Notes (optionnel)">
          <textarea value={level.notes} onChange={e => patch('notes', e.target.value)}
            placeholder="Observations…" className={`${inputCls} min-h-[60px] resize-none`} />
        </Field>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ReferenceWizardPage() {
  const navigate = useNavigate()

  // Lookups
  const [series,        setSeries]        = useState<SerieOption[]>([])
  const [loadingSeries, setLoadingSeries] = useState(true)
  const [ecTypeActes,   setEcTypeActes]   = useState<EcTypeActe[]>([])

  // Wizard state
  const [step,        setStep]        = useState<RWStep>('serie')
  const [serieId,     setSerieId]     = useState<string | null>(null)
  const [findType,    setFindType]    = useState<'acte' | 'table' | 'registre'>('acte')
  const [acte,        setActe]        = useState<RWLevel>({ ...RW_EMPTY })
  const [hasTable,         setHasTable]         = useState<boolean | null>(null)
  const [table,            setTable]            = useState<RWLevel>({ ...RW_EMPTY })
  const [tablePeriodicite, setTablePeriodicite] = useState<string | null>(null)
  const [tableClassement,  setTableClassement]  = useState<string | null>(null)
  const [tableTypeActeIds, setTableTypeActeIds] = useState<string[]>([])
  const [tableAnneeDebut,  setTableAnneeDebut]  = useState('')
  const [tableAnneeFin,    setTableAnneeFin]    = useState('')
  const [tableLieu,        setTableLieu]        = useState('')
  const [bureauQuery,      setBureauQuery]      = useState('')
  const [bureauResults,    setBureauResults]    = useState<Array<{ id: string; nom: string; commune: string | null }>>([])
  const [bureauSearching,  setBureauSearching]  = useState(false)
  const [selectedBureau,   setSelectedBureau]   = useState<{ id: string; nom: string; commune: string | null } | null>(null)
  const [selectedTableUd,  setSelectedTableUd]  = useState<{ id: string; titre: string } | null>(null)
  const [tableUdMatches,   setTableUdMatches]   = useState<Array<{ id: string; titre: string; statut: string | null; workflow_statut: string }>>([])
  const [tableUdSearching, setTableUdSearching] = useState(false)
  const [hasRegistre,         setHasRegistre]         = useState<boolean | null>(null)
  const [registre,            setRegistre]            = useState<RWLevel>({ ...RW_EMPTY })
  const [registreTypeActeIds, setRegistreTypeActeIds] = useState<string[]>([])
  const [registreAnneeDebut,  setRegistreAnneeDebut]  = useState('')
  const [registreAnneeFin,    setRegistreAnneeFin]    = useState('')
  const [registreLieu,        setRegistreLieu]        = useState('')
  const [saving,      setSaving]      = useState(false)

  // Dedup state
  const [selectedUd,           setSelectedUd]           = useState<UDMatch | null>(null)
  const [selectedExemplaireId, setSelectedExemplaireId] = useState<string | null>(null)
  const [showNewExemplaire,    setShowNewExemplaire]    = useState(false)
  const [udMatches,            setUdMatches]            = useState<UDMatch[]>([])
  const [udSearching,          setUdSearching]          = useState(false)
  const [depotQuery,     setDepotQuery]     = useState('')
  const [depotResults,   setDepotResults]   = useState<DepotOption[]>([])
  const [depotSearching, setDepotSearching] = useState(false)
  const [selectedDepot,  setSelectedDepot]  = useState<DepotOption | null>(null)

  // IDs des entités persistées au fil des étapes
  const [savedActeId,            setSavedActeId]            = useState<string | null>(null)
  const [savedTableId,           setSavedTableId]           = useState<string | null>(null)
  const [savedEcTableId,         setSavedEcTableId]         = useState<string | null>(null)
  const [savedTableExemplaireId, setSavedTableExemplaireId] = useState<string | null>(null)
  const [savedRegistreId,           setSavedRegistreId]           = useState<string | null>(null)
  const [savedRegistreExemplaireId, setSavedRegistreExemplaireId] = useState<string | null>(null)
  const [stepping,                  setStepping]                  = useState(false)

  useEffect(() => {
    void supabase
      .from('ref_series_documentaires')
      .select('id, code, label')
      .order('label')
      .then(({ data }) => { setSeries((data ?? []) as SerieOption[]); setLoadingSeries(false) })
  }, [])

  useEffect(() => {
    void supabase
      .from('ref_ec_type_acte')
      .select('id, code, label, label_pluriel')
      .order('position')
      .then(({ data }) => setEcTypeActes((data ?? []) as EcTypeActe[]))
  }, [])

  const serieCode        = series.find(s => s.id === serieId)?.code ?? null
  const vocab            = getVocab(serieCode)
  const useStructuredTable = serieCode != null && STRUCTURED_TABLE_SERIES.has(serieCode)
  const tableLieuForTitle = serieCode === 'ETAT_CIVIL'
    ? (selectedBureau?.commune ?? selectedBureau?.nom ?? '')
    : tableLieu
  const tableIntitule = computeTableIntitule(tablePeriodicite, tableClassement, tableTypeActeIds, ecTypeActes, tableAnneeDebut, tableAnneeFin, tableLieuForTitle)
  const registreLieuForTitle = serieCode === 'ETAT_CIVIL'
    ? (selectedBureau?.commune ?? selectedBureau?.nom ?? '')
    : registreLieu
  const registreIntitule = useStructuredTable
    ? computeRegistreIntitule(registreTypeActeIds, ecTypeActes, registreAnneeDebut, registreAnneeFin, registreLieuForTitle)
    : null

  // Recherche dynamique de bureau état civil
  useEffect(() => {
    const q = bureauQuery.trim()
    if (q.length < 2 || selectedBureau) { setBureauResults([]); setBureauSearching(false); return }
    setBureauSearching(true)
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('etat_civil_bureaux')
          .select('id, nom, commune')
          .or(`nom.ilike.%${q}%,commune.ilike.%${q}%`)
          .order('commune', { ascending: true, nullsFirst: false })
          .limit(10)
        setBureauResults((data ?? []) as any[])
      } finally {
        setBureauSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [bureauQuery, selectedBureau])

  // Recherche de dépôt par institution (sigle ou nom) → liste des dépôts de l'institution
  useEffect(() => {
    const q = depotQuery.trim()
    if (q.length < 2 || selectedDepot) { setDepotResults([]); setDepotSearching(false); return }
    setDepotSearching(true)
    const t = setTimeout(async () => {
      try {
        const toOption = (d: any): DepotOption => {
          const inst  = Array.isArray(d.ref_institutions) ? d.ref_institutions[0] : d.ref_institutions
          const dtype = Array.isArray(d.ref_depot_type)   ? d.ref_depot_type[0]   : d.ref_depot_type
          const plat  = Array.isArray(d.ref_plateformes)  ? d.ref_plateformes[0]  : d.ref_plateformes
          return {
            id: d.id,
            institution_sigle: inst?.sigle ?? null,
            institution_nom:   inst?.nom   ?? null,
            type_code:    dtype?.code      ?? null,
            type_label:   dtype?.label     ?? null,
            plateforme_label: plat?.label  ?? null,
            is_online: dtype?.is_online    ?? false,
          }
        }

        const { data: instData } = await supabase
          .from('ref_institutions')
          .select('id')
          .or(`nom.ilike.%${q}%,sigle.ilike.%${q}%`)
          .limit(20)
        const instIds = (instData ?? []).map((i: any) => i.id as string)
        if (instIds.length === 0) { setDepotResults([]); return }

        const { data: depotData } = await supabase
          .from('ref_depots')
          .select(`
            id,
            ref_institutions!institution_id(nom, sigle),
            ref_depot_type!type_ref(code, label, is_online),
            ref_plateformes!plateforme_ref(code, label)
          `)
          .in('institution_id', instIds)
          .order('institution_id')
          .limit(20)
        setDepotResults((depotData ?? []).map(toOption).slice(0, 10))
      } finally {
        setDepotSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [depotQuery, selectedDepot])

  // Pré-remplir le dépôt depuis l'exemplaire de l'acte sélectionné
  useEffect(() => {
    if (!selectedExemplaireId) {
      setSelectedDepot(null)
      setDepotQuery('')
      return
    }
    if (!selectedUd || selectedDepot) return
    const ex = selectedUd.exemplaires.find(e => e.id === selectedExemplaireId)
    if (!ex?.depot_id) return
    void supabase
      .from('ref_depots')
      .select(`
        id,
        ref_institutions!institution_id(nom, sigle),
        ref_depot_type!type_ref(code, label, is_online),
        ref_plateformes!plateforme_ref(code, label)
      `)
      .eq('id', ex.depot_id)
      .maybeSingle()
      .then(({ data: d }) => {
        if (!d) return
        const inst  = Array.isArray((d as any).ref_institutions) ? (d as any).ref_institutions[0] : (d as any).ref_institutions
        const dtype = Array.isArray((d as any).ref_depot_type)   ? (d as any).ref_depot_type[0]   : (d as any).ref_depot_type
        const plat  = Array.isArray((d as any).ref_plateformes)  ? (d as any).ref_plateformes[0]  : (d as any).ref_plateformes
        setSelectedDepot({
          id: d.id,
          institution_sigle: inst?.sigle  ?? null,
          institution_nom:   inst?.nom    ?? null,
          type_code:    dtype?.code       ?? null,
          type_label:   dtype?.label      ?? null,
          plateforme_label: plat?.label   ?? null,
          is_online: dtype?.is_online     ?? false,
        })
      })
  }, [selectedExemplaireId, selectedUd])

  // Dedup search pour la table (déclenché quand l'intitulé est généré)
  useEffect(() => {
    if (step !== 'table' || !serieId || !tableIntitule) {
      setTableUdMatches([])
      setTableUdSearching(false)
      return
    }
    setTableUdSearching(true)
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('ref_unites_documentaires')
          .select('id, titre, workflow_statut, statut')
          .eq('serie_ref', serieId)
          .ilike('titre', `%${tableIntitule.slice(0, 40)}%`)
          .order('updated_at', { ascending: false })
          .limit(5)
        setTableUdMatches((data ?? []) as any[])
      } catch (err) {
        console.error('table dedup', err)
      } finally {
        setTableUdSearching(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [tableIntitule, step, serieId])

  // Live dedup search while typing in the acte step
  useEffect(() => {
    const q = acte.intitule.trim()
    if (step !== 'acte' || !serieId || q.length < 3) {
      setUdMatches([])
      setUdSearching(false)
      return
    }
    setUdSearching(true)
    const t = setTimeout(async () => {
      try {
        const targetType = SERIE_TARGET_TYPE[serieCode ?? ''] ?? null

        // Requête 1 : UDs + exemplaires + citations + dépôts
        const { data: udData, error: udError } = await supabase
          .from('ref_unites_documentaires')
          .select(`
            id, titre, workflow_statut, statut,
            ref_exemplaires (
              id, cote_locale,
              parent_exemplaire:ref_exemplaires!parent_exemplaire_id (
                id, cote_locale,
                ref_depots ( nom, ref_institutions ( nom, sigle ) )
              ),
              citations ( target_type, target_id, locating ),
              ref_depots ( id, nom, ref_institutions ( nom, sigle ) )
            )
          `)
          .eq('serie_ref', serieId)
          .ilike('titre', `%${q}%`)
          .order('updated_at', { ascending: false })
          .limit(10)

        if (udError) throw udError

        // Filtre JS : si targetType connu, garder uniquement les UDs
        // qui ont au moins une citation du bon type
        const allUds = (udData ?? []) as any[]
        const filteredUds = targetType
          ? allUds.filter(ud =>
              (ud.ref_exemplaires ?? []).some((ex: any) =>
                (ex.citations ?? []).some((c: any) => c.target_type === targetType)
              )
            )
          : allUds

        // Requête 2 : entités métier (ec_acte ou ac_acte) pour enrichissement
        const domainActeMap = new Map<string, DomainActe>()
        if (targetType && filteredUds.length > 0) {
          const targetIds = [...new Set<string>(
            filteredUds.flatMap((ud: any) =>
              (ud.ref_exemplaires ?? []).flatMap((ex: any) =>
                (ex.citations ?? [])
                  .filter((c: any) => c.target_type === targetType)
                  .map((c: any) => c.target_id as string)
              )
            )
          )]

          if (targetIds.length > 0) {
            if (targetType === 'ec_acte') {
              const { data: ecData } = await supabase
                .from('etat_civil_actes')
                .select('id, type_acte, date, annee, numero_acte, bureau:etat_civil_bureaux!bureau_id(nom, commune)')
                .in('id', targetIds)
              for (const a of (ecData ?? []) as any[]) {
                const bureau = Array.isArray(a.bureau) ? a.bureau[0] : a.bureau
                domainActeMap.set(a.id, {
                  id: a.id,
                  type_acte: a.type_acte ?? null,
                  date: a.date ?? null,
                  annee: a.annee ?? null,
                  numero_acte: a.numero_acte ?? null,
                  bureau_nom: bureau ? `${bureau.nom}${bureau.commune ? ` (${bureau.commune})` : ''}` : null,
                })
              }
            } else if (targetType === 'ac_acte') {
              const { data: acData } = await supabase
                .from('actes')
                .select('id, label')
                .in('id', targetIds)
              for (const a of (acData ?? []) as any[]) {
                domainActeMap.set(a.id, {
                  id: a.id, type_acte: 'Acte notarié',
                  date: null, annee: null, numero_acte: null, bureau_nom: null,
                })
              }
            }
          }
        }

        // Construction des UDMatch
        const mapped: UDMatch[] = filteredUds.slice(0, 5).map((ud: any) => {
          // Premier acte métier associé à cette UD
          let domainActe: DomainActe | null = null
          if (targetType) {
            outer: for (const ex of (ud.ref_exemplaires ?? [])) {
              for (const c of (ex.citations ?? [])) {
                if (c.target_type === targetType && domainActeMap.has(c.target_id)) {
                  domainActe = domainActeMap.get(c.target_id)!
                  break outer
                }
              }
            }
          }
          return {
            id: ud.id,
            titre: ud.titre,
            workflow_statut: ud.workflow_statut,
            statut: ud.statut ?? null,
            exemplaires: (ud.ref_exemplaires ?? []).map((ex: any) => {
              const depot = Array.isArray(ex.ref_depots) ? ex.ref_depots[0] : ex.ref_depots
              const inst  = depot ? (Array.isArray(depot.ref_institutions) ? depot.ref_institutions[0] : depot.ref_institutions) : null
              const matchCitation = targetType
                ? (ex.citations ?? []).find((c: any) => c.target_type === targetType)
                : null
              const loc = matchCitation?.locating
              const sys0 = Array.isArray(loc?.systems) ? loc.systems[0] : null
              const vue = sys0?.raw?.trim() || (sys0?.start != null
                ? (sys0.end != null && sys0.end !== sys0.start ? `${sys0.start}–${sys0.end}` : String(sys0.start))
                : null)
              const rawPEx = Array.isArray(ex.parent_exemplaire) ? ex.parent_exemplaire[0] : ex.parent_exemplaire
              const pExDepot = rawPEx ? (Array.isArray(rawPEx.ref_depots) ? rawPEx.ref_depots[0] : rawPEx.ref_depots) : null
              const pExInst  = pExDepot ? (Array.isArray(pExDepot.ref_institutions) ? pExDepot.ref_institutions[0] : pExDepot.ref_institutions) : null
              const parentExemplaire: ParentExemplaire | null = rawPEx ? {
                id: rawPEx.id,
                cote_locale: rawPEx.cote_locale ?? null,
                depot_nom: pExDepot?.nom ?? null,
                institution_sigle: pExInst?.sigle ?? null,
                institution_nom: pExInst?.nom ?? null,
              } : null
              return {
                id: ex.id,
                cote_locale: ex.cote_locale ?? null,
                depot_id: depot?.id ?? null,
                depot_nom: depot?.nom ?? null,
                institution_sigle: inst?.sigle ?? null,
                institution_nom: inst?.nom ?? null,
                vue: vue ?? null,
                parentExemplaire,
              }
            }),
            domainActe,
          }
        })
        setUdMatches(mapped)
      } catch (err) {
        console.error('dedup search', err)
      } finally {
        setUdSearching(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [acte.intitule, step, serieId, serieCode])

  const patch = (setter: React.Dispatch<React.SetStateAction<RWLevel>>) =>
    (f: keyof RWLevel, v: string) => setter(prev => ({ ...prev, [f]: v }))

  async function saveActeStep(): Promise<boolean> {
    if (!serieId) return false
    if (selectedUd) { setSavedActeId(selectedUd.id); return true }
    const acteTitle = acte.intitule.trim() || 'Document sans titre'
    try {
      if (savedActeId) {
        await supabase.from('ref_unites_documentaires').update({ titre: acteTitle }).eq('id', savedActeId)
        toast.success('Acte mis à jour')
      } else {
        const { data, error } = await insertDocumentUD({
          titre: acteTitle, serie_ref: serieId, parent_ud_id: null,
          cote: acte.cote || null,
          note: [acte.position && `Vue : ${acte.position}`, acte.url, acte.notes].filter(Boolean).join(' · ') || null,
        })
        if (error) throw error
        const newId = data?.id ?? null
        setSavedActeId(newId)
        if (newId && selectedDepot) {
          const { data: ex } = await supabase.from('ref_exemplaires')
            .insert({ unite_documentaire_id: newId, depot_id: selectedDepot.id, cote_locale: acte.cote || null, localisation_interne: acte.position || null })
            .select('id').single()
          if (ex?.id && acte.url.trim()) {
            await supabase.from('ref_acces_numeriques').insert({
              exemplaire_id: ex.id, url_base: acte.url.trim(),
              type_acces_id: '1f6de1f1-9167-4b82-a3f1-1cdb7ae756e1',
            })
          }
        }
        toast.success('Acte enregistré')
      }
      return true
    } catch { toast.error("Erreur lors de l'enregistrement de l'acte"); return false }
  }

  async function saveTableStep(): Promise<boolean> {
    if (!serieId || !hasTable) return true
    if (selectedTableUd) {
      setSavedTableId(selectedTableUd.id)
      toast.info('Table existante sélectionnée — aucune insertion')
      return true
    }
    const tableTitre = useStructuredTable ? tableIntitule : table.intitule.trim()
    console.log('[saveTableStep]', { tableTitre, useStructuredTable, tableIntitule, tablePeriodicite, tableAnneeDebut })
    if (!tableTitre) {
      toast.error("Intitulé de table manquant — vérifie la périodicité et l'année")
      return false
    }
    try {
      // Helpers partagés INSERT / UPDATE
      const buildEcTablePayload = (udId: string) => {
        const anneeDebut = parseInt(tableAnneeDebut.trim(), 10)
        const anneeFin   = tableAnneeFin.trim() ? parseInt(tableAnneeFin.trim(), 10) : null
        const typeIds    = tableTypeActeIds.includes('tous') ? [] : tableTypeActeIds
        return {
          unite_documentaire_id: udId, bureau_id: selectedBureau?.id ?? null,
          periodicite: tablePeriodicite!, classement: tableClassement,
          annee_debut: anneeDebut, ...(anneeFin !== null ? { annee_fin: anneeFin } : {}),
          type_acte_ids: typeIds, label: tableTitre,
        }
      }
      const insertExemplaireAndLinks = async (udId: string, ecTableId: string | null) => {
        if (!selectedDepot) return null
        const { data: exTbl, error: exErr } = await supabase.from('ref_exemplaires').insert({
          unite_documentaire_id: udId, depot_id: selectedDepot.id,
          cote_locale: table.cote || null, localisation_interne: table.position || null,
        }).select('id').single()
        if (exErr) throw exErr
        const exId = exTbl?.id ?? null
        if (exId && ecTableId) {
          const { error: citErr } = await supabase.from('citations').insert({
            exemplaire_id: exId, target_type: 'ec_table', target_id: ecTableId,
            locating: table.position ? { systems: [{ raw: table.position }] } : {}, is_missing: false,
          })
          if (citErr) throw citErr
        }
        if (exId && table.url.trim()) {
          await supabase.from('ref_acces_numeriques').insert({
            exemplaire_id: exId, url_base: table.url.trim(),
            type_acces_id: '1f6de1f1-9167-4b82-a3f1-1cdb7ae756e1',
          })
        }
        return exId
      }

      if (savedTableId) {
        // Mise à jour du titre UD
        await supabase.from('ref_unites_documentaires').update({ titre: tableTitre }).eq('id', savedTableId)

        let ecTableId = savedEcTableId
        if (useStructuredTable) {
          if (savedEcTableId) {
            await supabase.from('ec_tables').update(buildEcTablePayload(savedTableId)).eq('id', savedEcTableId)
          } else {
            // ec_tables absent (échec partiel précédent) — on le crée
            const { data: ecTbl, error: ecErr } = await supabase.from('ec_tables')
              .insert(buildEcTablePayload(savedTableId)).select('id').single()
            if (ecErr) throw ecErr
            ecTableId = ecTbl?.id ?? null
            setSavedEcTableId(ecTableId)
          }
        }

        if (!savedTableExemplaireId) {
          // Exemplaire absent — on le crée si dépôt sélectionné
          const exId = await insertExemplaireAndLinks(savedTableId, ecTableId)
          if (exId) setSavedTableExemplaireId(exId)
        }

        toast.success('Table mise à jour')
      } else {
        const { data, error } = await insertDocumentUD({
          titre: tableTitre, serie_ref: serieId, parent_ud_id: null,
          cote: table.cote || null,
          note: useStructuredTable
            ? (table.notes || null)
            : [table.position && `Vues : ${table.position}`, table.url, table.notes].filter(Boolean).join(' · ') || null,
        })
        if (error) throw error
        const tableId = data?.id ?? null
        // Commiter l'ID UD immédiatement pour éviter un double INSERT en cas de retry
        setSavedTableId(tableId)

        let ecTableId: string | null = null
        if (tableId && useStructuredTable) {
          const { data: ecTbl, error: ecErr } = await supabase.from('ec_tables')
            .insert(buildEcTablePayload(tableId)).select('id').single()
          if (ecErr) throw ecErr
          ecTableId = ecTbl?.id ?? null
        }

        const exId = tableId ? await insertExemplaireAndLinks(tableId, ecTableId) : null

        // Commiter les IDs restants seulement si tout a réussi
        setSavedEcTableId(ecTableId)
        setSavedTableExemplaireId(exId)

        toast.success('Table enregistrée')
      }
      return true
    } catch (err) {
      console.error('[saveTableStep] error:', err)
      setSelectedTableUd(null)
      setSavedTableId(null)
      setSavedEcTableId(null)
      setSavedTableExemplaireId(null)
      toast.error("Erreur lors de l'enregistrement de la table")
      return false
    }
  }

  async function saveRegistreStep(): Promise<boolean> {
    if (!serieId || !hasRegistre) return true
    const titre = (useStructuredTable ? registreIntitule : null) ?? registre.intitule.trim()
    if (!titre) return true

    const insertExemplaireRegistre = async (udId: string) => {
      if (!selectedDepot) return null
      const { data: exReg, error: exErr } = await supabase.from('ref_exemplaires').insert({
        unite_documentaire_id: udId,
        depot_id: selectedDepot.id,
        cote_locale: registre.cote || null,
        localisation_interne: registre.position || null,
      }).select('id').single()
      if (exErr) throw exErr
      const exId = exReg?.id ?? null
      if (exId && registre.url.trim()) {
        await supabase.from('ref_acces_numeriques').insert({
          exemplaire_id: exId, url_base: registre.url.trim(),
          type_acces_id: '1f6de1f1-9167-4b82-a3f1-1cdb7ae756e1',
        })
      }
      return exId
    }

    try {
      if (savedRegistreId) {
        await supabase.from('ref_unites_documentaires').update({ titre }).eq('id', savedRegistreId)
        if (!savedRegistreExemplaireId) {
          const exId = await insertExemplaireRegistre(savedRegistreId)
          setSavedRegistreExemplaireId(exId)
        }
        toast.success('Registre mis à jour')
      } else {
        const { data, error } = await insertDocumentUD({
          titre, serie_ref: serieId, parent_ud_id: null,
          cote: registre.cote || null,
          note: useStructuredTable
            ? (registre.notes || null)
            : [registre.institution, registre.url, registre.notes].filter(Boolean).join(' · ') || null,
        })
        if (error) throw error
        const registreId = data?.id ?? null
        setSavedRegistreId(registreId)
        const exId = registreId ? await insertExemplaireRegistre(registreId) : null
        setSavedRegistreExemplaireId(exId)
        toast.success('Registre enregistré')
      }
      return true
    } catch (err) {
      console.error('[saveRegistreStep] error:', err)
      setSavedRegistreId(null)
      setSavedRegistreExemplaireId(null)
      toast.error("Erreur lors de l'enregistrement du registre")
      return false
    }
  }

  async function goNext() {
    if (step === 'serie')        { setStep('type'); return }
    if (step === 'type')         { setStep(findType === 'acte' ? 'acte' : findType === 'table' ? 'table' : 'registre'); return }
    if (step === 'acte') {
      setStepping(true)
      const ok = await saveActeStep()
      setStepping(false)
      if (ok) setStep('ask-table')
      return
    }
    if (step === 'ask-table')    { setStep(hasTable ? 'table' : 'ask-registre'); return }
    if (step === 'table') {
      setStepping(true)
      const ok = await saveTableStep()
      setStepping(false)
      if (ok) setStep('ask-registre')
      return
    }
    if (step === 'ask-registre') { setStep(hasRegistre ? 'registre' : 'summary'); return }
    if (step === 'registre') {
      setStepping(true)
      const ok = await saveRegistreStep()
      setStepping(false)
      if (ok) setStep('summary')
      return
    }
  }

  function goBack() {
    if (step === 'type')         { setStep('serie'); return }
    if (step === 'acte')         { setSelectedUd(null); setUdMatches([]); setSelectedExemplaireId(null); setShowNewExemplaire(false); setStep('type'); return }
    if (step === 'ask-table')    { setStep('acte'); return }
    if (step === 'table')        { setStep('ask-table'); return }
    if (step === 'ask-registre') { setStep(hasTable ? 'table' : findType === 'acte' ? 'ask-table' : 'type'); return }
    if (step === 'registre')     { setStep('ask-registre'); return }
    if (step === 'summary')      { setStep(hasRegistre ? 'registre' : 'ask-registre'); return }
    setStep('serie')
  }

  async function handleSave() {
    if (!serieId) return
    setSaving(true)
    try {
      // Lier table → registre
      if (savedTableId && savedRegistreId) {
        await supabase.from('ref_unites_documentaires')
          .update({ parent_ud_id: savedRegistreId }).eq('id', savedTableId)
      }

      // Lier acte (nouveau) → table ou registre
      const acteParentId = savedTableId ?? savedRegistreId ?? null
      if (savedActeId && !selectedUd && acteParentId) {
        await supabase.from('ref_unites_documentaires')
          .update({ parent_ud_id: acteParentId }).eq('id', savedActeId)
      }

      // Mettre à jour dans_table / dans_registre sur l'exemplaire existant
      if (selectedExemplaireId) {
        const { error } = await supabase.from('ref_exemplaires')
          .update({ dans_table: hasTable, dans_registre: hasRegistre }).eq('id', selectedExemplaireId)
        if (error) throw error
      }

      toast.success(selectedUd ? 'Document retrouvé — à compléter depuis sa fiche' : 'Document référencé')
      navigate('/mock/sources-corpus')
    } catch {
      toast.error('Erreur lors de la finalisation')
      setSaving(false)
    }
  }

  const canContinue =
    (step === 'serie'        && serieId !== null) ||
    step === 'type' ||
    (step === 'acte'         && (selectedUd !== null || acte.intitule.trim().length > 0)) ||
    step === 'ask-table' ||
    (step === 'table'        && (useStructuredTable ? (tablePeriodicite !== null && tableAnneeDebut.trim().length > 0 && (serieCode !== 'ETAT_CIVIL' || selectedBureau !== null)) : table.intitule.trim().length > 0)) ||
    step === 'ask-registre' ||
    (step === 'registre'     && (useStructuredTable
      ? (registreAnneeDebut.trim().length > 0 && (serieCode !== 'ETAT_CIVIL' || selectedBureau !== null))
      : registre.intitule.trim().length > 0)) ||
    step === 'summary'

  const stepLabel: Record<RWStep, string> = {
    serie:          'Série documentaire',
    type:           'Type de document',
    acte:           vocab.level1.label,
    'ask-table':    'Section ou index ?',
    table:          vocab.level2.label,
    'ask-registre': 'Volume ou registre ?',
    registre:       vocab.level3.label,
    summary:        'Récapitulatif',
  }

  const askTableQuestion    = `Ce document est-il dans ${vocab.level2.label.match(/^(Un|Une) /i) ? vocab.level2.label.replace(/^(Un|Une) /i, (m) => m.toLowerCase()) : 'une section ou un index'} ?`
  const askRegistreQuestion = `Ce document est-il dans ${vocab.level3.label.match(/^(Un|Une) /i) ? vocab.level3.label.replace(/^(Un|Une) /i, (m) => m.toLowerCase()) : 'un volume ou registre'} ?`

  function renderActeStep() {
    const patchActe = patch(setActe)
    return (
      <div className="space-y-5">
        {/* Quoi */}
        {selectedUd ? (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">C'est quoi ?</p>
            <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-sm font-semibold text-gray-900">{selectedUd.titre}</p>
                {selectedUd.domainActe && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedUd.domainActe.type_acte && (
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                        {selectedUd.domainActe.type_acte}
                      </span>
                    )}
                    {selectedUd.domainActe.numero_acte && (
                      <span className="text-[11px] font-mono text-gray-600">n°{selectedUd.domainActe.numero_acte}</span>
                    )}
                    {(selectedUd.domainActe.date ?? selectedUd.domainActe.annee) && (
                      <span className="text-[11px] text-gray-500">{selectedUd.domainActe.date ?? selectedUd.domainActe.annee}</span>
                    )}
                    {selectedUd.domainActe.bureau_nom && (
                      <span className="text-[11px] text-gray-400">· {selectedUd.domainActe.bureau_nom}</span>
                    )}
                  </div>
                )}
                {selectedUd.statut && (() => {
                  const s = selectedUd.statut!
                  const cls = s === 'actif'       ? 'bg-green-100 text-green-700 border-green-200'
                            : s === 'a_qualifier' ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : s === 'archive'     ? 'bg-gray-100 text-gray-500 border-gray-200'
                            :                       'bg-gray-100 text-gray-600 border-gray-200'
                  return (
                    <span className={`self-start text-[11px] font-medium px-1.5 py-0.5 rounded-full border ${cls}`}>
                      {s.replace(/_/g, ' ')}
                    </span>
                  )
                })()}
              </div>
              <button onClick={() => { setSelectedUd(null); setSelectedExemplaireId(null); setShowNewExemplaire(false) }} className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">C'est quoi ?</p>
            <Field label="Intitulé" required>
              <input value={acte.intitule} onChange={e => patchActe('intitule', e.target.value)}
                placeholder={vocab.level1.placeholder} className={inputCls} autoFocus />
            </Field>

            {/* Résultats de recherche dedup */}
            {udSearching && (
              <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
                <Loader2 className="w-3 h-3 animate-spin" />Recherche de doublons…
              </div>
            )}
            {!udSearching && udMatches.length > 0 && (
              <div className="rounded-xl border border-amber-200 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-100">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <p className="text-xs font-medium text-amber-700">
                    {udMatches.length} document{udMatches.length > 1 ? 's similaires trouvés' : ' similaire trouvé'} — vérifie avant de créer
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {udMatches.map(ud => (
                    <div key={ud.id} className="flex items-start gap-3 px-3 py-2.5 bg-white hover:bg-gray-50">
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium text-gray-800">{ud.titre}</p>
                        {/* Détails de l'acte métier */}
                        {ud.domainActe && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {ud.domainActe.type_acte && (
                              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                                {ud.domainActe.type_acte}
                              </span>
                            )}
                            {ud.domainActe.numero_acte && (
                              <span className="text-[11px] font-mono text-gray-500">n°{ud.domainActe.numero_acte}</span>
                            )}
                            {(ud.domainActe.date ?? ud.domainActe.annee) && (
                              <span className="text-[11px] text-gray-500">{ud.domainActe.date ?? ud.domainActe.annee}</span>
                            )}
                            {ud.domainActe.bureau_nom && (
                              <span className="text-[11px] text-gray-400">· {ud.domainActe.bureau_nom}</span>
                            )}
                          </div>
                        )}
                        {/* Statut + exemplaires */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {ud.statut && (() => {
                            const s = ud.statut!
                            const cls = s === 'actif'       ? 'bg-green-100 text-green-700 border-green-200'
                                      : s === 'a_qualifier' ? 'bg-amber-100 text-amber-700 border-amber-200'
                                      : s === 'archive'     ? 'bg-gray-100 text-gray-500 border-gray-200'
                                      :                       'bg-gray-100 text-gray-600 border-gray-200'
                            return (
                              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full border ${cls}`}>
                                {s.replace(/_/g, ' ')}
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                      <button onClick={() => { setSelectedUd(ud); setSelectedExemplaireId(null); setShowNewExemplaire(false) }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 shrink-0 whitespace-nowrap transition-colors">
                        Sélectionner
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!udSearching && acte.intitule.trim().length >= 3 && udMatches.length === 0 && (
              <p className="text-xs text-emerald-600 px-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />Aucun doublon trouvé
              </p>
            )}
          </div>
        )}

        {/* Où */}
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">C'est où ?</p>
          {selectedUd ? (
            <div className="space-y-2">
              {selectedUd.exemplaires.map(ex => (
                <button key={ex.id}
                  onClick={() => { setSelectedExemplaireId(ex.id); setShowNewExemplaire(false) }}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                    selectedExemplaireId === ex.id
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-800">
                        {ex.institution_sigle ?? ex.institution_nom ?? ex.depot_nom ?? '?'}
                      </span>
                      {ex.cote_locale && (
                        <span className="text-xs font-mono text-gray-500">{ex.cote_locale}</span>
                      )}
                      {ex.vue && (
                        <span className="text-xs text-gray-400">· vue {ex.vue}</span>
                      )}
                    </div>
                    {ex.parentExemplaire && (
                      <p className="text-[11px] text-gray-400 pl-5">
                        dans {ex.parentExemplaire.institution_sigle ?? ex.parentExemplaire.institution_nom ?? ex.parentExemplaire.depot_nom ?? '?'}
                        {ex.parentExemplaire.cote_locale && (
                          <span className="font-mono ml-1">{ex.parentExemplaire.cote_locale}</span>
                        )}
                      </p>
                    )}
                  </div>
                </button>
              ))}
              {!showNewExemplaire ? (
                <button
                  onClick={() => { setShowNewExemplaire(true); setSelectedExemplaireId(null) }}
                  className="w-full text-left rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                  + Nouvel emplacement
                </button>
              ) : (
                <div className="rounded-xl border border-gray-200 px-4 py-3 space-y-3">
                  <Field label="Dépôt / institution">
                    <DepotPicker
                      depotQuery={depotQuery} setDepotQuery={setDepotQuery}
                      depotResults={depotResults} depotSearching={depotSearching}
                      selectedDepot={selectedDepot} setSelectedDepot={setSelectedDepot}
                      autoFocus
                    />
                  </Field>
                  <Field label="Cote">
                    <input value={acte.cote} onChange={e => patchActe('cote', e.target.value)} placeholder="Ex. 5Mi/456" className={inputCls} />
                  </Field>
                  <Field label="Vue / folio">
                    <input value={acte.position} onChange={e => patchActe('position', e.target.value)} placeholder="Ex. 12" className={inputCls} />
                  </Field>
                  <Field label="URL">
                    <input value={acte.url} onChange={e => patchActe('url', e.target.value)} placeholder="https://…" className={inputCls} />
                  </Field>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Field label="Dépôt / institution">
                <DepotPicker
                  depotQuery={depotQuery} setDepotQuery={setDepotQuery}
                  depotResults={depotResults} depotSearching={depotSearching}
                  selectedDepot={selectedDepot} setSelectedDepot={setSelectedDepot}
                />
              </Field>
              <Field label="Cote">
                <input value={acte.cote} onChange={e => patchActe('cote', e.target.value)} placeholder="Ex. 5Mi/456" className={inputCls} />
              </Field>
              <Field label="Vue / folio">
                <input value={acte.position} onChange={e => patchActe('position', e.target.value)} placeholder="Ex. 12" className={inputCls} />
              </Field>
            </div>
          )}
        </div>
        {!selectedUd && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Comment y accéder ?</p>
            <Field label="URL">
              <input value={acte.url} onChange={e => patchActe('url', e.target.value)} placeholder="https://…" className={inputCls} />
            </Field>
          </div>
        )}
        <div className="border-t border-slate-100 pt-4">
          <Field label="Notes (optionnel)">
            <textarea value={acte.notes} onChange={e => patchActe('notes', e.target.value)}
              placeholder="Observations…" className={`${inputCls} min-h-[60px] resize-none`} />
          </Field>
        </div>
      </div>
    )
  }

  function renderStep() {
    if (step === 'serie')        return <RWStepSerie series={series} serieId={serieId} onChange={setSerieId} />
    if (step === 'type')         return <RWStepType vocab={vocab} findType={findType} onChange={setFindType} />
    if (step === 'acte')         return renderActeStep()
    if (step === 'ask-table')    return <RWStepAskContext question={askTableQuestion}    detail={vocab.level2.desc} value={hasTable}    onChange={setHasTable} />
    if (step === 'table')        return useStructuredTable
      ? <RWStepDescribeTableEC
          ecTypeActes={ecTypeActes} serieCode={serieCode}
          tablePeriodicite={tablePeriodicite} setTablePeriodicite={setTablePeriodicite}
          tableClassement={tableClassement}   setTableClassement={setTableClassement}
          tableTypeActeIds={tableTypeActeIds} setTableTypeActeIds={setTableTypeActeIds}
          tableAnneeDebut={tableAnneeDebut} setTableAnneeDebut={setTableAnneeDebut}
          tableAnneeFin={tableAnneeFin}     setTableAnneeFin={setTableAnneeFin}
          tableLieu={tableLieu}             setTableLieu={setTableLieu}
          bureauQuery={bureauQuery}         setBureauQuery={setBureauQuery}
          bureauResults={bureauResults}     bureauSearching={bureauSearching}
          selectedBureau={selectedBureau}   setSelectedBureau={setSelectedBureau}
          tableIntitule={tableIntitule}
          tableUdSearching={tableUdSearching} tableUdMatches={tableUdMatches}
          selectedTableUd={selectedTableUd}   setSelectedTableUd={setSelectedTableUd}
          depotQuery={depotQuery}         setDepotQuery={setDepotQuery}
          depotResults={depotResults}     depotSearching={depotSearching}
          selectedDepot={selectedDepot}   setSelectedDepot={setSelectedDepot}
          level={table} patch={patch(setTable)}
        />
      : <RWStepDescribe kind="table" placeholder={vocab.level2.placeholder} level={table} patch={patch(setTable)} />
    if (step === 'ask-registre') return <RWStepAskContext question={askRegistreQuestion}                         value={hasRegistre} onChange={setHasRegistre} />
    if (step === 'registre') return useStructuredTable
      ? <RWStepDescribeRegistreEC
          ecTypeActes={ecTypeActes} serieCode={serieCode}
          registreTypeActeIds={registreTypeActeIds} setRegistreTypeActeIds={setRegistreTypeActeIds}
          registreAnneeDebut={registreAnneeDebut} setRegistreAnneeDebut={setRegistreAnneeDebut}
          registreAnneeFin={registreAnneeFin} setRegistreAnneeFin={setRegistreAnneeFin}
          registreLieu={registreLieu} setRegistreLieu={setRegistreLieu}
          bureauQuery={bureauQuery} setBureauQuery={setBureauQuery}
          bureauResults={bureauResults} bureauSearching={bureauSearching}
          selectedBureau={selectedBureau} setSelectedBureau={setSelectedBureau}
          registreIntitule={registreIntitule}
          depotQuery={depotQuery} setDepotQuery={setDepotQuery}
          depotResults={depotResults} depotSearching={depotSearching}
          selectedDepot={selectedDepot} setSelectedDepot={setSelectedDepot}
          level={registre} patch={patch(setRegistre)}
        />
      : <RWStepDescribe kind="registre" placeholder={vocab.level3.placeholder} level={registre} patch={patch(setRegistre)} />
    return <RWStepSummary vocab={vocab} acte={acte} selectedUd={selectedUd} hasTable={hasTable} table={table} hasRegistre={hasRegistre} registre={registre} />
  }

  if (loadingSeries) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  const showStepper  = !['serie', 'type'].includes(step)
  const selectedSerie = series.find(s => s.id === serieId)

  return (
    <div className="min-h-screen bg-gray-50">

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
          <span className="text-sm font-medium text-gray-800">J'ai trouvé un document</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-1"><Bell className="w-5 h-5 text-gray-400" /></button>
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">JB</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/mock/sources-corpus')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft className="w-4 h-4" />Retour
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">J'ai trouvé un document</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedSerie
                ? <span>Série : <span className="font-medium text-gray-700">{selectedSerie.label}</span></span>
                : 'Décris ce que tu as trouvé — on remonte la hiérarchie ensemble.'}
            </p>
          </div>
        </div>

        {showStepper && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
            <RWStepperBar step={step} findType={findType} hasTable={hasTable} hasRegistre={hasRegistre} />
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{stepLabel[step]}</p>
          {renderStep()}
        </div>

        <div className="flex items-center gap-3">
          {step !== 'serie' && (
            <button onClick={goBack}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              ← Retour
            </button>
          )}
          <div className="flex-1" />
          {step !== 'summary' ? (
            <button onClick={goNext} disabled={!canContinue || stepping}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {stepping
                ? <><Loader2 className="w-4 h-4 animate-spin" />Enregistrement…</>
                : 'Continuer →'}
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Enregistrement…</>
                : <><CheckCircle2 className="w-4 h-4" />Référencer ce document</>}
            </button>
          )}
        </div>

      </main>
    </div>
  )
}
