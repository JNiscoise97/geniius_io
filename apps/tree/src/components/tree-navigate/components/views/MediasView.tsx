import { useEffect, useRef, useState } from 'react'
import { usePersonClickHandlers } from '../../../../hook/usePersonClickHandlers'
import { getBirth, getDeath, getYear, formatGedcomDate, type GedcomEvent, type GedcomMedia } from '@geniius/utils/family-graph'
import { getPerson, getSpouseFamilies, formatPersonName, type FamilyGraphPerson } from '../../data'
import { getAssocIndex } from '../lib/assocIndex'
import { getEventLabel } from '../lib/eventLabels'
import { sortKey } from '@geniius/utils/family-graph-utils'

// ── Steps ─────────────────────────────────────────────────────────────────────

type MediasStep = 'overview' | 'person' | 'events' | 'family'

const STEPS: { key: MediasStep; label: string }[] = [
  { key: 'overview', label: "Vue d'ensemble" },
  { key: 'person',   label: 'Personne' },
  { key: 'events',   label: 'Actes & Événements' },
  { key: 'family',   label: 'Famille' },
]

// ── Type média enrichi ────────────────────────────────────────────────────────

type MediaItem = {
  media: GedcomMedia
  /** URL résolue */
  url: string
  /** Contexte : événement porteur si disponible */
  event?: GedcomEvent
  /** Personne porteuse de l'événement (pour les actes tiers) */
  eventOwner?: FamilyGraphPerson
  /** Est la photo principale de la personne */
  isPrimary?: boolean
}

// ── Résolution URL ────────────────────────────────────────────────────────────

const MEDIA_BASE_URL =
  '/data/Jordan Michel Nisçoise/Jordan Michel Nisçoise-Medias'

function resolveUrl(media: GedcomMedia): string {
  if (!media.file) return ''
  // Normalise les séparateurs
  const normalized = media.file.replace(/\\/g, '/')
  const segments   = normalized.split('/')
  const idx        = segments.findIndex(s => /medias/i.test(s))
  const relative   = idx !== -1 && idx < segments.length - 1
    ? segments.slice(idx + 1).join('/')
    : segments[segments.length - 1]
  return `${MEDIA_BASE_URL}/${relative}`
}

function getMedia(graph: ReturnType<typeof import('../../data').graph['people'] extends Record<string, infer P> ? () => { people: Record<string, P>; media: Record<string, GedcomMedia> } : never>, id: string): GedcomMedia | undefined {
  return (graph as any).media?.[id]
}

// Import direct du graph pour accéder aux médias
import { graph } from '../../data'

function mediaById(id: string): GedcomMedia | undefined {
  return (graph as any).media?.[id]
}

// ── Collecte des médias ───────────────────────────────────────────────────────

function collectMediaItems(person: FamilyGraphPerson): {
  personItems:  MediaItem[]
  eventItems:   MediaItem[]
  familyItems:  MediaItem[]
} {
  const seen = new Set<string>()

  const addMedia = (
    id: string,
    event?: GedcomEvent,
    eventOwner?: FamilyGraphPerson,
    isPrimary?: boolean,
  ): MediaItem | null => {
    if (seen.has(id)) return null
    seen.add(id)
    const media = mediaById(id)
    if (!media) return null
    const url = resolveUrl(media)
    if (!url) return null
    return { media, url, event, eventOwner, isPrimary }
  }

  // ── 1. Médias directs de la personne ───────────────────────────────────────
  const personItems: MediaItem[] = []
  for (const id of person.mediaIds) {
    const item = addMedia(id, undefined, undefined, id === person.primaryMediaId)
    if (item) personItems.push(item)
  }

  // ── 2. Médias des événements propres ───────────────────────────────────────
  const eventItems: MediaItem[] = []
  for (const event of person.events) {
    for (const id of event.mediaIds) {
      const item = addMedia(id, event, person)
      if (item) eventItems.push(item)
    }
  }

  // Médias des événements ASSO (actes tiers)
  const seenAssocEvents = new Set<GedcomEvent>()
  for (const occ of getAssocIndex().get(person.id) ?? []) {
    if (seenAssocEvents.has(occ.event)) continue
    seenAssocEvents.add(occ.event)
    const owner = occ.ownerKind === 'person' ? getPerson(occ.ownerId) : undefined
    for (const id of occ.event.mediaIds) {
      const item = addMedia(id, occ.event, owner)
      if (item) eventItems.push(item)
    }
  }

  // ── 3. Médias des événements familiaux ─────────────────────────────────────
  const familyItems: MediaItem[] = []
  for (const family of getSpouseFamilies(person.id)) {
    for (const event of family.events) {
      for (const id of event.mediaIds) {
        const item = addMedia(id, event)
        if (item) familyItems.push(item)
      }
    }
  }

  return { personItems, eventItems, familyItems }
}

