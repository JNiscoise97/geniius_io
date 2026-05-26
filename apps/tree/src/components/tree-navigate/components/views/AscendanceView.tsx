import { useRef, useEffect, useState } from 'react'
import { AncestorNode } from '../ui/AncestorNode'

const ALL_GENERATIONS = [
  {
    label: 'Génération 1',
    people: [
      { title: '(MAMMOSA) Pierre Gédéon', subtitle: '1833–1862', tone: 'selected' as const },
    ],
  },
  {
    label: 'Parents',
    people: [
      { title: 'Ajouter le père', subtitle: 'Filiation inconnue', tone: 'hypothesis' as const, empty: true },
      { title: '(MAMMOSA) Julie', subtitle: '1807–1855', tone: 'source' as const },
    ],
  },
  {
    label: 'Grands-parents',
    people: [
      { title: 'Ajouter le grand-père paternel', tone: 'neutral' as const, empty: true },
      { title: 'Ajouter la grand-mère paternelle', tone: 'neutral' as const, empty: true },
      { title: 'Ajouter le grand-père maternel', tone: 'neutral' as const, empty: true },
      { title: '? SANS NOM Esther', subtitle: '1775–1827', tone: 'hypothesis' as const },
    ],
  },
  {
    label: 'Arrière-grands-parents',
    people: Array.from({ length: 8 }, (_, index) => ({
      title: `Ajouter ancêtre ${index + 1}`,
      tone: 'neutral' as const,
      empty: true,
    })),
  },
  {
    label: 'Génération 5',
    people: Array.from({ length: 16 }, (_, index) => ({
      title: `Ancêtre ${index + 1}`,
      tone: 'neutral' as const,
      empty: true,
    })),
  },
  {
    label: 'Génération 6',
    people: Array.from({ length: 32 }, (_, index) => ({
      title: `Ancêtre ${index + 1}`,
      tone: 'neutral' as const,
      empty: true,
    })),
  },
]

interface LineSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

const GEN_WIDTHS = [180, 170, 165, 155, 145, 138]
const COL_GAP = 12
const CARD_HEIGHT = 44
const CARD_GAP = 6
const LABEL_HEIGHT = 24

function getCardsZoneHeight(visibleGenerations: number): number {
  const n = ALL_GENERATIONS[visibleGenerations - 1].people.length
  return n * CARD_HEIGHT + (n - 1) * CARD_GAP
}

// Position d'une feuille (dernière génération)
function getLeafTop(pi: number, n: number, cardsZoneHeight: number): number {
  const totalCardsHeight = n * CARD_HEIGHT + (n - 1) * CARD_GAP
  const startOffset = (cardsZoneHeight - totalCardsHeight) / 2
  return startOffset + pi * (CARD_HEIGHT + CARD_GAP)
}

// Position récursive : centré entre ses deux enfants dans la génération suivante
function getCardTopAligned(
  gi: number,
  pi: number,
  visibleCount: number,
  cardsZoneHeight: number,
): number {
  const lastGi = visibleCount - 1
  if (gi === lastGi) {
    return getLeafTop(pi, ALL_GENERATIONS[lastGi].people.length, cardsZoneHeight)
  }
  const topLeft = getCardTopAligned(gi + 1, pi * 2, visibleCount, cardsZoneHeight)
  const topRight = getCardTopAligned(gi + 1, pi * 2 + 1, visibleCount, cardsZoneHeight)
  return (topLeft + topRight) / 2
}

