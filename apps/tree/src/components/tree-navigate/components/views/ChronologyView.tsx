import { useEffect, useRef, useState } from 'react'
import { formatGedcomDate, getBirth, getDeath, getYear, type GedcomEvent } from '@geniius/utils/family-graph'
import { getPerson, getSpouseFamilies, type GedcomPlace } from '../../data'
import { formatGedcomPlace, sortKey, calculateAge } from '@geniius/utils/family-graph-utils'
import { ActorBlock } from '../ui/ActorBlock'
import { resolveRoleLabel } from '../lib/resolveRoleLabel'
import { getAssocIndex, type AssocOccurrence } from '../lib/assocIndex'
import { EVENT_LABELS } from '../lib/eventLabels'
import { CentralPerson } from '../ui/CentralPerson'

// ── Catégories visuelles ──────────────────────────────────────────────────────

type EventCategory = {
  label: string; dot: string; line: string; av: { bg: string; color: string }
}

const EVENT_CATEGORIES: Record<string, EventCategory> = {
  BIRT: { label: 'Naissance',          dot: '#3B6D11', line: '#C0DD97', av: { bg: '#EAF3DE', color: '#27500A' } },
  DEAT: { label: 'Décès',              dot: '#2C2C2A', line: '#D3D1C7', av: { bg: '#F1EFE8', color: '#444441' } },
  BURI: { label: 'Inhumation',         dot: '#444441', line: '#D3D1C7', av: { bg: '#F1EFE8', color: '#444441' } },
  CHR:  { label: 'Baptême',            dot: '#185FA5', line: '#B5D4F4', av: { bg: '#E6F1FB', color: '#0C447C' } },
  CONF: { label: 'Confirmation',       dot: '#185FA5', line: '#B5D4F4', av: { bg: '#E6F1FB', color: '#0C447C' } },
  FCOM: { label: 'Première communion', dot: '#185FA5', line: '#B5D4F4', av: { bg: '#E6F1FB', color: '#0C447C' } },
  ADOP: { label: 'Adoption',           dot: '#534AB7', line: '#CECBF6', av: { bg: '#EEEDFE', color: '#3C3489' } },
  NATU: { label: 'Naturalisation',     dot: '#534AB7', line: '#CECBF6', av: { bg: '#EEEDFE', color: '#3C3489' } },
  MARR: { label: 'Mariage',            dot: '#993556', line: '#F4C0D1', av: { bg: '#FBEAF0', color: '#72243E' } },
  ENGA: { label: 'Fiançailles',        dot: '#B0507A', line: '#F4C0D1', av: { bg: '#FBEAF0', color: '#72243E' } },
  DIV:  { label: 'Divorce',            dot: '#5F5E5A', line: '#D3D1C7', av: { bg: '#F1EFE8', color: '#444441' } },
  MARB: { label: 'Publication de bans',dot: '#993556', line: '#F4C0D1', av: { bg: '#FBEAF0', color: '#72243E' } },
  MARC: { label: 'Contrat de mariage', dot: '#854F0B', line: '#FAC775', av: { bg: '#FAEEDA', color: '#633806' } },
  CENS: { label: 'Recensement',        dot: '#854F0B', line: '#FAC775', av: { bg: '#FAEEDA', color: '#633806' } },
  PROP: { label: 'Propriété',          dot: '#854F0B', line: '#FAC775', av: { bg: '#FAEEDA', color: '#633806' } },
  WILL: { label: 'Testament',          dot: '#854F0B', line: '#FAC775', av: { bg: '#FAEEDA', color: '#633806' } },
  RESI: { label: 'Résidence',          dot: '#5F5E5A', line: '#D3D1C7', av: { bg: '#F1EFE8', color: '#444441' } },
  GRAD: { label: 'Diplôme',            dot: '#0F6E56', line: '#9FE1CB', av: { bg: '#E1F5EE', color: '#085041' } },
  HEAL: { label: 'Santé',              dot: '#993C1D', line: '#F5C4B3', av: { bg: '#FAECE7', color: '#712B13' } },
  DSCR: { label: 'Description',        dot: '#5F5E5A', line: '#D3D1C7', av: { bg: '#F1EFE8', color: '#444441' } },
  EVEN: { label: 'Événement',          dot: '#0F6E56', line: '#9FE1CB', av: { bg: '#E1F5EE', color: '#085041' } },
  FACT: { label: 'Fait',               dot: '#0F6E56', line: '#9FE1CB', av: { bg: '#E1F5EE', color: '#085041' } },
}
const DEFAULT_CAT: EventCategory = { label: 'Événement', dot: '#888780', line: '#D3D1C7', av: { bg: '#F1EFE8', color: '#5F5E5A' } }

