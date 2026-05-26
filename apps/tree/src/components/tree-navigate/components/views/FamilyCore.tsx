import { useEffect, useRef, type ReactNode } from 'react'
import {
  CircleDashed,
  Crown,
  Heart,
  UserRound,
  Users,
} from 'lucide-react'

import {
  getChildren,
  getParents,
  getPerson,
  getSpouses,
  type FamilyGraphPerson,
} from '../../data'
import { FamilyCard } from '../ui/FamilyCard'

export function FamilyCore({
  selectedPersonId,
  onPersonSelect,
}: {
  selectedPersonId?: string
  onPersonSelect: (personId: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }, [selectedPersonId])

  const person = selectedPersonId ? getPerson(selectedPersonId) : undefined

  const parents = person ? getParents(person.id) : undefined
  const paternalGrandparents = parents?.father
    ? getParents(parents.father.id)
    : undefined
  const maternalGrandparents = parents?.mother
    ? getParents(parents.mother.id)
    : undefined

  const spouses = person ? getSpouses(person.id) : []
  const children = person ? getChildren(person.id) : []

  return (
    <div
      ref={scrollRef}
      className="h-full w-full overflow-auto overflow-x-hidden bg-[#f6f7fb] p-3 text-slate-950 sm:p-5"
    >
      <div className="mx-auto grid w-full min-w-0 max-w-full gap-4 sm:max-w-5xl">
        <CentralPerson person={person} />

        <FamilySection title="Parents" icon={Users} description="Filiation directe">
          <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <PersonFamilyCard
              person={parents?.father}
              emptyLabel="Ajouter le père"
              relationHint="Père"
              empty={!parents?.father}
              large
              tone={parents?.father ? 'source' : 'hypothesis'}
              onPersonSelect={onPersonSelect}
            />

            <PersonFamilyCard
              person={parents?.mother}
              emptyLabel="Ajouter la mère"
              relationHint="Mère"
              empty={!parents?.mother}
              large
              tone={parents?.mother ? 'source' : 'hypothesis'}
              onPersonSelect={onPersonSelect}
            />
          </div>
        </FamilySection>

        <FamilySection title="Grands-parents" icon={Crown} description="Origines familiales">
          <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PersonFamilyCard
              person={paternalGrandparents?.father}
              emptyLabel="Ajouter le grand-père"
              relationHint="Grand-père paternel"
              empty={!paternalGrandparents?.father}
              tone={paternalGrandparents?.father ? 'source' : 'neutral'}
              onPersonSelect={onPersonSelect}
            />

            <PersonFamilyCard
              person={paternalGrandparents?.mother}
              emptyLabel="Ajouter la grand-mère"
              relationHint="Grand-mère paternelle"
              empty={!paternalGrandparents?.mother}
              tone={paternalGrandparents?.mother ? 'source' : 'neutral'}
              onPersonSelect={onPersonSelect}
            />

            <PersonFamilyCard
              person={maternalGrandparents?.father}
              emptyLabel="Ajouter le grand-père"
              relationHint="Grand-père maternel"
              empty={!maternalGrandparents?.father}
              tone={maternalGrandparents?.father ? 'source' : 'neutral'}
              onPersonSelect={onPersonSelect}
            />

            <PersonFamilyCard
              person={maternalGrandparents?.mother}
              emptyLabel="Ajouter la grand-mère"
              relationHint="Grand-mère maternelle"
              empty={!maternalGrandparents?.mother}
              tone={maternalGrandparents?.mother ? 'source' : 'neutral'}
              onPersonSelect={onPersonSelect}
            />
          </div>
        </FamilySection>

        <FamilySection title="Conjoints" icon={Heart} description="Unions et relations">
          <div className="grid w-full min-w-0 max-w-full gap-3">
            <RelationHeader count={String(spouses.length)} label="conjoint(s) connu(s)" />

            {spouses.length > 0 ? (
              <div className="grid w-full min-w-0 max-w-full gap-3 sm:grid-cols-2">
                {spouses.map((spouse) => (
                  <PersonFamilyCard
                    key={spouse.id}
                    person={spouse}
                    relationHint="Conjoint"
                    tag="conjoint"
                    tone="neutral"
                    onPersonSelect={onPersonSelect}
                  />
                ))}
              </div>
            ) : (
              <FamilyCard
                empty
                relationHint="Conjoint"
                emptyLabel="Ajouter un conjoint"
                tone="neutral"
              />
            )}
          </div>
        </FamilySection>

        <FamilySection title="Enfants" icon={UserRound} description="Descendance directe">
          <div className="grid w-full min-w-0 max-w-full gap-3">
            <RelationHeader count={String(children.length)} label="enfant(s) connu(s)" />

            {children.length > 0 ? (
              <div className="grid w-full min-w-0 max-w-full gap-3 sm:grid-cols-2">
                {children.map((child) => (
                  <PersonFamilyCard
                    key={child.id}
                    person={child}
                    relationHint="Enfant"
                    tone="source"
                    onPersonSelect={onPersonSelect}
                  />
                ))}
              </div>
            ) : (
              <FamilyCard
                empty
                relationHint="Enfant"
                emptyLabel="Ajouter un enfant"
                tone="neutral"
              />
            )}
          </div>
        </FamilySection>
      </div>
    </div>
  )
}

