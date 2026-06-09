import { useEffect, useMemo, useRef, useState } from 'react'
import { AncestorNode } from '../ui/AncestorNode'
import { buildAscendanceGenerations } from '../../data'

interface LineSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

const GEN_WIDTHS   = [180, 170, 165, 158, 155, 152]
const COL_GAP      = 10
const CARD_HEIGHT  = 58
const CARD_GAP     = 6
const LABEL_HEIGHT = 28

function getCardsZoneHeight(generationCount: number) {
  const n = 2 ** (generationCount - 1)
  return n * CARD_HEIGHT + (n - 1) * CARD_GAP
}

function getLeafTop(index: number, count: number, cardsZoneHeight: number) {
  const totalCardsHeight = count * CARD_HEIGHT + (count - 1) * CARD_GAP
  const startOffset = (cardsZoneHeight - totalCardsHeight) / 2
  return startOffset + index * (CARD_HEIGHT + CARD_GAP)
}

function getCardTopAligned(
  generationIndex: number,
  personIndex: number,
  visibleCount: number,
  cardsZoneHeight: number,
): number {
  const lastGenerationIndex = visibleCount - 1

  if (generationIndex === lastGenerationIndex) {
    return getLeafTop(personIndex, 2 ** lastGenerationIndex, cardsZoneHeight)
  }

  const topFather = getCardTopAligned(
    generationIndex + 1,
    personIndex * 2,
    visibleCount,
    cardsZoneHeight,
  )
  const topMother = getCardTopAligned(
    generationIndex + 1,
    personIndex * 2 + 1,
    visibleCount,
    cardsZoneHeight,
  )

  return (topFather + topMother) / 2
}

function drawConnectors(
  container: HTMLDivElement,
  cardRefs: React.RefObject<HTMLDivElement | null>[][],
  visibleCount: number,
): LineSegment[] {
  const containerRect = container.getBoundingClientRect()
  const lines: LineSegment[] = []

  for (let generationIndex = 0; generationIndex < visibleCount - 1; generationIndex++) {
    const childCount  = 2 ** generationIndex
    const parentCards = cardRefs[generationIndex + 1]

    for (let childIndex = 0; childIndex < childCount; childIndex++) {
      const childCard  = cardRefs[generationIndex][childIndex]?.current
      const fatherCard = parentCards[childIndex * 2]?.current
      const motherCard = parentCards[childIndex * 2 + 1]?.current

      if (!childCard || !fatherCard || !motherCard) continue

      const childRect  = childCard.getBoundingClientRect()
      const fatherRect = fatherCard.getBoundingClientRect()
      const motherRect = motherCard.getBoundingClientRect()

      const childX  = childRect.right  - containerRect.left
      const childY  = childRect.top    + childRect.height  / 2 - containerRect.top
      const parentX = fatherRect.left  - containerRect.left
      const fatherY = fatherRect.top   + fatherRect.height / 2 - containerRect.top
      const motherY = motherRect.top   + motherRect.height / 2 - containerRect.top
      const midX    = childX + (parentX - childX) * 0.5

      lines.push({ x1: childX,  y1: childY,  x2: midX,    y2: childY  })
      lines.push({ x1: midX,    y1: fatherY, x2: midX,    y2: motherY })
      lines.push({ x1: midX,    y1: fatherY, x2: parentX, y2: fatherY })
      lines.push({ x1: midX,    y1: motherY, x2: parentX, y2: motherY })
    }
  }

  return lines
}