function getCat(tag: string, type?: string): EventCategory {
  if (type && /notari|hypothéc|vente|achat|acte/i.test(type))
    return { label: type, dot: '#854F0B', line: '#FAC775', av: { bg: '#FAEEDA', color: '#633806' } }
  const cat = EVENT_CATEGORIES[tag] ?? { ...DEFAULT_CAT, label: EVENT_LABELS[tag] ?? DEFAULT_CAT.label }
  return type ? { ...cat, label: type } : cat
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPlace(place?: GedcomPlace, placeBrut?: string): string {
  if (place) return formatGedcomPlace(place)
  return placeBrut ?? ''
}

function invertedRoleLabel(roleLabel: string, sex: 'M' | 'F' | 'U'): string {
  const map: Record<string, [string, string]> = {
    'Parrain':   ['Filleul',   'Filleule'],
    'Marraine':  ['Filleul',   'Filleule'],
    'Témoin':    ['Acte de',   'Acte de'],
    'Déclarant': ['Sujet',     'Sujet'],
    'Père':      ['Enfant',    'Enfant'],
    'Mère':      ['Enfant',    'Enfant'],
    'Époux':     ['Épouse',    'Époux'],
    'Épouse':    ['Époux',     'Épouse'],
  }
  const pair = map[roleLabel]
  if (!pair) return 'Acte de'
  return sex === 'F' ? pair[1] : pair[0]
}

// ── Sous-composants partagés ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 500, color: 'var(--color-text-tertiary)',
      textTransform: 'uppercase' as const, letterSpacing: '.08em',
      marginBottom: 4, marginTop: 10,
    }}>
      {children}
    </div>
  )
}

function TimelineDot({ year, dot, line, isLast, hollow }: {
  year?: number; dot: string; line: string; isLast: boolean; hollow?: boolean
}) {
  return (
    <div style={{ width: 52, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-tertiary)', height: 36, display: 'flex', alignItems: 'center', paddingTop: 2 }}>
        {year ?? '—'}
      </div>
      <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: hollow ? 'var(--color-background-primary)' : dot, border: `2px solid ${dot}` }} />
      {!isLast && <div style={{ width: 1.5, flex: 1, minHeight: 8, background: line }} />}
    </div>
  )
}

function EventMeta({ date, year, ageStr, place, caus, sourcePage }: {
  date: string; year?: number; ageStr?: string; place: string; caus?: string; sourcePage?: string
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' as const, marginBottom: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
          {date || (year ? String(year) : '—')}
        </span>
        {ageStr && (
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', background: 'var(--color-background-secondary)', borderRadius: 6, padding: '1px 7px' }}>
            {ageStr}
          </span>
        )}
      </div>
      {place && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
          <i className="ti ti-map-pin" style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }} aria-hidden="true" />
          {place}
        </div>
      )}
      {(caus || sourcePage) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 8 }}>
          {caus && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, padding: '2px 7px', fontSize: 10, color: 'var(--color-text-tertiary)' }}>
              <i className="ti ti-file-text" style={{ fontSize: 11 }} aria-hidden="true" />Réf. {caus}
            </span>
          )}
          {sourcePage && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, padding: '2px 7px', fontSize: 10, color: 'var(--color-text-tertiary)' }}>
              <i className="ti ti-book" style={{ fontSize: 11 }} aria-hidden="true" />{sourcePage}
            </span>
          )}
        </div>
      )}
    </>
  )
}

