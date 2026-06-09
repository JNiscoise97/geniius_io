import type { Tone } from '../../types'
import { usePersonClickHandlers } from '../../../../hook/usePersonClickHandlers'

const toneStyles: Record<Tone, { card: string; text: string; sub: string; label: string }> = {
  neutral: {
    card:  'border-slate-200 bg-white',
    text:  'text-slate-950',
    sub:   'text-slate-400',
    label: 'text-[#378ADD]',
  },
  source: {
    card:  'border-blue-200 bg-blue-50',
    text:  'text-blue-950',
    sub:   'text-blue-300',
    label: 'text-blue-400',
  },
  hypothesis: {
    card:  'border-amber-200 bg-amber-50',
    text:  'text-amber-950',
    sub:   'text-amber-400',
    label: 'text-amber-400',
  },
}

export function AncestorNode({
  personId,
  firstName,
  lastName,
  nickname,
  sex,
  birthYear,
  deathYear,
  empty,
  emptyLabel,
  className,
  tone,
  onPersonSelect,
  onPersonPreview,
}: {
  personId?: string
  firstName?: string
  lastName?: string
  nickname?: string
  sex?: 'M' | 'F' | 'U'
  birthYear?: number   // number | undefined — issu de getYear(getBirth(person)?.date)
  deathYear?: number   // number | undefined
  empty?: boolean
  emptyLabel?: string
  className: string
  tone: Tone
  onPersonSelect?: (personId: string) => void
  onPersonPreview?: (personId: string) => void
}) {
  const canNavigate = Boolean(personId && onPersonSelect)
  const styles      = toneStyles[tone]
  const { onClick } = usePersonClickHandlers(personId, onPersonSelect, onPersonPreview)

  const hasLastName  = Boolean(lastName && lastName.trim() !== '? SANS NOM')
  const formattedFirst = formatFirstName(firstName)
  const hasFirstName = Boolean(formattedFirst.trim())

  const years = formatYears(birthYear, deathYear)

  const nicknameSuffix = nickname
    ? ` ${sex === 'F' ? 'dite' : 'dit'} ${nickname}`
    : ''

  return (
    <div
      onClick={canNavigate ? onClick : undefined}
      title={canNavigate ? 'Clic : aperçu · Double-clic : centrer' : undefined}
      className={[
        'min-w-0 max-w-full overflow-hidden rounded-[14px] border transition',
        canNavigate ? 'cursor-pointer hover:border-slate-400 hover:shadow-sm' : '',
        styles.card,
        className,
      ].join(' ')}
    >
      {empty ? (
        <div className="flex h-full min-w-0 items-center justify-center overflow-hidden px-2">
          <p
            className="truncate text-center text-[9px] font-semibold text-slate-400"
            title={emptyLabel}
          >
            {emptyLabel ?? 'Ajouter une personne'}
          </p>
        </div>
      ) : (
        <div className="flex h-full min-w-0 flex-col justify-center overflow-hidden px-2.5 py-2">
          {hasLastName && (
            <p
              className={`truncate text-[10px] font-black leading-tight ${styles.text}`}
              title={lastName}
            >
              {lastName}
            </p>
          )}

          {hasFirstName && (
            <p
              className={`truncate text-[10px] font-black leading-tight ${styles.text}`}
              title={`${formattedFirst}${nicknameSuffix}`}
            >
              {formattedFirst}{nicknameSuffix}
            </p>
          )}

          {!hasLastName && !hasFirstName && (
            <p className={`truncate text-[10px] font-black leading-tight ${styles.text}`}>
              Individu sans nom
            </p>
          )}

          {years && (
            <p className={`mt-0.5 truncate text-[9px] font-medium leading-tight ${styles.sub}`}>
              {years}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formate la plage d'années pour l'affichage compact dans la carte.
 * birthYear et deathYear sont des nombres (ex: 1848), pas des strings.
 */
function formatYears(birthYear?: number, deathYear?: number): string {
  if (!birthYear && !deathYear) return ''
  return `${birthYear ?? '?'}–${deathYear ?? '?'}`
}

function formatFirstName(firstName?: string): string {
  if (!firstName) return ''
  const trimmed     = firstName.trim()
  const quotedMatch = trimmed.match(/"([^"]+)"/)
  if (quotedMatch?.[1]) return quotedMatch[1]
  return trimmed.split(/\s+/)[0] ?? trimmed
}