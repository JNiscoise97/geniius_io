import { getBirth, getDeath, getYear, type GedcomEventAssoc } from '@geniius/utils/family-graph'
import { getPerson, getPersonPrimaryPhoto, type FamilyGraphPerson } from '../../data'
import { calculateAge } from '@geniius/utils/family-graph-utils'
import { formatGedcomDate } from '@geniius/utils/family-graph'
import { AlertTriangleIcon, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import { resolveRoleLabel } from '../lib/resolveRoleLabel'

// ── Avatar image avec fallback ────────────────────────────────────────────────

function ActorAvatar({
  person,
  avBg,
  avColor,
  fallbackName,
}: {
  person?: FamilyGraphPerson
  avBg: string
  avColor: string
  fallbackName: string
}) {
  const photoUrl = person ? getPersonPrimaryPhoto(person.id) : undefined
  const [broken, setBroken] = useState(false)
  useEffect(() => { setBroken(false) }, [photoUrl])

  // Initiales : prénom + nom depuis la personne liée, sinon fallbackName
  const ini = (() => {
    const src = person
      ? [person.firstName, person.lastName].filter(Boolean).join(' ')
      : fallbackName
    return src
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '·'
  })()

  if (photoUrl && !broken) {
    return (
      <div className="h-[38px] w-[38px] shrink-0 overflow-hidden rounded-[10px]">
        <img
          src={photoUrl}
          alt={ini}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      </div>
    )
  }

  if (photoUrl && broken) {
    return (
      <div
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px]"
        style={{ background: avBg, color: avColor }}
      >
        <AlertTriangleIcon size={16} />
      </div>
    )
  }

  return (
    <div
      className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-wide"
      style={{ background: avBg, color: avColor }}
    >
      {ini}
    </div>
  )
}

// ── Une ligne acteur ──────────────────────────────────────────────────────────

function ActorRow({
  assoc,
  avStyle,
  isLast,
  onPersonSelect,
}: {
  assoc: GedcomEventAssoc
  avStyle: { bg: string; color: string }
  isLast: boolean
  onPersonSelect?: (id: string) => void
}) {
  const person    = assoc.id ? getPerson(assoc.id) : undefined
  const roleLabel = resolveRoleLabel(assoc)

  // Nom affiché
  const displayName = (() => {
    if (!person) return assoc.title ?? assoc.id ?? '?'
    const last  = person.lastName && person.lastName.trim() !== '? SANS NOM' ? person.lastName : ''
    const first = (() => {
      if (!person.firstName) return ''
      const t = person.firstName.trim()
      const q = t.match(/"([^"]+)"/)
      return q?.[1] ?? t.split(/\s+/)[0] ?? t
    })()
    const nick = person.nickname
      ? `${person.sex === 'F' ? 'dite' : 'dit'} ${person.nickname}`
      : ''
    return [last, first, nick].filter(Boolean).join(' ') || 'Individu sans nom'
  })()

  // Années naissance / décès
  const birth     = person ? getBirth(person) : undefined
  const death     = person ? getDeath(person) : undefined
  const birthYear = getYear(birth?.date)
  const deathYear = getYear(death?.date)
  const age       = person ? calculateAge(birth?.date, death?.date) : undefined

  // Détail GEDCOM (âge à l'acte + note)
  const detailParts: string[] = []
  if (assoc.age)  detailParts.push(`${assoc.age} ans à l'acte`)
  if (assoc.note) detailParts.push(assoc.note)
  const detail = detailParts.join(' · ')

  const clickable = Boolean(person && onPersonSelect)

  const inner = (
    <>
      <ActorAvatar
        person={person}
        avBg={avStyle.bg}
        avColor={avStyle.color}
        fallbackName={displayName}
      />

      <div className="min-w-0 flex-1">
        {roleLabel && (
          <p className="mb-0.5 truncate text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
            {roleLabel}
          </p>
        )}

        <p className="truncate text-[13px] font-medium text-slate-950">
          {displayName}
        </p>

        {person && (
          <div className="mt-0.5 text-[11px] leading-4 text-slate-400">
            {birth?.date || birth?.place ? (
              <p className="truncate">
                <span className="font-medium text-slate-600">N :</span>{' '}
                {birth.date ? formatGedcomDate(birth.date) : ''}
                {birth.place?.town ? ` · ${birth.place.town}` : ''}
              </p>
            ) : null}
            {death?.date || death?.place ? (
              <p className="truncate">
                <span className="font-medium text-slate-600">D :</span>{' '}
                {death.date ? formatGedcomDate(death.date) : ''}
                {death.place?.town ? ` · ${death.place.town}` : ''}
              </p>
            ) : (birthYear && age && age !== '—') ? (
              <p className="truncate">
                <span className="font-medium text-slate-600">Âge :</span>{' '}
                {age}
              </p>
            ) : null}
          </div>
        )}

        {detail && (
          <p className="mt-0.5 truncate text-[10px] text-slate-400 italic">
            {detail}
          </p>
        )}
      </div>

      {clickable && <ChevronRight size={15} className="shrink-0 text-slate-300" />}
    </>
  )

  const sharedClass = [
    'flex w-full items-center gap-3 px-3 py-2.5 text-left',
    isLast ? '' : 'border-b border-slate-100',
    clickable ? 'cursor-pointer transition hover:bg-slate-50' : '',
  ].join(' ')

  if (clickable) {
    return (
      <button
        type="button"
        className={sharedClass}
        onClick={() => onPersonSelect!(person!.id)}
      >
        {inner}
      </button>
    )
  }

  return <div className={sharedClass}>{inner}</div>
}

// ── Bloc acteurs complet ──────────────────────────────────────────────────────

export function ActorBlock({
  assocs,
  avStyle,
  onPersonSelect,
}: {
  assocs: GedcomEventAssoc[]
  avStyle: { bg: string; color: string }
  onPersonSelect?: (id: string) => void
}) {
  if (assocs.length === 0) return null

  return (
    <div
      className="mt-2.5 overflow-hidden rounded-[12px] border border-slate-200 bg-white"
    >
      {assocs.map((assoc, i) => (
        <ActorRow
          key={i}
          assoc={assoc}
          avStyle={avStyle}
          isLast={i === assocs.length - 1}
          onPersonSelect={onPersonSelect}
        />
      ))}
    </div>
  )
}