function NoteBlock({ note }: { note: string }) {
  return (
    <div style={{ marginTop: 10, padding: '9px 12px', background: 'var(--color-background-secondary)', borderLeft: '2.5px solid var(--color-border-secondary)', fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
      {note}
    </div>
  )
}

/**
 * Affiche une personne en tant qu'acteur principal d'un acte.
 * Réutilise ActorBlock pour avoir photo, N:, D:, âge — cohérent avec les autres acteurs.
 */
function OwnerCard({ personId, sectionLabel, avStyle, onPersonSelect, onPersonPreview }: {
  personId: string; sectionLabel: string; avStyle: { bg: string; color: string }; onPersonSelect: (id: string) => void; onPersonPreview?: (id: string) => void
}) {
  const owner = getPerson(personId)
  if (!owner) return null

  // Construit un assoc minimal pour déléguer à ActorBlock
  const assoc = { id: personId }

  return (
    <>
      <SectionLabel>{sectionLabel}</SectionLabel>
      <ActorBlock assocs={[assoc]} avStyle={avStyle} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
    </>
  )
}


// ── Dot losange (actes familiaux) ─────────────────────────────────────────────

function DiamondDot({ year, dot, line, isLast }: {
  year?: number; dot: string; line: string; isLast: boolean
}) {
  return (
    <div style={{ width: 52, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-tertiary)', height: 36, display: 'flex', alignItems: 'center', paddingTop: 2 }}>
        {year ?? '—'}
      </div>
      {/* Losange = carré tourné 45° */}
      <div style={{
        width: 9, height: 9, flexShrink: 0,
        background: dot,
        transform: 'rotate(45deg)',
        border: `1.5px solid ${dot}`,
      }} />
      {!isLast && <div style={{ width: 1.5, flex: 1, minHeight: 8, background: line }} />}
    </div>
  )
}

// ── FamilyEventRow ────────────────────────────────────────────────────────────

type FamilyEventItem = {
  event: GedcomEvent
  familyId: string
  spouseId?: string
  sortVal: number
}

function FamilyEventRow({ item, isLast, birthEvent, onPersonSelect, onPersonPreview }: {
  item: FamilyEventItem; isLast: boolean; birthEvent?: GedcomEvent; onPersonSelect: (id: string) => void; onPersonPreview?: (id: string) => void
}) {
  const { event, spouseId } = item
  const cat   = getCat(event.tag, event.type)
  const date  = formatGedcomDate(event.date)
  const year  = getYear(event.date)
  const place = fmtPlace(event.place, event.placeBrut)

  const ageStr: string | undefined = (() => {
    if (!event.date) return undefined
    if (!birthEvent?.date) return undefined
    const c = calculateAge(birthEvent.date, event.date)
    return c !== '—' ? c : undefined
  })()

  const spouse = spouseId ? getPerson(spouseId) : undefined

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      <DiamondDot year={year} dot={cat.dot} line={cat.line} isLast={isLast} />
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 16, paddingTop: 12, paddingBottom: isLast ? 0 : 20 }}>
        <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '.1em', color: cat.dot, marginBottom: 3 }}>
          {cat.label}
        </div>
        <EventMeta date={date} year={year} ageStr={ageStr} place={place} caus={event.caus} sourcePage={event.sourcePage} />
        {spouse && (
          <OwnerCard
            personId={spouse.id}
            sectionLabel={spouse.sex === 'F' ? 'Épouse' : spouse.sex === 'M' ? 'Époux' : 'Conjoint(e)'}
            avStyle={cat.av}
            onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview}
          />
        )}
        {event.assocs.length > 0 && (
          <>
            <SectionLabel>Présents à l'acte</SectionLabel>
            <ActorBlock assocs={event.assocs} avStyle={cat.av} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
          </>
        )}
        {event.note && <NoteBlock note={event.note} />}
      </div>
    </div>
  )
}

// ── Rows ──────────────────────────────────────────────────────────────────────

function OwnEventRow({ event, isLast, birthEvent, onPersonSelect, onPersonPreview }: {
  event: GedcomEvent; isLast: boolean; birthEvent?: GedcomEvent; onPersonSelect: (id: string) => void; onPersonPreview?: (id: string) => void
}) {
  const cat   = getCat(event.tag, event.type)
  const date  = formatGedcomDate(event.date)
  const year  = getYear(event.date)
  const place = fmtPlace(event.place, event.placeBrut)

  const ageStr: string | undefined = (() => {
    if (event.tag === 'BIRT' || !event.date) return undefined
    if (event.age) return event.age
    if (!birthEvent?.date) return undefined
    const c = calculateAge(birthEvent.date, event.date)
    return c !== '—' ? c : undefined
  })()

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      <TimelineDot year={year} dot={cat.dot} line={cat.line} isLast={isLast} />
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 16, paddingTop: 12, paddingBottom: isLast ? 0 : 20 }}>
        <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '.1em', color: cat.dot, marginBottom: 3 }}>
          {cat.label}
        </div>
        <EventMeta date={date} year={year} ageStr={ageStr} place={place} caus={event.caus} sourcePage={event.sourcePage} />
        {event.assocs.length > 0 && (
          <>
            <SectionLabel>Présents à l'acte</SectionLabel>
            <ActorBlock assocs={event.assocs} avStyle={cat.av} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
          </>
        )}
        {event.note && <NoteBlock note={event.note} />}
      </div>
    </div>
  )
}

