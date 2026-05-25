import type { ReactNode } from 'react'
import {
  CircleDashed,
  Crown,
  Heart,
  UserRound,
  Users,
} from 'lucide-react'

import {
  formatPersonDetails,
  formatPersonName,
  getChildren,
  getParents,
  getPerson,
  getSpouses,
  type FamilyGraphPerson,
} from '../../data'
import { FamilyCard } from '../ui/FamilyCard'

export function FamilyCore({
  selectedPersonId,
}: {
  selectedPersonId?: string
}) {
  const fallbackPersonId = Object.keys(getAllPeople())[0]
  const person = getPerson(selectedPersonId) ?? getPerson(fallbackPersonId)

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
    <div className="h-full overflow-auto bg-[#f6f7fb] p-3 text-slate-950 sm:p-5">
      <div className="mx-auto grid w-full max-w-5xl gap-4 lg:min-w-[720px]">
        <CentralPerson person={person} />

        <FamilySection title="Parents" icon={Users} description="Filiation directe">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FamilyCard
              label={parents?.father ? formatPersonName(parents.father) : 'Ajouter le père'}
              subtitle={parents?.father ? formatPersonDetails(parents.father) : undefined}
              empty={!parents?.father}
              relationHint="Père"
              large
              tone={parents?.father ? 'source' : 'hypothesis'}
            />

            <FamilyCard
              label={parents?.mother ? formatPersonName(parents.mother) : 'Ajouter la mère'}
              subtitle={parents?.mother ? formatPersonDetails(parents.mother) : undefined}
              empty={!parents?.mother}
              relationHint="Mère"
              large
              tone={parents?.mother ? 'source' : 'hypothesis'}
            />
          </div>
        </FamilySection>

        <FamilySection title="Grands-parents" icon={Crown} description="Origines familiales">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FamilyCard
              label={
                paternalGrandparents?.father
                  ? formatPersonName(paternalGrandparents.father)
                  : 'Ajouter le grand-père'
              }
              subtitle={
                paternalGrandparents?.father
                  ? formatPersonDetails(paternalGrandparents.father)
                  : undefined
              }
              empty={!paternalGrandparents?.father}
              relationHint="Grand-père paternel"
              tone={paternalGrandparents?.father ? 'source' : 'neutral'}
            />

            <FamilyCard
              label={
                paternalGrandparents?.mother
                  ? formatPersonName(paternalGrandparents.mother)
                  : 'Ajouter la grand-mère'
              }
              subtitle={
                paternalGrandparents?.mother
                  ? formatPersonDetails(paternalGrandparents.mother)
                  : undefined
              }
              empty={!paternalGrandparents?.mother}
              relationHint="Grand-mère paternelle"
              tone={paternalGrandparents?.mother ? 'source' : 'neutral'}
            />

            <FamilyCard
              label={
                maternalGrandparents?.father
                  ? formatPersonName(maternalGrandparents.father)
                  : 'Ajouter le grand-père'
              }
              subtitle={
                maternalGrandparents?.father
                  ? formatPersonDetails(maternalGrandparents.father)
                  : undefined
              }
              empty={!maternalGrandparents?.father}
              relationHint="Grand-père maternel"
              tone={maternalGrandparents?.father ? 'source' : 'neutral'}
            />

            <FamilyCard
              label={
                maternalGrandparents?.mother
                  ? formatPersonName(maternalGrandparents.mother)
                  : 'Ajouter la grand-mère'
              }
              subtitle={
                maternalGrandparents?.mother
                  ? formatPersonDetails(maternalGrandparents.mother)
                  : undefined
              }
              empty={!maternalGrandparents?.mother}
              relationHint="Grand-mère maternelle"
              tone={maternalGrandparents?.mother ? 'source' : 'neutral'}
            />
          </div>
        </FamilySection>

        <FamilySection title="Conjoints" icon={Heart} description="Unions et relations">
          <div className="grid gap-3">
            <RelationHeader count={String(spouses.length)} label="conjoint(s) connu(s)" />

            {spouses.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {spouses.map((spouse) => (
                  <FamilyCard
                    key={spouse.id}
                    label={formatPersonName(spouse)}
                    subtitle={formatPersonDetails(spouse)}
                    relationHint="Conjoint"
                    tag="conjoint"
                    selected
                    tone="selected"
                  />
                ))}
              </div>
            ) : (
              <FamilyCard
                label="Ajouter un conjoint"
                empty
                relationHint="Conjoint"
                tone="neutral"
              />
            )}
          </div>
        </FamilySection>

        <FamilySection title="Enfants" icon={UserRound} description="Descendance directe">
          <div className="grid gap-3">
            <RelationHeader count={String(children.length)} label="enfant(s) connu(s)" />

            {children.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {children.map((child) => (
                  <FamilyCard
                    key={child.id}
                    label={formatPersonName(child)}
                    subtitle={formatPersonDetails(child)}
                    relationHint="Enfant"
                    tone="source"
                  />
                ))}
              </div>
            ) : (
              <FamilyCard
                label="Ajouter un enfant"
                empty
                relationHint="Enfant"
                tone="neutral"
              />
            )}
          </div>
        </FamilySection>
      </div>
    </div>
  )
}

function CentralPerson({
  person,
}: {
  person?: FamilyGraphPerson
}) {
  if (!person) {
    return (
      <section className="rounded-[24px] bg-white p-4 shadow-sm">
        <p className="text-sm font-black text-slate-600">
          Aucun individu sélectionné.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-[24px] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <UserRound size={34} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Individu central
              </p>

              <h1 className="mt-1 truncate text-xl font-black tracking-tight text-slate-950">
                {formatPersonName(person)}
              </h1>
            </div>

            <span className="shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black text-white">
              ID {person.id}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-sm font-medium leading-5 text-slate-600">
            <p>
              <span className="font-black text-slate-500">N :</span>{' '}
              {person.birthDate ?? person.birthYear ?? '—'}
              {person.birthPlace ? ` · ${person.birthPlace}` : ''}
            </p>

            <p>
              <span className="font-black text-slate-500">D :</span>{' '}
              {person.deathDate ?? person.deathYear ?? '—'}
              {person.deathPlace ? ` · ${person.deathPlace}` : ''}
            </p>
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
    <section className="rounded-[28px] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon size={18} />
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      {children}
    </section>
  )
}

function RelationHeader({ count, label }: { count: string; label: string }) {
  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
      <CircleDashed size={13} className="text-slate-400" />
      <span className="text-slate-900">{count}</span>
      {label}
    </div>
  )
}

function getAllPeople() {
  return {}
}