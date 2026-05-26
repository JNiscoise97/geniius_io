import type { Tone } from '../../types'

const toneClasses: Record<Tone, string> = {
  neutral: 'border-slate-200 bg-white text-slate-950',
  source: 'border-cyan-200 bg-cyan-50 text-cyan-950',
  hypothesis: 'border-amber-200 bg-amber-50 text-amber-950',
}

export function FamilyCard({
  personId,
  firstName,
  lastName,
  nickname,
  sex,
  birthDate,
  deathDate,
  birthYear,
  deathYear,
  birthPlace,
  deathPlace,
  tag,
  relationHint,
  emptyLabel,
  empty,
  large,
  tone,
  onPersonSelect,
}: {
  personId?: string
  firstName?: string
  lastName?: string
  nickname?: string
  sex?: 'M' | 'F' | 'U'
  birthDate?: string
  deathDate?: string
  birthYear?: string
  deathYear?: string
  birthPlace?: string
  deathPlace?: string
  tag?: string
  relationHint?: string
  emptyLabel?: string
  empty?: boolean
  large?: boolean
  tone: Tone
  onPersonSelect?: (personId: string) => void
}) {
  const canNavigate = Boolean(personId && onPersonSelect)
  const hasLastName = Boolean(lastName && lastName.trim() !== '? SANS NOM')
  const hasFirstName = Boolean(firstName && firstName.trim())

  return (
    <div
      onClick={() => {
        if (personId) onPersonSelect?.(personId)
      }}
      title={canNavigate ? 'Cliquer pour centrer cette personne' : undefined}
      className={[
        'min-w-0 max-w-full overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md',
        canNavigate ? 'cursor-pointer' : '',
        toneClasses[tone],
        large ? 'min-h-[104px]' : 'min-h-[88px]',
      ].join(' ')}
    >
      {relationHint && (
        <p className="mb-2 block max-w-full truncate text-[9px] font-black uppercase tracking-wide opacity-50">
          {relationHint}
        </p>
      )}

      {empty ? (
        <p className="block max-w-full truncate text-sm font-semibold opacity-70">
          {emptyLabel ?? getEmptyLabel(relationHint)}
        </p>
      ) : (
        <div className="min-w-0 max-w-full space-y-0.5 overflow-hidden">
          {hasLastName && (
            <p className="block max-w-full truncate text-sm font-black leading-5">
              {lastName}
            </p>
          )}

          {hasFirstName && (
            <p className="block max-w-full truncate text-sm font-black leading-5">
              {firstName}
              {nickname ? ` ${sex === 'F' ? 'dite' : 'dit'} ${nickname}` : ''}
            </p>
          )}

          {!hasLastName && !hasFirstName && (
            <p className="block max-w-full truncate text-sm font-black leading-5">
              Individu sans nom
            </p>
          )}

          {(birthDate || birthYear || birthPlace) && (
            <p className="block max-w-full truncate text-[12px] font-medium leading-5 opacity-75">
              N : {formatEventLine(birthDate ?? birthYear, birthPlace)}
            </p>
          )}

          {(deathDate || deathYear || deathPlace) ? (
            <p className="block max-w-full truncate text-[12px] font-medium leading-5 opacity-75">
              D : {formatEventLine(deathDate ?? deathYear, deathPlace)}
            </p>
          ) : (
            (birthDate || birthYear) && (
              <p className="block max-w-full truncate text-[12px] font-medium leading-5 opacity-75">
                Âge : {calculateAgeFromYear(birthDate ?? birthYear)} ans
              </p>
            )
          )}
        </div>
      )}

      {tag && (
        <p className="mt-2 block max-w-full truncate text-right text-[11px] font-black opacity-80">
          {tag}
        </p>
      )}
    </div>
  )
}

function formatEventLine(date?: string, place?: string) {
  if (date && place) return `${date} - ${place}`
  return date ?? place ?? ''
}

function calculateAgeFromYear(dateValue?: string) {
  const year = extractYear(dateValue)
  if (!year) return '—'
  return new Date().getFullYear() - year
}

function extractYear(value?: string) {
  if (!value) return undefined

  const match = value.match(/\d{4}/)
  if (!match) return undefined

  return Number(match[0])
}

function getEmptyLabel(relationHint?: string) {
  if (!relationHint) return 'Ajouter une personne'
  return `Ajouter ${relationHint.toLowerCase()}`
}