function AssocEventRow({ occurrence, isLast, birthEvent, onPersonSelect, onPersonPreview }: {
  occurrence: AssocOccurrence; isLast: boolean; birthEvent?: GedcomEvent; onPersonSelect: (id: string) => void; onPersonPreview?: (id: string) => void
}) {
  const { event, ownerId, ownerKind, assocIndex: ai } = occurrence
  const assoc      = event.assocs[ai]
  const cat        = getCat(event.tag, event.type)
  const date       = formatGedcomDate(event.date)
  const year       = getYear(event.date)
  const place      = fmtPlace(event.place, event.placeBrut)
  const roleLabel  = assoc ? resolveRoleLabel(assoc) : ''
  const owner      = ownerKind === 'person' ? getPerson(ownerId) : undefined
  const mainLabel  = roleLabel ? invertedRoleLabel(roleLabel, owner?.sex ?? 'U') : 'Acte de'
  const otherAssocs = event.assocs.filter((_, i) => i !== ai)

  const ageStr: string | undefined = (() => {
    if (!event.date) return undefined
    if (assoc?.age) return assoc.age
    if (!birthEvent?.date) return undefined
    const c = calculateAge(birthEvent.date, event.date)
    return c !== '—' ? c : undefined
  })()

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      <TimelineDot year={year} dot={cat.dot} line={cat.line} isLast={isLast} hollow />
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 16, paddingTop: 12, paddingBottom: isLast ? 0 : 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' as const }}>
          <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '.1em', color: cat.dot }}>
            {cat.label}
          </div>
          {roleLabel && (
            <span style={{ fontSize: 10, fontWeight: 500, border: `0.5px solid ${cat.dot}`, borderRadius: 20, padding: '1px 7px', color: cat.dot, letterSpacing: '.04em' }}>
              {roleLabel}
            </span>
          )}
        </div>
        <EventMeta date={date} year={year} ageStr={ageStr} place={place} caus={event.caus} sourcePage={event.sourcePage} />
        {ownerKind === 'person' && (
          <OwnerCard personId={ownerId} sectionLabel={mainLabel} avStyle={cat.av} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
        )}
        {otherAssocs.length > 0 && (
          <>
            <SectionLabel>Autres présents</SectionLabel>
            <ActorBlock assocs={otherAssocs} avStyle={cat.av} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
          </>
        )}
        {event.note && <NoteBlock note={event.note} />}
      </div>
    </div>
  )
}

// ── Steps ─────────────────────────────────────────────────────────────────────

type ChronologyStep = 'overview' | 'own' | 'assoc' | 'family'

const STEPS: { key: ChronologyStep; label: string }[] = [
  { key: 'overview', label: "Vue d'ensemble" },
  { key: 'own',      label: 'Actes personnels' },
  { key: 'family',   label: 'Actes familiaux' },
  { key: 'assoc',    label: 'Actes tiers' },
]