function drawConnectors(
  container: HTMLDivElement,
  cardRefs: React.RefObject<HTMLDivElement | null>[][],
  visibleCount: number,
): LineSegment[] {
  const containerRect = container.getBoundingClientRect()
  const lines: LineSegment[] = []

  for (let gi = 0; gi < visibleCount - 1; gi++) {
    const childCount = ALL_GENERATIONS[gi].people.length
    const parentCards = cardRefs[gi + 1]

    for (let ci = 0; ci < childCount; ci++) {
      const childCard = cardRefs[gi][ci]?.current
      const parentCard0 = parentCards[ci * 2]?.current
      const parentCard1 = parentCards[ci * 2 + 1]?.current

      if (!childCard || !parentCard0 || !parentCard1) continue

      const cr = childCard.getBoundingClientRect()
      const p0r = parentCard0.getBoundingClientRect()
      const p1r = parentCard1.getBoundingClientRect()

      const cx = cr.right - containerRect.left
      const cy = cr.top + cr.height / 2 - containerRect.top
      const px = p0r.left - containerRect.left
      const p0y = p0r.top + p0r.height / 2 - containerRect.top
      const p1y = p1r.top + p1r.height / 2 - containerRect.top
      const midX = cx + (px - cx) * 0.5

      lines.push({ x1: cx, y1: cy, x2: midX, y2: cy })
      lines.push({ x1: midX, y1: p0y, x2: midX, y2: p1y })
      lines.push({ x1: midX, y1: p0y, x2: px, y2: p0y })
      lines.push({ x1: midX, y1: p1y, x2: px, y2: p1y })
    }
  }

  return lines
}

export function AscendanceView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<LineSegment[]>([])
  const [visibleGenerations, setVisibleGenerations] = useState(6)
  const [showSettings, setShowSettings] = useState(false)

  const generations = ALL_GENERATIONS.slice(0, visibleGenerations)
  const cardsZoneHeight = getCardsZoneHeight(visibleGenerations)
  const containerHeight = LABEL_HEIGHT + cardsZoneHeight

  const cardRefs = useRef<React.RefObject<HTMLDivElement | null>[][]>(
    ALL_GENERATIONS.map((gen) => gen.people.map(() => ({ current: null }))),
  )

  useEffect(() => {
    const compute = () => {
      if (!containerRef.current) return
      setLines(drawConnectors(containerRef.current, cardRefs.current, visibleGenerations))
    }
    const id = requestAnimationFrame(() => requestAnimationFrame(compute))
    window.addEventListener('resize', compute)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', compute)
    }
  }, [visibleGenerations])

  return (
    <div className="h-full overflow-auto bg-[#f6f7fb] p-4 text-slate-950">
      {/* Toolbar */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">Ascendance</p>
        <div className="relative">
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="8" cy="8" r="2.5"/>
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42"/>
            </svg>
            {visibleGenerations} générations
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
              <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                Générations affichées
              </p>
              <div className="flex gap-2">
                {[4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setVisibleGenerations(n); setShowSettings(false) }}
                    className={[
                      'flex-1 rounded-xl py-2 text-sm font-semibold transition',
                      visibleGenerations === n
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    ].join(' ')}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-slate-400">
                De la génération 1 jusqu'à G{visibleGenerations}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tree */}
      <div
        ref={containerRef}
        className="relative inline-flex items-stretch"
        style={{ gap: `${COL_GAP}px`, height: containerHeight }}
      >
        {/* SVG connector layer */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          style={{ zIndex: 0 }}
        >
          {lines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#CBD5E1" strokeWidth={1} />
          ))}
        </svg>

        {/* Generation columns */}
        {generations.map((generation, gi) => (
          <div
            key={generation.label}
            className="relative z-10"
            style={{ width: GEN_WIDTHS[gi], flexShrink: 0, height: '100%' }}
          >
            <p className="absolute left-1 top-0 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {generation.label}
            </p>

            <div className="absolute inset-x-0 bottom-0" style={{ top: LABEL_HEIGHT }}>
              {generation.people.map((person, pi) => (
                <div
                  key={`${gi}-${pi}`}
                  ref={cardRefs.current[gi][pi] as React.RefObject<HTMLDivElement>}
                  className="absolute w-full px-[2px]"
                  style={{
                    top: getCardTopAligned(gi, pi, visibleGenerations, cardsZoneHeight),
                    height: CARD_HEIGHT,
                  }}
                >
                  <AncestorNode
                    title={person.title}
                    subtitle={'subtitle' in person ? person.subtitle : undefined}
                    empty={'empty' in person ? person.empty : undefined}
                    tone={person.tone}
                    className="static h-full w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}