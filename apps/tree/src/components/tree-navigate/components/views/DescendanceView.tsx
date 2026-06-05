import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { getBirth, getDeath, getYear } from '@geniius/utils/family-graph'
import {
  getChildren,
  getPerson,
  formatPersonName,
  type FamilyGraphPerson,
} from '../../data'

// ── Config ────────────────────────────────────────────────────────────────────

const INDENT_PX   = 20
const BASE_PAD_PX = 10

// ── Types ─────────────────────────────────────────────────────────────────────

type FlatNode = {
  id: string
  person: FamilyGraphPerson
  depth: number
  hasChildren: boolean
  isExpanded: boolean
  childCount: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function yearRange(person: FamilyGraphPerson): string {
  const by = getYear(getBirth(person)?.date)
  const dy = getYear(getDeath(person)?.date)
  if (!by && !dy) return ''
  return `${by ?? '?'} – ${dy ?? '?'}`
}

function sexColor(sex?: 'M' | 'F' | 'U'): string {
  if (sex === 'F') return '#D4537E'
  if (sex === 'M') return '#378ADD'
  return '#94a3b8'
}

function sortedChildren(personId: string): FamilyGraphPerson[] {
  return getChildren(personId).sort((a, b) => {
    const ya = getYear(getBirth(a)?.date) ?? 9999
    const yb = getYear(getBirth(b)?.date) ?? 9999
    return ya - yb
  })
}

// ── Flat list builder ─────────────────────────────────────────────────────────

function buildFlatList(rootId: string, expanded: Set<string>): FlatNode[] {
  const result: FlatNode[] = []
  const visited = new Set<string>()

  function visit(id: string, depth: number) {
    if (visited.has(id)) return
    visited.add(id)

    const person = getPerson(id)
    if (!person) return

    const children    = sortedChildren(id)
    const hasChildren = children.length > 0
    const isExpanded  = expanded.has(id)

    result.push({ id, person, depth, hasChildren, isExpanded, childCount: children.length })

    if (isExpanded) {
      for (const child of children) {
        visit(child.id, depth + 1)
      }
    }
  }

  visit(rootId, 0)
  return result
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DescendanceView({
  selectedPersonId,
  onPersonSelect,
}: {
  selectedPersonId?: string
  onPersonSelect: (personId: string) => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => (selectedPersonId ? new Set([selectedPersonId]) : new Set()),
  )

  // Sync when external selection changes
  const prevId = useRef(selectedPersonId)
  useEffect(() => {
    if (selectedPersonId === prevId.current) return
    prevId.current = selectedPersonId
    setExpanded(selectedPersonId ? new Set([selectedPersonId]) : new Set())
  }, [selectedPersonId])

  const flatList = useMemo(
    () => (selectedPersonId ? buildFlatList(selectedPersonId, expanded) : []),
    [selectedPersonId, expanded],
  )

  function toggle(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function expandAll() {
    if (!selectedPersonId) return
    const all = new Set<string>()
    const seen = new Set<string>()
    function collect(id: string) {
      if (seen.has(id)) return
      seen.add(id)
      const children = getChildren(id)
      if (children.length > 0) {
        all.add(id)
        children.forEach((c) => collect(c.id))
      }
    }
    collect(selectedPersonId)
    setExpanded(all)
  }

  function collapseAll() {
    if (selectedPersonId) setExpanded(new Set([selectedPersonId]))
  }

  if (!selectedPersonId) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f1f5f9]">
        <p className="text-sm font-medium text-slate-400">Aucun individu sélectionné.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f1f5f9]">

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-4 pt-4 pb-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
          Descendance · {flatList.length} individu{flatList.length > 1 ? 's' : ''}
        </p>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={expandAll}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 transition hover:border-slate-400 hover:text-slate-950"
          >
            Tout déplier
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 transition hover:border-slate-400 hover:text-slate-950"
          >
            Tout replier
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white divide-y divide-slate-100">
          {flatList.map((node) => {
            const name  = formatPersonName(node.person) || 'Individu sans nom'
            const years = yearRange(node.person)
            const isRoot = node.depth === 0

            return (
              <button
                key={`${node.depth}-${node.id}`}
                type="button"
                onClick={() => onPersonSelect(node.id)}
                className="flex w-full items-center gap-2 py-2 pr-3 text-left transition hover:bg-slate-50"
                style={{ paddingLeft: BASE_PAD_PX + node.depth * INDENT_PX }}
              >
                {/* Expand/collapse toggle */}
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center"
                  onClick={(e) => {
                    if (node.hasChildren) toggle(node.id, e)
                  }}
                >
                  {node.hasChildren ? (
                    node.isExpanded ? (
                      <ChevronDown size={12} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={12} className="text-slate-400" />
                    )
                  ) : (
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                  )}
                </span>

                {/* Sex dot */}
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: sexColor(node.person.sex) }}
                />

                {/* Name */}
                <span
                  className={[
                    'min-w-0 flex-1 truncate text-[12px] leading-tight',
                    isRoot
                      ? 'font-black text-indigo-700'
                      : 'font-bold text-slate-900',
                  ].join(' ')}
                  title={name}
                >
                  {name}
                </span>

                {/* Years */}
                {years && (
                  <span className="shrink-0 text-[10px] font-medium text-slate-400">
                    {years}
                  </span>
                )}

                {/* Collapsed children count */}
                {node.hasChildren && !node.isExpanded && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-black text-slate-500">
                    +{node.childCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