// ── Composants d'affichage ────────────────────────────────────────────────────

/** Vignette cliquable avec titre en overlay */
function MediaThumb({ item, onClick }: { item: MediaItem; onClick: () => void }) {
  const [broken, setBroken] = useState(false)
  const title = item.media.title ?? ''

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-[12px] bg-slate-100 transition hover:shadow-md"
      style={{ aspectRatio: '1', width: '100%' }}
    >
      {broken ? (
        <div className="flex h-full w-full items-center justify-center bg-slate-100">
          <i className="ti ti-photo-off text-2xl text-slate-300" aria-hidden="true" />
        </div>
      ) : (
        <img
          src={item.url}
          alt={title}
          className="h-full w-full object-cover transition group-hover:scale-[1.03]"
          onError={() => setBroken(true)}
        />
      )}

      {item.isPrimary && (
        <span className="absolute left-1.5 top-1.5 rounded-full bg-[#378ADD] px-2 py-0.5 text-[9px] font-bold text-white">
          Photo principale
        </span>
      )}

      {title && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-4 opacity-0 transition group-hover:opacity-100">
          <p className="truncate text-[10px] text-white">{title}</p>
        </div>
      )}
    </button>
  )
}

/** Fiche acte : vignette + métadonnées de l'événement */
function ActeCard({ item, onPersonSelect, onPersonPreview, onClick }: {
  item: MediaItem
  onPersonSelect: (id: string) => void
  onPersonPreview?: (id: string) => void
  onClick: () => void
}) {
  const { onClick: onOwnerClick } = usePersonClickHandlers(item.eventOwner?.id, onPersonSelect, onPersonPreview)
  const [broken, setBroken] = useState(false)
  const { event, eventOwner, media } = item
  const title = media.title ?? ''

  const eventLabel = event ? getEventLabel(event) : ''
  const date  = event?.date ? formatGedcomDate(event.date) : ''
  const place = event?.placeBrut ?? event?.place?.town ?? ''
  const ref   = event?.caus ?? event?.sourcePage ?? ''

  return (
    <div className="flex gap-3 overflow-hidden rounded-[14px] border border-slate-200 bg-white px-3.5 py-3">
      {/* Vignette */}
      <button
        type="button"
        onClick={onClick}
        className="group relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[10px] bg-slate-100"
      >
        {broken ? (
          <div className="flex h-full w-full items-center justify-center">
            <i className="ti ti-file-text text-xl text-slate-300" aria-hidden="true" />
          </div>
        ) : (
          <img
            src={item.url}
            alt={title}
            className="h-full w-full object-cover transition group-hover:scale-105"
            onError={() => setBroken(true)}
          />
        )}
      </button>

      {/* Métadonnées */}
      <div className="min-w-0 flex-1">
        {eventLabel && (
          <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
            {eventLabel}
          </p>
        )}
        {title && (
          <p className="truncate text-[12px] font-medium text-slate-950">{title}</p>
        )}
        {date && (
          <p className="text-[11px] text-slate-500">{date}</p>
        )}
        {place && (
          <p className="flex items-center gap-1 truncate text-[11px] text-slate-400">
            <i className="ti ti-map-pin text-[11px]" aria-hidden="true" />{place}
          </p>
        )}
        {ref && (
          <p className="text-[10px] text-slate-400">Réf. {ref}</p>
        )}
        {eventOwner && (
          <button
            type="button"
            onClick={onOwnerClick}
            className="mt-1 text-[10px] text-slate-400 hover:text-slate-700"
          >
            → {formatPersonName(eventOwner)}
          </button>
        )}
      </div>
    </div>
  )
}


/** Grille de vignettes */
function MediaGrid({ items, onItemClick }: { items: MediaItem[]; onItemClick: (item: MediaItem) => void }) {
  if (items.length === 0) return (
    <p className="py-8 text-center text-sm text-slate-400">Aucun média.</p>
  )
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item, i) => (
        <MediaThumb key={i} item={item} onClick={() => onItemClick(item)} />
      ))}
    </div>
  )
}

