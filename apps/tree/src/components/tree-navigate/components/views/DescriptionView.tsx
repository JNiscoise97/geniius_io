import { getBirth } from '@geniius/utils/family-graph'

import { getPerson } from '../../data'
import { usePersonClickHandlers } from '../../../../hook/usePersonClickHandlers'
import { CentralPerson } from '../ui/CentralPerson'
import {
  buildBirthNarrative,
  buildPersonDescription,
  hasSource,
  type DescriptionParagraph,
  type DescriptionSegment,
} from '../lib/buildPersonDescription'

function PersonLink({
  segment,
  onPersonSelect,
  onPersonPreview,
}: {
  segment: Extract<DescriptionSegment, { kind: 'person' }>
  onPersonSelect: (personId: string) => void
  onPersonPreview?: (personId: string) => void
}) {
  const { onClick } = usePersonClickHandlers(segment.personId, onPersonSelect, onPersonPreview)

  return (
    <button
      type="button"
      onClick={onClick}
      title="Clic : aperçu · Double-clic : centrer"
      className="font-semibold text-[#378ADD] underline decoration-[#378ADD]/30 underline-offset-2 transition hover:decoration-[#378ADD]"
    >
      {segment.label}
    </button>
  )
}

function PlaceLink({
  segment,
  onPlaceSelect,
}: {
  segment: Extract<DescriptionSegment, { kind: 'place' }>
  onPlaceSelect?: (query: string) => void
}) {
  if (!onPlaceSelect) return <span className="font-semibold text-[#0F8A8A]">{segment.label}</span>

  return (
    <button
      type="button"
      onClick={() => onPlaceSelect(segment.query)}
      title="Chercher les individus liés à ce lieu"
      className="font-semibold text-[#0F8A8A] underline decoration-[#0F8A8A]/30 underline-offset-2 transition hover:decoration-[#0F8A8A]"
    >
      {segment.label}
    </button>
  )
}

function ParagraphText({
  paragraphs,
  onPersonSelect,
  onPersonPreview,
  onPlaceSelect,
}: {
  paragraphs: DescriptionParagraph[]
  onPersonSelect: (personId: string) => void
  onPersonPreview?: (personId: string) => void
  onPlaceSelect?: (query: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 text-[13px] leading-6 text-slate-700">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>
          {paragraph.map((segment, segIndex) => {
            if (segment.kind === 'person') {
              return (
                <PersonLink
                  key={segIndex}
                  segment={segment}
                  onPersonSelect={onPersonSelect}
                  onPersonPreview={onPersonPreview}
                />
              )
            }
            if (segment.kind === 'place') {
              return <PlaceLink key={segIndex} segment={segment} onPlaceSelect={onPlaceSelect} />
            }
            return <span key={segIndex}>{segment.text}</span>
          })}
        </p>
      ))}
    </div>
  )
}

function SourceBadge({ sourced }: { sourced: boolean }) {
  return (
    <span
      className={[
        'absolute right-4 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold',
        sourced ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500',
      ].join(' ')}
    >
      <span className={['h-[6px] w-[6px] rounded-full', sourced ? 'bg-emerald-500' : 'bg-slate-400'].join(' ')} />
      {sourced ? 'Source liée' : 'Aucune source liée'}
    </span>
  )
}

function BirthActSection({
  personId,
  onPersonSelect,
  onPersonPreview,
  onPlaceSelect,
}: {
  personId: string
  onPersonSelect: (personId: string) => void
  onPersonPreview?: (personId: string) => void
  onPlaceSelect?: (query: string) => void
}) {
  const person = getPerson(personId)
  const birth = person ? getBirth(person) : undefined
  const narrative = person ? buildBirthNarrative(person) : []

  return (
    <section className="relative rounded-[20px] border border-slate-200 bg-white px-6 py-5">
      <SourceBadge sourced={Boolean(birth && hasSource(birth))} />

      <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
        Naissance
      </p>

      <ParagraphText
        paragraphs={narrative}
        onPersonSelect={onPersonSelect}
        onPersonPreview={onPersonPreview}
        onPlaceSelect={onPlaceSelect}
      />
    </section>
  )
}

export function DescriptionView({
  selectedPersonId,
  onPersonSelect,
  onPersonPreview,
  onPlaceSelect,
}: {
  selectedPersonId?: string
  onPersonSelect: (personId: string) => void
  onPersonPreview?: (personId: string) => void
  onPlaceSelect?: (query: string) => void
}) {
  const person = selectedPersonId ? getPerson(selectedPersonId) : undefined
  const paragraphs = person ? buildPersonDescription(person) : []

  return (
    <div className="h-full w-full overflow-auto overflow-x-hidden bg-[#f1f5f9] p-4 text-slate-950">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
        <CentralPerson person={person} />

        <section className="rounded-[20px] border border-slate-200 bg-white px-6 py-5">
          <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Ce que l'on sait
          </p>

          {person ? (
            <ParagraphText
              paragraphs={paragraphs}
              onPersonSelect={onPersonSelect}
              onPersonPreview={onPersonPreview}
              onPlaceSelect={onPlaceSelect}
            />
          ) : (
            <p className="text-sm text-slate-400">Sélectionnez un individu pour voir sa description.</p>
          )}
        </section>

        {person && (
          <BirthActSection
            personId={person.id}
            onPersonSelect={onPersonSelect}
            onPersonPreview={onPersonPreview}
            onPlaceSelect={onPlaceSelect}
          />
        )}
      </div>
    </div>
  )
}