function StepNav({ active, counts, onChange }: {
  active: ChronologyStep
  counts: Record<ChronologyStep, number>
  onChange: (s: ChronologyStep) => void
}) {
  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {STEPS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={[
            'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
            active === key
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-950',
          ].join(' ')}
        >
          {label}
          {key !== 'overview' && counts[key] > 0 && (
            <span className={['ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium', active === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'].join(' ')}>
              {counts[key]}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}

function ProgressDots({ active }: { active: ChronologyStep }) {
  return (
    <div className="flex justify-center gap-1.5">
      {STEPS.map(({ key }) => (
        <div key={key} className={['h-1.5 rounded-full transition-all', active === key ? 'w-5 bg-slate-900' : 'w-1.5 bg-slate-200'].join(' ')} />
      ))}
    </div>
  )
}

// ── Séparateur post mortem ────────────────────────────────────────────────────

function PostMortemSeparator({ count }: { count: number }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-medium text-slate-400">
        Actes post mortem · {count}
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  )
}

// ── Vue d'ensemble ────────────────────────────────────────────────────────────

type OverviewItem =
  | { kind: 'own';    event: GedcomEvent;          sortVal: number }
  | { kind: 'assoc';  occurrence: AssocOccurrence; sortVal: number }
  | { kind: 'family'; item: FamilyEventItem;        sortVal: number }

function OverviewStep({ ownEvents, assocOccurrences, familyItems, birth, death, onPersonSelect, onPersonPreview, onStepChange }: {
  ownEvents: GedcomEvent[]
  assocOccurrences: AssocOccurrence[]
  familyItems: FamilyEventItem[]
  birth?: GedcomEvent
  death?: GedcomEvent
  onPersonSelect: (id: string) => void
  onPersonPreview?: (id: string) => void
  onStepChange: (s: ChronologyStep) => void
}) {
  const deathSortVal = death ? sortKey(death.date) : Infinity

  // Fusion + tri chronologique
  const all: OverviewItem[] = [
    ...ownEvents.map((event): OverviewItem => ({
      kind: 'own', event, sortVal: sortKey(event.date),
    })),
    ...assocOccurrences.map((occurrence): OverviewItem => ({
      kind: 'assoc', occurrence, sortVal: sortKey(occurrence.event.date),
    })),
    ...familyItems.map((item): OverviewItem => ({
      kind: 'family', item, sortVal: item.sortVal,
    })),
  ].sort((a, b) => a.sortVal - b.sortVal)

  const anteMortem  = all.filter(item => item.sortVal <= deathSortVal)
  const postMortem  = all.filter(item => item.sortVal >  deathSortVal)
  const hasPostMortem = postMortem.length > 0

  const renderItem = (item: OverviewItem, isLast: boolean, i: number) => {
    if (item.kind === 'own') {
      return (
        <OwnEventRow
          key={`own-${i}`}
          event={item.event}
          isLast={isLast}
          birthEvent={birth}
          onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview}
        />
      )
    }
    if (item.kind === 'family') {
      return (
        <FamilyEventRow
          key={`fam-${i}`}
          item={item.item}
          isLast={isLast}
          birthEvent={birth}
          onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview}
        />
      )
    }
    return (
      <AssocEventRow
        key={`assoc-${i}`}
        occurrence={item.occurrence}
        isLast={isLast}
        birthEvent={birth}
        onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview}
      />
    )
  }

  return (
    <div className="flex flex-col">

      {anteMortem.length === 0 && !hasPostMortem && (
        <p className="py-4 text-center text-sm text-slate-400">Aucun acte enregistré.</p>
      )}

      {anteMortem.map((item, i) =>
        renderItem(item, !hasPostMortem && i === anteMortem.length - 1, i),
      )}

      {hasPostMortem && <PostMortemSeparator count={postMortem.length} />}

      {postMortem.map((item, i) =>
        renderItem(item, i === postMortem.length - 1, anteMortem.length + i),
      )}

      {(ownEvents.length + assocOccurrences.length) > 6 && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onStepChange('own')}
            className="flex-1 rounded-[10px] border border-slate-200 bg-white py-2 text-[11px] font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-950"
          >
            {ownEvents.length} actes personnels →
          </button>
          {assocOccurrences.length > 0 && (
            <button
              type="button"
              onClick={() => onStepChange('assoc')}
              className="flex-1 rounded-[10px] border border-slate-200 bg-white py-2 text-[11px] font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-950"
            >
              {assocOccurrences.length} actes tiers →
            </button>
          )}
          {familyItems.length > 0 && (
            <button
              type="button"
              onClick={() => onStepChange('family')}
              className="flex-1 rounded-[10px] border border-slate-200 bg-white py-2 text-[11px] font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-950"
            >
              {familyItems.length} actes familiaux →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export function ChronologyView({ selectedPersonId, onPersonSelect, onPersonPreview }: {
  selectedPersonId?: string
  onPersonSelect: (id: string) => void
  onPersonPreview?: (id: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [activeStep, setActiveStep] = useState<ChronologyStep>('overview')
  const person = getPerson(selectedPersonId)

  useEffect(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      setActiveStep('overview')
    }, [selectedPersonId])

  if (!person) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-8">
        <p className="text-sm text-slate-400">Aucun individu sélectionné.</p>
      </div>
    )
  }

  // Dédoublonnage assoc
  const seenAssocEvents = new Set<GedcomEvent>()
  const assocOccurrences = (getAssocIndex().get(person.id) ?? []).filter((occ) => {
    if (seenAssocEvents.has(occ.event)) return false
    seenAssocEvents.add(occ.event)
    return true
  })

  const ownEvents = [...person.events].sort((a, b) => sortKey(a.date) - sortKey(b.date))
  const assocSorted = [...assocOccurrences].sort((a, b) => sortKey(a.event.date) - sortKey(b.event.date))

  // Actes familiaux : événements portés par les familles dont la personne est conjoint
  const familyItems: FamilyEventItem[] = getSpouseFamilies(person.id)
    .flatMap((family) =>
      family.events.map((event): FamilyEventItem => {
        const spouseId = family.husbandId === person.id ? family.wifeId : family.husbandId
        return { event, familyId: family.id, spouseId, sortVal: sortKey(event.date) }
      })
    )
    .sort((a, b) => a.sortVal - b.sortVal)

  const birth      = getBirth(person)
  const death      = getDeath(person)

  const counts: Record<ChronologyStep, number> = {
    overview: ownEvents.length + assocOccurrences.length + familyItems.length,
    own:      ownEvents.length,
    assoc:    assocOccurrences.length,
    family:   familyItems.length,
  }

  return (
    <div
      ref={scrollRef}
      className="h-full w-full overflow-auto overflow-x-hidden bg-[#f1f5f9] p-4 text-slate-950"
    >
      <div className="mx-auto flex w-full max-w-[100%] flex-col gap-4">

      {/* En-tête */}
      
      <CentralPerson person={person} />
      

      {/* Navigation */}
      
        <StepNav active={activeStep} counts={counts} onChange={setActiveStep} />
        <ProgressDots active={activeStep} />
      

      {/* Contenu */}
      
        {activeStep === 'overview' && (
          <OverviewStep
            ownEvents={ownEvents}
            assocOccurrences={assocSorted}
            familyItems={familyItems}
            birth={birth ?? undefined}
            death={death ?? undefined}
            onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview}
            onStepChange={setActiveStep}
          />
        )}

        {activeStep === 'own' && (() => {
          if (ownEvents.length === 0) return (
            <p className="py-16 text-center text-sm text-slate-400">Aucun acte personnel.</p>
          )
          const deathVal = death ? sortKey(death.date) : Infinity
          const ante = ownEvents.filter(e => sortKey(e.date) <= deathVal)
          const post  = ownEvents.filter(e => sortKey(e.date) >  deathVal)
          return (
            <>
              {ante.map((event, i) => (
                <OwnEventRow key={i} event={event} isLast={post.length === 0 && i === ante.length - 1} birthEvent={birth ?? undefined} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
              ))}
              {post.length > 0 && <PostMortemSeparator count={post.length} />}
              {post.map((event, i) => (
                <OwnEventRow key={`post-${i}`} event={event} isLast={i === post.length - 1} birthEvent={birth ?? undefined} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
              ))}
            </>
          )
        })()}

        {activeStep === 'family' && (() => {
          if (familyItems.length === 0) return (
            <p className="py-16 text-center text-sm text-slate-400">Aucun acte familial.</p>
          )
          const deathVal = death ? sortKey(death.date) : Infinity
          const ante = familyItems.filter(it => it.sortVal <= deathVal)
          const post  = familyItems.filter(it => it.sortVal >  deathVal)
          return (
            <>
              {ante.map((item, i) => (
                <FamilyEventRow key={i} item={item} isLast={post.length === 0 && i === ante.length - 1} birthEvent={birth ?? undefined} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
              ))}
              {post.length > 0 && <PostMortemSeparator count={post.length} />}
              {post.map((item, i) => (
                <FamilyEventRow key={`post-${i}`} item={item} isLast={i === post.length - 1} birthEvent={birth ?? undefined} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
              ))}
            </>
          )
        })()}

        {activeStep === 'assoc' && (() => {
          if (assocSorted.length === 0) return (
            <p className="py-16 text-center text-sm text-slate-400">Aucun acte tiers.</p>
          )
          const deathVal = death ? sortKey(death.date) : Infinity
          const ante = assocSorted.filter(o => sortKey(o.event.date) <= deathVal)
          const post  = assocSorted.filter(o => sortKey(o.event.date) >  deathVal)
          return (
            <>
              {ante.map((occ, i) => (
                <AssocEventRow key={i} occurrence={occ} isLast={post.length === 0 && i === ante.length - 1} birthEvent={birth ?? undefined} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
              ))}
              {post.length > 0 && <PostMortemSeparator count={post.length} />}
              {post.map((occ, i) => (
                <AssocEventRow key={`post-${i}`} occurrence={occ} isLast={i === post.length - 1} birthEvent={birth ?? undefined} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
              ))}
            </>
          )
        })()}
      
    </div>
    </div>
  )
}