/** Liste de fiches actes */
function ActeList({ items, onPersonSelect, onPersonPreview, onItemClick }: {
  items: MediaItem[]
  onPersonSelect: (id: string) => void
  onPersonPreview?: (id: string) => void
  onItemClick: (item: MediaItem) => void
}) {
  if (items.length === 0) return (
    <p className="py-8 text-center text-sm text-slate-400">Aucun acte.</p>
  )
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <ActeCard key={i} item={item} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} onClick={() => onItemClick(item)} />
      ))}
    </div>
  )
}

// ── Lightbox simple ───────────────────────────────────────────────────────────

function Lightbox({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-full max-w-full overflow-hidden rounded-[16px] bg-black"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={item.url}
          alt={item.media.title ?? ''}
          className="max-h-[85dvh] max-w-[90dvw] object-contain"
        />
        {item.media.title && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-8">
            <p className="text-sm text-white">{item.media.title}</p>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/80"
        >
          <i className="ti ti-x text-[14px]" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function StepNav({ active, counts, onChange }: {
  active: MediasStep
  counts: Record<MediasStep, number>
  onChange: (s: MediasStep) => void
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

function ProgressDots({ active }: { active: MediasStep }) {
  return (
    <div className="flex justify-center gap-1.5">
      {STEPS.map(({ key }) => (
        <div key={key} className={['h-1.5 rounded-full transition-all', active === key ? 'w-5 bg-slate-900' : 'w-1.5 bg-slate-200'].join(' ')} />
      ))}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export function MediasView({ selectedPersonId, onPersonSelect, onPersonPreview }: {
  selectedPersonId?: string
  onPersonSelect: (id: string) => void
  onPersonPreview?: (id: string) => void
}) {
  const scrollRef   = useRef<HTMLDivElement | null>(null)
  const [activeStep, setActiveStep]     = useState<MediasStep>('overview')
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null)

  const person = getPerson(selectedPersonId)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setActiveStep('overview')
    setLightboxItem(null)
  }, [selectedPersonId])

  if (!person) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-8">
        <p className="text-sm text-slate-400">Aucun individu sélectionné.</p>
      </div>
    )
  }

  const { personItems, eventItems, familyItems } = collectMediaItems(person)
  const allItems = [...personItems, ...eventItems, ...familyItems]

  const counts: Record<MediasStep, number> = {
    overview: allItems.length,
    person:   personItems.length,
    events:   eventItems.length,
    family:   familyItems.length,
  }

  const birthYear = getYear(getBirth(person)?.date)
  const deathYear = getYear(getDeath(person)?.date)

  return (
    <>
      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}

      <div
        ref={scrollRef}
        className="h-full w-full overflow-auto overflow-x-hidden bg-[#f1f5f9] p-4 text-slate-950"
      >
        <div className="mx-auto flex w-full max-w-[100%] flex-col gap-4">

          {/* En-tête personne */}
          <section className="rounded-[20px] border border-slate-200 bg-white px-5 py-4">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Médias
            </p>
            <p className="text-[17px] font-medium text-slate-950">
              {formatPersonName(person)}
            </p>
            {(birthYear || deathYear) && (
              <p className="mt-0.5 text-[11px] text-slate-400">
                {birthYear ?? '?'} – {deathYear ?? '?'}
                <span className="mx-1.5 text-slate-300">·</span>
                {allItems.length} média{allItems.length > 1 ? 's' : ''}
              </p>
            )}
          </section>

          {/* Navigation */}
          <StepNav active={activeStep} counts={counts} onChange={setActiveStep} />
          <ProgressDots active={activeStep} />

          {/* Contenu */}
          {activeStep === 'overview' && (
            <MediaGrid items={allItems} onItemClick={setLightboxItem} />
          )}

          {activeStep === 'person' && (
            <MediaGrid items={personItems} onItemClick={setLightboxItem} />
          )}

          {activeStep === 'events' && (
            <ActeList items={eventItems} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} onItemClick={setLightboxItem} />
          )}

          {activeStep === 'family' && (
            <ActeList items={familyItems} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} onItemClick={setLightboxItem} />
          )}

        </div>
      </div>
    </>
  )
}