export function AscendanceView({
  selectedPersonId,
  onPersonSelect,
  onPersonPreview,
}: {
  selectedPersonId?: string
  onPersonSelect: (personId: string) => void
  onPersonPreview?: (personId: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [lines, setLines]                     = useState<LineSegment[]>([])
  const [visibleGenerations, setVisibleGenerations] = useState(5)
  const [showSettings, setShowSettings]       = useState(false)

  const allGenerations = useMemo(
    () => buildAscendanceGenerations(selectedPersonId, 6),
    [selectedPersonId],
  )

  const generations    = allGenerations.slice(0, visibleGenerations)
  const cardsZoneHeight = getCardsZoneHeight(visibleGenerations)
  const containerHeight = LABEL_HEIGHT + cardsZoneHeight

  const cardRefs = useMemo(
    () =>
      allGenerations.map((generation) =>
        generation.people.map(
          () => ({ current: null }) as React.RefObject<HTMLDivElement | null>,
        ),
      ),
    [allGenerations],
  )

  useEffect(() => {
    const compute = () => {
      if (!containerRef.current) return
      setLines(drawConnectors(containerRef.current, cardRefs, visibleGenerations))
    }

    const id = requestAnimationFrame(() => requestAnimationFrame(compute))

    let rafId: number | null = null
    const onResize = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => { compute(); rafId = null })
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(id)
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
    }
  }, [cardRefs, visibleGenerations, selectedPersonId])

  return (
    <div className="h-full overflow-auto bg-[#f1f5f9] p-4 text-slate-950">

      {/* En-tête */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
          Ascendance
        </p>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-950"
          >
            {visibleGenerations} générations
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Générations affichées
              </p>

              <div className="flex gap-2">
                {[4, 5, 6].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setVisibleGenerations(count)
                      setShowSettings(false)
                    }}
                    className={[
                      'flex-1 rounded-full border py-1.5 text-xs font-medium transition',
                      visibleGenerations === count
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-950',
                    ].join(' ')}
                  >
                    {count}
                  </button>
                ))}
              </div>

              <p className="mt-3 text-[9px] text-slate-400">
                De G1 jusqu'à G{visibleGenerations}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Arbre */}
      <div
        ref={containerRef}
        className="relative inline-flex items-stretch"
        style={{ gap: `${COL_GAP}px`, height: containerHeight }}
      >
        {/* Connecteurs SVG */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          style={{ zIndex: 0 }}
        >
          {lines.map((line, index) => (
            <line
              key={index}
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              stroke="#E2E8F0"
              strokeWidth={1}
            />
          ))}
        </svg>

        {/* Colonnes */}
        {generations.map((generation, generationIndex) => (
          <div
            key={generation.label}
            className="relative z-10"
            style={{ width: GEN_WIDTHS[generationIndex], flexShrink: 0, height: '100%' }}
          >
            {/* Label de génération */}
            <p
              className="absolute left-0.5 top-0 overflow-hidden text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-slate-400"
              style={{
                width: GEN_WIDTHS[generationIndex] - 4,
                height: LABEL_HEIGHT - 4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
              title={generation.label}
            >
              {generation.label}
            </p>

            {/* Cartes */}
            <div className="absolute inset-x-0 bottom-0" style={{ top: LABEL_HEIGHT }}>
              {generation.people.map((person, personIndex) => (
                <div
                  key={`${generationIndex}-${personIndex}-${person.id ?? person.emptyLabel ?? 'empty'}`}
                  ref={cardRefs[generationIndex][personIndex]}
                  className="absolute w-full px-[2px]"
                  style={{
                    top: getCardTopAligned(
                      generationIndex,
                      personIndex,
                      visibleGenerations,
                      cardsZoneHeight,
                    ),
                    height: CARD_HEIGHT,
                  }}
                >
                  <AncestorNode
                    personId={person.id}
                    firstName={person.firstName}
                    lastName={person.lastName}
                    nickname={person.nickname}
                    sex={person.sex}
                    birthYear={person.birthYear}   // number | undefined
                    deathYear={person.deathYear}   // number | undefined
                    empty={person.empty}
                    emptyLabel={person.emptyLabel}
                    tone={person.tone}
                    className="static h-full w-full"
                    onPersonSelect={onPersonSelect}
                    onPersonPreview={onPersonPreview}
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