function PersonFamilyCard({
  person,
  emptyLabel,
  relationHint,
  empty,
  large,
  tag,
  tone,
  onPersonSelect,
}: {
  person?: FamilyGraphPerson
  emptyLabel?: string
  relationHint: string
  empty?: boolean
  large?: boolean
  tag?: string
  tone: 'neutral' | 'source' | 'hypothesis'
  onPersonSelect: (personId: string) => void
}) {
  return (
    <FamilyCard
      personId={person?.id}
      firstName={person?.firstName}
      lastName={person?.lastName}
      nickname={person?.nickname}
      sex={person?.sex}
      birthDate={person?.birthDate}
      deathDate={person?.deathDate}
      birthYear={person?.birthYear}
      deathYear={person?.deathYear}
      birthPlace={person?.birthPlace}
      deathPlace={person?.deathPlace}
      empty={empty}
      emptyLabel={emptyLabel}
      relationHint={relationHint}
      large={large}
      tag={tag}
      tone={tone}
      onPersonSelect={onPersonSelect}
    />
  )
}

function CentralPerson({ person }: { person?: FamilyGraphPerson }) {
  if (!person) {
    return (
      <section className="w-full min-w-0 max-w-full overflow-hidden rounded-[24px] bg-white p-4 shadow-sm">
        <p className="truncate text-sm font-black text-slate-600">
          Aucun individu sélectionné.
        </p>
      </section>
    )
  }

  const hasLastName = Boolean(person.lastName && person.lastName.trim() !== '? SANS NOM')
  const hasFirstName = Boolean(person.firstName && person.firstName.trim())

  return (
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-[24px] bg-white p-4 shadow-sm">
      <div className="flex min-w-0 max-w-full items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <UserRound size={34} />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 max-w-full items-start justify-between gap-3">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Individu central
              </p>

              {hasLastName && (
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-slate-950">
                  {person.lastName}
                </h1>
              )}

              {hasFirstName && (
                <h2 className="truncate text-xl font-black tracking-tight text-slate-950">
                  {person.firstName}
                  {person.nickname ? ` ${person.sex === 'F' ? 'dite' : 'dit'} ${person.nickname}` : ''}
                </h2>
              )}

              {!hasLastName && !hasFirstName && (
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-slate-950">
                  Individu sans nom
                </h1>
              )}
            </div>

            <span className="shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black text-white">
              ID {person.id}
            </span>
          </div>

          <div className="mt-3 min-w-0 max-w-full space-y-1 overflow-hidden text-sm font-medium leading-5 text-slate-600">
            <p className="truncate">
              <span className="font-black text-slate-500">N :</span>{' '}
              {formatEventLine(person.birthDate ?? person.birthYear, person.birthPlace) || '—'}
            </p>

            {person.deathDate || person.deathYear || person.deathPlace ? (
              <p className="truncate">
                <span className="font-black text-slate-500">D :</span>{' '}
                {formatEventLine(person.deathDate ?? person.deathYear, person.deathPlace)}
              </p>
            ) : (
              (person.birthDate || person.birthYear) && (
                <p className="truncate">
                  <span className="font-black text-slate-500">Âge :</span>{' '}
                  {calculateAgeFromYear(person.birthDate ?? person.birthYear)} ans
                </p>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function FamilySection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: typeof Users
  children: ReactNode
}) {
  return (
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-[28px] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex min-w-0 max-w-full items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <h2 className="truncate text-sm font-black uppercase tracking-[0.16em] text-slate-900">
            {title}
          </h2>
          <p className="truncate text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="min-w-0 max-w-full overflow-hidden">
        {children}
      </div>
    </section>
  )
}

function RelationHeader({ count, label }: { count: string; label: string }) {
  return (
    <div className="inline-flex w-fit max-w-full items-center gap-2 overflow-hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
      <CircleDashed size={13} className="shrink-0 text-slate-400" />
      <span className="shrink-0 text-slate-900">{count}</span>
      <span className="truncate">{label}</span>
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