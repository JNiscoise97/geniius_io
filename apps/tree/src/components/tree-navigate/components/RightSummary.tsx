import { useEffect, useState } from 'react'
import { getBirth, getDeath } from '@geniius/utils/family-graph'
import { formatGedcomDate, getYear } from '@geniius/utils/family-graph'
import { MapPin, Users, ExternalLink, ChevronDown } from 'lucide-react'

import {
  getPerson,
  getParents,
  getSpouses,
  getChildren,
  getSpouseFamilies,
  getPersonPrimaryPhoto,
  type FamilyGraphPerson,
  type GedcomEvent,
} from '../data'
import { formatDisplayName, formatEventLine, formatPlace } from './lib/formatPersonInfos'
import { getAssocIndex, type AssocOccurrence } from './lib/assocIndex'
import { resolveRoleLabel } from './lib/resolveRoleLabel'
import { usePersonClickHandlers } from '../../../hook/usePersonClickHandlers'
import { ImageAvatar } from './ui/ImageAvatar'
import { PanelTitle } from './ui/PanelTitle'

// ── Labels événements ─────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  BIRT: 'Naissance', DEAT: 'Décès',   BURI: 'Inhumation', CHR: 'Baptême',
  MARR: 'Mariage',   CENS: 'Recens.', PROP: 'Propriété',  WILL: 'Testament',
  EVEN: 'Événement', FACT: 'Fait',    RESI: 'Résidence',  OCCU: 'Profession',
  EMIG: 'Émigration', IMMI: 'Immigration', NATU: 'Naturalisation',
  DIVO: 'Divorce',
}

function eventLabel(event: GedcomEvent): string {
  if (event.type && (event.tag === 'EVEN' || event.tag === 'FACT')) return event.type
  return EVENT_LABELS[event.tag] ?? event.type ?? event.tag
}

// ── Nom complet ───────────────────────────────────────────────────────────────

function fullName(person: FamilyGraphPerson): string {
  const last  = person.lastName && person.lastName.trim() !== '? SANS NOM' ? person.lastName : ''
  const first = person.firstName?.trim() ?? ''
  const nick  = person.nickname
    ? `${person.sex === 'F' ? 'dite' : 'dit'} ${person.nickname}`
    : ''
  return [last, first, nick].filter(Boolean).join(' ') || 'Individu sans nom'
}

// ── Source indicator ──────────────────────────────────────────────────────────

function hasSource(event: GedcomEvent): boolean {
  const quay = Number(event.sourceQuay)
  return (event.sourcePage !== undefined && event.sourcePage !== '') || quay >= 2
}

function dotFor(event?: GedcomEvent): string {
  if (!event) return 'bg-slate-200'
  if (hasSource(event)) return 'bg-emerald-400'
  if (event.date) return 'bg-amber-400'
  return 'bg-slate-300'
}

// ── PersonChip ────────────────────────────────────────────────────────────────

function PersonChip({
  person,
  onPersonNavigate,
  onPersonPreview,
}: {
  person: FamilyGraphPerson
  onPersonNavigate: (id: string) => void
  onPersonPreview: (id: string) => void
}) {
  const { onClick } = usePersonClickHandlers(person.id, onPersonNavigate, onPersonPreview)
  const birth    = getBirth(person)
  const death    = getDeath(person)
  const by       = getYear(birth?.date)
  const dy       = getYear(death?.date)
  const years    = by ? `${by}–${dy ?? '?'}` : ''
  const isFemale = person.sex === 'F'

  return (
    <button
      type="button"
      onClick={onClick}
      title="Clic : aperçu · Double-clic : centrer"
      className="flex w-full items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-left transition hover:border-slate-300 hover:bg-white"
    >
      <span className={[
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black',
        isFemale ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-sky-100 text-sky-700',
      ].join(' ')}>
        {isFemale ? '♀' : '♂'}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-800">
        {formatDisplayName(person)}
      </span>
      {years && (
        <span className="shrink-0 text-[10px] text-slate-400">{years}</span>
      )}
    </button>
  )
}

// ── EventRow ──────────────────────────────────────────────────────────────────

function EventRow({ label, event }: { label: string; event?: GedcomEvent }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${dotFor(event)}`} />
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{label}</span>
        {event ? (
          <p className="truncate text-[11px] font-medium text-slate-800">
            {formatEventLine(event.date, event.place) || (event.placeBrut ? formatPlace(event.placeBrut) : '—')}
          </p>
        ) : (
          <p className="text-[11px] text-slate-400">—</p>
        )}
      </div>
    </div>
  )
}

// ── ActLine (ligne compacte d'acte) ──────────────────────────────────────────

function ActLine({ event, prefix }: { event: GedcomEvent; prefix?: string }) {
  const year  = getYear(event.date)
  const place = event.place?.town ?? event.place?.county ?? event.placeBrut ?? ''
  const date  = event.date ? formatGedcomDate(event.date) : undefined

  return (
    <div className="flex items-start gap-2 py-1.5 text-[11px]">
      <span className={`mt-[4px] h-1.5 w-1.5 shrink-0 rounded-full ${dotFor(event)}`} />
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-slate-700">
          {prefix ? `${prefix} — ` : ''}{eventLabel(event)}
        </span>
        {(date || place) && (
          <span className="ml-1 text-slate-400">
            {date ?? year}
            {place && ` · ${place}`}
          </span>
        )}
      </div>
    </div>
  )
}

// ── AssocLine (ligne compacte acte tiers) ─────────────────────────────────────

function AssocLine({ occ }: { occ: AssocOccurrence }) {
  const assoc      = occ.event.assocs[occ.assocIndex]
  const role       = assoc ? resolveRoleLabel(assoc) : ''
  const owner      = occ.ownerKind === 'person' ? getPerson(occ.ownerId) : undefined
  const ownerName  = owner ? formatDisplayName(owner) : ''
  const year       = getYear(occ.event.date)
  const label      = eventLabel(occ.event)

  return (
    <div className="flex items-start gap-2 py-1.5 text-[11px]">
      <span className={`mt-[4px] h-1.5 w-1.5 shrink-0 rounded-full ${dotFor(occ.event)}`} />
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-slate-700">
          {role || 'Présent'}
        </span>
        <span className="ml-1 text-slate-400">
          — {label}{year ? ` ${year}` : ''}
          {ownerName && ` · chez ${ownerName}`}
        </span>
      </div>
    </div>
  )
}

// ── Indicateur lacunes ────────────────────────────────────────────────────────

function ResearchState({ person }: { person: FamilyGraphPerson }) {
  const birth        = getBirth(person)
  const death        = getDeath(person)
  const sourcedCount = person.events.filter(hasSource).length
  const gaps: string[] = []

  if (!birth?.date) gaps.push('Naissance non datée')
  if (!birth?.place && !birth?.placeBrut) gaps.push('Lieu de naissance inconnu')
  const birthYear = getYear(birth?.date)
  if (!death && birthYear && new Date().getFullYear() - birthYear > 110) {
    gaps.push('Décès non documenté')
  } else if (death && !death.date) {
    gaps.push('Décès non daté')
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-[11px]">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
        <span className="text-slate-700">
          {sourcedCount > 0
            ? `${sourcedCount} acte${sourcedCount > 1 ? 's' : ''} sourcé${sourcedCount > 1 ? 's' : ''}`
            : 'Aucun acte sourcé'}
        </span>
      </div>
      {gaps.map((gap) => (
        <div key={gap} className="flex items-center gap-2 text-[11px]">
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
          <span className="text-slate-600">{gap}</span>
        </div>
      ))}
    </div>
  )
}

// ── PersonPreview ─────────────────────────────────────────────────────────────

function PersonPreview({
  personId,
  onPersonNavigate,
  onPersonPreview,
}: {
  personId: string
  onPersonNavigate: (id: string) => void
  onPersonPreview: (id: string) => void
}) {
  const person = getPerson(personId)
  if (!person) return null

  const birth    = getBirth(person)
  const death    = getDeath(person)
  const photoUrl = getPersonPrimaryPhoto(personId)
  const { father, mother } = getParents(personId)
  const spouses  = getSpouses(personId)
  const children = getChildren(personId)

  const marriageEvents = getSpouseFamilies(personId)
    .flatMap(f => f.events.filter(e => e.tag === 'MARR'))

  const by       = getYear(birth?.date)
  const dy       = getYear(death?.date)
  const sexColor = person.sex === 'F' ? '#D4537E' : '#378ADD'

  // Ses propres actes + actes des couples (familles)
  const familyEvents = getSpouseFamilies(personId).flatMap(f => f.events)
  const ownEvents = [...person.events, ...familyEvents].sort((a, b) =>
    (getYear(a.date) ?? 9999) - (getYear(b.date) ?? 9999),
  )

  // Actes où il/elle est témoin / associé(e)
  const assocOccurrences = (() => {
    const seen = new Set<GedcomEvent>()
    return (getAssocIndex().get(personId) ?? [])
      .filter(occ => {
        if (seen.has(occ.event)) return false
        seen.add(occ.event)
        return true
      })
      .sort((a, b) => (getYear(a.event.date) ?? 9999) - (getYear(b.event.date) ?? 9999))
  })()

  return (
    <div className="flex flex-col">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="flex items-start gap-3">
          {photoUrl ? (
            <ImageAvatar src={photoUrl} alt={fullName(person)} sizeClass="h-[52px] w-[52px] shrink-0" />
          ) : (
            <div
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[12px] text-[17px] font-black text-white"
              style={{ backgroundColor: sexColor }}
            >
              {(person.firstName?.trim().charAt(0) ?? person.lastName?.trim().charAt(0) ?? '?').toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-black leading-snug text-slate-950">
              {fullName(person)}
            </p>
            {by && (
              <p className="mt-0.5 text-[11px] text-slate-500">
                {by}–{dy ?? '?'}
                {birth?.placeBrut && (
                  <span className="ml-1 text-slate-400">· {birth.placeBrut}</span>
                )}
              </p>
            )}
            {person.occupation && (
              <p className="mt-0.5 truncate text-[10px] text-slate-400 italic">
                {person.occupation}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onPersonNavigate(personId)}
            title="Centrer dans l'arbre"
            className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 transition hover:border-slate-400"
          >
            <ExternalLink size={13} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* ── Famille ────────────────────────────────────────── */}
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
          <Users size={10} />
          Famille
        </p>
        <div className="space-y-1.5">
          {father && (
            <div className="flex items-center gap-2">
              <span className="w-[28px] shrink-0 text-[9px] font-bold uppercase tracking-wide text-slate-400">Père</span>
              <PersonChip person={father} onPersonNavigate={onPersonNavigate} onPersonPreview={onPersonPreview} />
            </div>
          )}
          {mother && (
            <div className="flex items-center gap-2">
              <span className="w-[28px] shrink-0 text-[9px] font-bold uppercase tracking-wide text-slate-400">Mère</span>
              <PersonChip person={mother} onPersonNavigate={onPersonNavigate} onPersonPreview={onPersonPreview} />
            </div>
          )}
          {spouses.map((spouse, i) => (
            <div key={spouse.id} className="flex items-center gap-2">
              <span className="w-[28px] shrink-0 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                {spouses.length > 1 ? `U${i + 1}` : 'Union'}
              </span>
              <PersonChip person={spouse} onPersonNavigate={onPersonNavigate} onPersonPreview={onPersonPreview} />
            </div>
          ))}
          {children.length > 0 && (
            <>
              {children.length > 1 && (
                <p className="pt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-300">
                  ── {children.length} enfants
                </p>
              )}
              {children.map((child, i) => (
                <div key={child.id} className="flex items-center gap-2">
                  <span className="w-[28px] shrink-0 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    {children.length === 1 ? 'Enf.' : `E${i + 1}`}
                  </span>
                  <PersonChip person={child} onPersonNavigate={onPersonNavigate} onPersonPreview={onPersonPreview} />
                </div>
              ))}
            </>
          )}
          {!father && !mother && spouses.length === 0 && children.length === 0 && (
            <p className="text-[11px] text-slate-400">Aucun lien familial connu</p>
          )}
        </div>
      </div>

      {/* ── Actes clés ─────────────────────────────────────── */}
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="mb-2.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
          <MapPin size={10} />
          Actes clés
        </p>
        <div className="space-y-2.5">
          <EventRow label="Naissance" event={birth ?? undefined} />
          {marriageEvents.length > 0
            ? marriageEvents.map((e, i) => (
                <EventRow key={i} label={marriageEvents.length > 1 ? `Mariage ${i + 1}` : 'Mariage'} event={e} />
              ))
            : spouses.length > 0 && <EventRow label="Mariage" event={undefined} />}
          <EventRow label="Décès" event={death ?? undefined} />
        </div>
        <div className="mt-2.5 flex items-center gap-3 text-[9px] text-slate-400">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />sourcé</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />partiel</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" />manquant</span>
        </div>

        {/* Tous ses actes */}
        {ownEvents.length > 0 && (
          <details className="mt-3">
            <summary className="flex cursor-pointer select-none items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 hover:text-slate-800 [&::-webkit-details-marker]:hidden">
              <ChevronDown size={12} className="transition-transform [[open]_&]:rotate-0 [details:not([open])_&]:-rotate-90" />
              Ses actes ({ownEvents.length})
            </summary>
            <div className="mt-1 divide-y divide-slate-100">
              {ownEvents.map((event, i) => (
                <ActLine key={i} event={event} />
              ))}
            </div>
          </details>
        )}

        {/* Actes comme témoin / associé */}
        {assocOccurrences.length > 0 && (
          <details className="mt-2">
            <summary className="flex cursor-pointer select-none items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 hover:text-slate-800 [&::-webkit-details-marker]:hidden">
              <ChevronDown size={12} className="transition-transform [[open]_&]:rotate-0 [details:not([open])_&]:-rotate-90" />
              Actes tiers ({assocOccurrences.length})
            </summary>
            <div className="mt-1 divide-y divide-slate-100">
              {assocOccurrences.map((occ, i) => (
                <AssocLine key={i} occ={occ} />
              ))}
            </div>
          </details>
        )}
      </div>

      {/* ── État de la recherche ────────────────────────────── */}
      <div className="px-4 py-3">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
          État de la recherche
        </p>
        <ResearchState person={person} />
      </div>

    </div>
  )
}

// ── RightSummary ──────────────────────────────────────────────────────────────

export function RightSummary({
  previewPersonId,
  onPersonNavigate,
  onPersonPreview,
}: {
  previewPersonId?: string
  onPersonNavigate: (id: string) => void
  onPersonPreview: (id: string) => void
}) {
  const [displayId, setDisplayId] = useState(previewPersonId)

  useEffect(() => {
    if (previewPersonId) setDisplayId(previewPersonId)
  }, [previewPersonId])

  return (
    <aside className="hidden min-h-0 flex-col overflow-hidden bg-white lg:flex">
      <PanelTitle title="Aperçu" />

      <div className="flex-1 overflow-y-auto">
        {displayId ? (
          <PersonPreview
            key={displayId}
            personId={displayId}
            onPersonNavigate={onPersonNavigate}
            onPersonPreview={onPersonPreview}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <p className="text-center text-[12px] text-slate-400">
              Cliquez sur une personne<br />pour afficher son aperçu
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
