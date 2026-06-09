import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { usePersonClickHandlers } from '../../../../hook/usePersonClickHandlers'
import { ChevronRight, Plus } from 'lucide-react'
import { calculateAge } from '@geniius/utils/family-graph-utils'
import { getBirth, getDeath, getYear, type GedcomDate } from '@geniius/utils/family-graph'

import {
  getChildren,
  getFamily,
  getParents,
  getPerson,
  getPersonPrimaryPhoto,
  getSpouses,
  type FamilyGraphPerson,
} from '../../data'
import { ImageAvatar } from '../ui/ImageAvatar'
import { CentralPerson } from '../ui/CentralPerson'
import { formatDisplayName, formatEventLine, formatFirstName, formatFullFirstName, formatShortName, getInitials } from '../lib/formatPersonInfos'
import { MISSING_DEATH } from '../../../../../../../packages/geniius-utils/src/lib/calculate-age'

type StepKey =
  | 'overview'
  | 'parents'
  | 'grandparents'
  | 'siblings'
  | 'spouses'
  | 'children'
  | 'grandchildren'

type SiblingItem = {
  person: FamilyGraphPerson
  familyId: string
  sharedFather: boolean
  sharedMother: boolean
}

type ChildWithOtherParent = {
  child: FamilyGraphPerson
  otherParent?: FamilyGraphPerson
}

// ── Tri chronologique ─────────────────────────────────────────────────────────

function sortYear(date?: GedcomDate): number {
  return getYear(date) ?? 9999
}

// ─────────────────────────────────────────────────────────────────────────────

function childrenWithOtherParent(person: FamilyGraphPerson): ChildWithOtherParent[] {
  const items: ChildWithOtherParent[] = []

  person.famsIds.forEach((familyId) => {
    const family = getFamily(familyId)
    if (!family) return
    const otherParentId =
      family.husbandId === person.id ? family.wifeId : family.husbandId
    const otherParent = otherParentId ? getPerson(otherParentId) : undefined
    family.childIds.forEach((childId) => {
      const child = getPerson(childId)
      if (!child) return
      items.push({ child, otherParent })
    })
  })

  return items.sort((a, b) =>
    sortYear(getBirth(a.child)?.date) - sortYear(getBirth(b.child)?.date),
  )
}

function getChildRelationLabel({
  child, otherParent, index,
}: { child: FamilyGraphPerson; otherParent?: FamilyGraphPerson; index: number }) {
  const base = getChildLabel(child.sex)
  if (!otherParent) return `${index + 1} · ${base}`
  return `${index + 1} · ${base} · avec ${formatShortName(otherParent)}`
}

const steps: { key: StepKey; label: string }[] = [
  { key: 'overview', label: "Vue d'ensemble" },
  { key: 'parents', label: 'Parents' },
  { key: 'grandparents', label: 'Grands-parents' },
  { key: 'siblings', label: 'Fratrie' },
  { key: 'spouses', label: 'Conjoints' },
  { key: 'children', label: 'Enfants' },
  { key: 'grandchildren', label: 'Petits-enfants' },
]

// ── Composant principal ───────────────────────────────────────────────────────

export function FamilyCore({
  selectedPersonId,
  onPersonSelect,
  onPersonPreview,
}: {
  selectedPersonId?: string
  onPersonSelect: (personId: string) => void
  onPersonPreview?: (personId: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [activeStep, setActiveStep] = useState<StepKey>('overview')

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setActiveStep('overview')
  }, [selectedPersonId])

  const person = selectedPersonId ? getPerson(selectedPersonId) : undefined

  const parents = person ? getParents(person.id) : undefined
  const paternalGrandparents = parents?.father ? getParents(parents.father.id) : undefined
  const maternalGrandparents = parents?.mother ? getParents(parents.mother.id) : undefined

  const spouses = person ? getSpouses(person.id) : []
  const children = person ? getChildren(person.id) : []

  const siblings = useMemo(() => {
    if (!person) return []
    return getSiblingGroups(person)
  }, [person])

  const grandchildren = useMemo(() => {
    return children.flatMap((child) =>
      getChildren(child.id).map((grandchild) => ({ grandchild, via: child })),
    )
  }, [children])

  return (
    <div
      ref={scrollRef}
      className="h-full w-full overflow-auto overflow-x-hidden bg-[#f1f5f9] p-4 text-slate-950"
    >
      <div className="mx-auto flex w-full max-w-[100%] flex-col gap-4">
        <CentralPerson person={person} />
        <StepNav activeStep={activeStep} onChange={setActiveStep} />
        <ProgressDots activeStep={activeStep} />

        <div className="relative min-h-[220px] overflow-hidden">
          {activeStep === 'overview' && (
            <Panel title="Vue d'ensemble familiale">
              <OverviewSection title="Parents">
                <PersonCard person={parents?.father} relation="Père" emptyLabel="Ajouter le père" onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
                <PersonCard person={parents?.mother} relation="Mère" emptyLabel="Ajouter la mère" onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
              </OverviewSection>

              <OverviewSection title="Grands-parents">
                <PersonCard person={paternalGrandparents?.father} relation="Grand-père paternel" emptyLabel="Ajouter le grand-père paternel" onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
                <PersonCard person={paternalGrandparents?.mother} relation="Grand-mère paternelle" emptyLabel="Ajouter la grand-mère paternelle" onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
                <PersonCard person={maternalGrandparents?.father} relation="Grand-père maternel" emptyLabel="Ajouter le grand-père maternel" onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
                <PersonCard person={maternalGrandparents?.mother} relation="Grand-mère maternelle" emptyLabel="Ajouter la grand-mère maternelle" onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
              </OverviewSection>

              <OverviewSection title="Fratrie">
                {person && siblings.length > 0 ? (
                  siblings.map((item, index) => (
                    <PersonCard
                      key={`${item.familyId}-${item.person.id}`}
                      person={item.person}
                      relation={getSiblingRelationLabel({ sibling: item.person, currentPerson: person, index, sharedFather: item.sharedFather, sharedMother: item.sharedMother })}
                      isCurrent={item.person.id === person.id}
                      onPersonSelect={onPersonSelect}
                      onPersonPreview={onPersonPreview}
                    />
                  ))
                ) : (
                  <EmptyCard label="Aucune fratrie connue" />
                )}
              </OverviewSection>

              <OverviewSection title="Conjoints">
                {spouses.length > 0 ? (
                  spouses.map((spouse, index) => (
                    <PersonCard key={spouse.id} person={spouse} relation={`${index + 1} · conjoint`} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
                  ))
                ) : (
                  <EmptyCard label="Ajouter un conjoint" />
                )}
              </OverviewSection>

              <OverviewSection title="Enfants">
                {person && children.length > 0 ? (
                  childrenWithOtherParent(person).map((item, index) => (
                    <PersonCard key={item.child.id} person={item.child} relation={getChildRelationLabel({ child: item.child, otherParent: item.otherParent, index })} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
                  ))
                ) : (
                  <EmptyCard label="Ajouter un enfant" />
                )}
              </OverviewSection>

              <OverviewSection title="Petits-enfants">
                {grandchildren.length > 0 ? (
                  groupGrandchildrenByParent(grandchildren).map((group) => (
                    <UnionGroup key={group.parent.id} label={`Via ${formatShortName(group.parent)}`}>
                      {group.children.map((grandchild) => (
                        <PersonCard key={grandchild.id} person={grandchild} relation={getGrandchildLabel(grandchild.sex)} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
                      ))}
                    </UnionGroup>
                  ))
                ) : (
                  <EmptyCard label="Ajouter un petit-enfant" />
                )}
              </OverviewSection>
            </Panel>
          )}

          {activeStep === 'parents' && (
            <Panel title={getKnownCountLabel([parents?.father, parents?.mother], 'parent connu', 'parents connus')}>
              <PersonCard person={parents?.father} relation="Père" emptyLabel="Ajouter le père" variant="large" onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
              <PersonCard person={parents?.mother} relation="Mère" emptyLabel="Ajouter la mère" variant="large" onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
            </Panel>
          )}

          {activeStep === 'grandparents' && (
            <Panel title={`${countKnown([paternalGrandparents?.father, paternalGrandparents?.mother, maternalGrandparents?.father, maternalGrandparents?.mother])} grands-parents connus sur 4`}>
              <SideLabel tone="male">Côté paternel</SideLabel>
              <PersonCard person={paternalGrandparents?.father} relation="Grand-père paternel" emptyLabel="Ajouter le grand-père paternel" variant="large" onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
              <PersonCard person={paternalGrandparents?.mother} relation="Grand-mère paternelle" emptyLabel="Ajouter la grand-mère paternelle" variant="large" onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
              <SideLabel tone="female">Côté maternel</SideLabel>
              <PersonCard person={maternalGrandparents?.father} relation="Grand-père maternel" emptyLabel="Ajouter le grand-père maternel" variant="large" onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
              <PersonCard person={maternalGrandparents?.mother} relation="Grand-mère maternelle" emptyLabel="Ajouter la grand-mère maternelle" variant="large" onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
            </Panel>
          )}

          {activeStep === 'siblings' && (
            <Panel title={`${siblings.length} enfant(s) dans la fratrie élargie`}>
              {person && siblings.length > 0 ? (
                siblings.map((item, index) => (
                  <PersonCard
                    key={`${item.familyId}-${item.person.id}`}
                    person={item.person}
                    relation={getSiblingRelationLabel({ sibling: item.person, currentPerson: person, index, sharedFather: item.sharedFather, sharedMother: item.sharedMother })}
                    isCurrent={item.person.id === person.id}
                    onPersonSelect={onPersonSelect}
                    onPersonPreview={onPersonPreview}
                  />
                ))
              ) : (
                <EmptyCard label="Aucune fratrie connue" />
              )}
            </Panel>
          )}

          {activeStep === 'spouses' && (
            <Panel title={`${spouses.length} union(s)`}>
              {spouses.length > 0 ? (
                spouses.map((spouse, index) => (
                  <PersonCard key={spouse.id} person={spouse} relation={`${index + 1} · conjoint`} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
                ))
              ) : (
                <EmptyCard label="Ajouter un conjoint" />
              )}
            </Panel>
          )}

          {activeStep === 'children' && (
            <Panel title={`${children.length} enfant(s) connu(s)`}>
              {person && children.length > 0 ? (
                <UnionGroup label="Descendance directe">
                  {childrenWithOtherParent(person).map((item, index) => (
                    <PersonCard key={item.child.id} person={item.child} relation={getChildRelationLabel({ child: item.child, otherParent: item.otherParent, index })} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
                  ))}
                </UnionGroup>
              ) : (
                <EmptyCard label="Ajouter un enfant" />
              )}
            </Panel>
          )}

          {activeStep === 'grandchildren' && (
            <Panel title={`${grandchildren.length} petit(s)-enfant(s) connu(s)`}>
              {grandchildren.length > 0 ? (
                groupGrandchildrenByParent(grandchildren).map((group) => (
                  <UnionGroup key={group.parent.id} label={`Via ${formatShortName(group.parent)}`}>
                    {group.children.map((grandchild) => (
                      <PersonCard key={grandchild.id} person={grandchild} relation={getGrandchildLabel(grandchild.sex)} onPersonSelect={onPersonSelect} onPersonPreview={onPersonPreview} />
                    ))}
                  </UnionGroup>
                ))
              ) : (
                <EmptyCard label="Ajouter un petit-enfant" />
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}

// ── PersonCard ────────────────────────────────────────────────────────────────

function PersonCard({
  person,
  relation,
  emptyLabel,
  isCurrent,
  variant = 'compact',
  onPersonSelect,
  onPersonPreview,
}: {
  person?: FamilyGraphPerson
  relation?: string
  emptyLabel?: string
  isCurrent?: boolean
  variant?: 'compact' | 'large'
  onPersonSelect: (personId: string) => void
  onPersonPreview?: (personId: string) => void
}) {
  const { onClick } = usePersonClickHandlers(person?.id, onPersonSelect, onPersonPreview)

  if (!person) return <EmptyCard label={emptyLabel ?? 'Ajouter une personne'} />

  const birth = getBirth(person)
  const death = getDeath(person)
  const isLarge = variant === 'large'
  const age = calculateAge(birth?.date, death?.date)

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-3 rounded-[14px] border bg-white text-left transition hover:border-slate-400 hover:shadow-sm',
        isLarge ? 'px-4 py-4' : 'px-3.5 py-3',
        isCurrent ? 'border-[#378ADD]' : 'border-slate-200',
      ].join(' ')}
    >
      <Avatar person={person} large={isLarge} />

      <div className="min-w-0 flex-1">
        {relation && (
          <p className="mb-1 truncate text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
            {relation}
          </p>
        )}

        <PersonName person={person} large={isLarge} />

        <div className="mt-1 text-[11px] leading-4 text-slate-400">
          <p className="truncate">
            <span className="font-medium text-slate-700">N :</span>{' '}
            {formatEventLine(birth?.date, birth?.place) || '—'}
          </p>

          {death?.date || death?.place ? (
            <p className="mt-0.5 truncate">
              <span className="font-medium text-slate-700">D :</span>{' '}
              {formatEventLine(death?.date, death?.place) || '—'}
            </p>
          ) : age === MISSING_DEATH ? (
            <p className="truncate">
              <span className="font-medium text-slate-600">D :</span>{' '}
              date et lieu inconnus
            </p>
          ) : (
            birth?.date && age !== '—' && (
              <p className="mt-0.5 truncate">
                <span className="font-medium text-slate-700">Âge :</span>{' '}
                {age}
              </p>
            )
          )}
        </div>
      </div>

      {!isCurrent && <ChevronRight size={17} className="shrink-0 text-slate-300" />}
    </button>
  )
}

// ── Composants UI ─────────────────────────────────────────────────────────────

function StepNav({ activeStep, onChange }: { activeStep: StepKey; onChange: (step: StepKey) => void }) {
  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {steps.map((step) => (
        <button
          key={step.key}
          type="button"
          onClick={() => onChange(step.key)}
          className={[
            'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
            activeStep === step.key
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-950',
          ].join(' ')}
        >
          {step.label}
        </button>
      ))}
    </nav>
  )
}

function ProgressDots({ activeStep }: { activeStep: StepKey }) {
  return (
    <div className="flex justify-center gap-1.5">
      {steps.map((step) => (
        <div
          key={step.key}
          className={[
            'h-1.5 rounded-full transition-all',
            activeStep === step.key ? 'w-5 bg-slate-900' : 'w-1.5 bg-slate-200',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex animate-[slideUp_.28s_cubic-bezier(.4,0,.2,1)] flex-col gap-2">
      <p className="px-0.5 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</p>
      {children}
    </section>
  )
}

function OverviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <p className="px-0.5 pt-2 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">{title}</p>
      {children}
    </section>
  )
}

function PersonName({ person, large }: { person: FamilyGraphPerson; large?: boolean }) {
  const lastName = person.lastName && person.lastName.trim() !== '? SANS NOM' ? person.lastName : ''
  const firstName = formatFullFirstName(person.firstName)
  const nickname = person.nickname
    ? `${person.sex === 'F' ? 'dite' : 'dit'} ${person.nickname}`
    : ''

  if (!large) {
    return (
      <p className="truncate text-[13px] font-medium text-slate-950">
        {[lastName, formatFirstName(person.firstName), nickname].filter(Boolean).join(' ') || 'Individu sans nom'}
      </p>
    )
  }

  return (
    <div className="min-w-0">
      {lastName && <p className="truncate text-[14px] font-medium leading-5 text-slate-950">{lastName}</p>}
      {(firstName || nickname) && (
        <p className="truncate text-[14px] font-medium leading-5 text-slate-950">
          {[firstName, nickname].filter(Boolean).join(' ')}
        </p>
      )}
      {!lastName && !firstName && !nickname && (
        <p className="truncate text-[14px] font-medium leading-5 text-slate-950">Individu sans nom</p>
      )}
    </div>
  )
}

function Avatar({ person, large }: { person: FamilyGraphPerson; large?: boolean }) {
  const photoUrl = getPersonPrimaryPhoto(person.id)
  const initials = getInitials(person)
  const colorClass =
    person.sex === 'F' ? 'bg-pink-100 text-pink-700'
      : person.sex === 'M' ? 'bg-blue-100 text-blue-700'
        : 'bg-slate-100 text-slate-500'
  const sizeClass = large ? 'h-12 w-12 text-[14px]' : 'h-[38px] w-[38px] text-[13px]'

  if (photoUrl) return <ImageAvatar src={photoUrl} alt={initials} sizeClass={sizeClass} />

  return (
    <div className={['flex shrink-0 items-center justify-center rounded-[10px] font-semibold tracking-wide', sizeClass, colorClass].join(' ')}>
      {initials}
    </div>
  )
}

function EmptyCard({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-[14px] border border-dashed border-slate-300 bg-transparent px-3.5 py-3 text-left opacity-60 transition hover:opacity-90"
    >
      <Plus size={18} className="shrink-0 text-slate-300" />
      <span className="truncate text-xs text-slate-500">{label}</span>
    </button>
  )
}

function SideLabel({ children, tone }: { children: ReactNode; tone: 'male' | 'female' }) {
  return (
    <p className={['px-0.5 pt-1 text-[9px] font-bold uppercase tracking-[0.1em]', tone === 'male' ? 'text-[#378ADD]' : 'text-[#D4537E]'].join(' ')}>
      {children}
    </p>
  )
}

function UnionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        {label}
      </div>
      <div className="ml-2.5 flex flex-col gap-1.5 border-l-[1.5px] border-slate-200 pl-3.5">
        {children}
      </div>
    </div>
  )
}

// ── Logique fratrie ───────────────────────────────────────────────────────────

function getSiblingGroups(person: FamilyGraphPerson): SiblingItem[] {
  const directParents = getParents(person.id)
  const familiesToInspect = new Set<string>()

  person.famcIds.forEach((id) => familiesToInspect.add(id))
  directParents.father?.famsIds.forEach((id) => familiesToInspect.add(id))
  directParents.mother?.famsIds.forEach((id) => familiesToInspect.add(id))

  const siblingsById = new Map<string, SiblingItem>()

  familiesToInspect.forEach((familyId) => {
    const fp = getParentsFromFamilyId(familyId)
    const family = fp.family
    if (!family) return

    family.childIds.forEach((childId) => {
      const child = getPerson(childId)
      if (!child) return

      const sharedFather = Boolean(
        directParents.father?.id && fp.father?.id &&
        directParents.father.id === fp.father.id,
      )
      const sharedMother = Boolean(
        directParents.mother?.id && fp.mother?.id &&
        directParents.mother.id === fp.mother.id,
      )

      const existing = siblingsById.get(child.id)
      if (existing) {
        siblingsById.set(child.id, {
          person: child,
          familyId: existing.familyId,
          sharedFather: existing.sharedFather || sharedFather,
          sharedMother: existing.sharedMother || sharedMother,
        })
        return
      }
      siblingsById.set(child.id, { person: child, familyId, sharedFather, sharedMother })
    })
  })

  return Array.from(siblingsById.values()).sort(comparePeopleChronologically)
}

function getParentsFromFamilyId(familyId: string) {
  const family = getFamily(familyId)
  return { family, father: getPerson(family?.husbandId), mother: getPerson(family?.wifeId) }
}

function getSiblingRelationLabel({
  sibling, currentPerson, index, sharedFather, sharedMother,
}: {
  sibling: FamilyGraphPerson; currentPerson: FamilyGraphPerson
  index: number; sharedFather: boolean; sharedMother: boolean
}) {
  if (sibling.id === currentPerson.id) return `${index + 1} · individu central`
  const base = getSiblingLabel(sibling.sex)
  if (sharedFather && sharedMother) return `${index + 1} · ${base}`
  if (sharedFather && !sharedMother) return `${index + 1} · demi-${base.toLowerCase()} · même père`
  if (!sharedFather && sharedMother) return `${index + 1} · demi-${base.toLowerCase()} · même mère`
  return `${index + 1} · ${base} · lien à vérifier`
}

function comparePeopleChronologically(a: SiblingItem, b: SiblingItem) {
  const diff = sortYear(getBirth(a.person)?.date) - sortYear(getBirth(b.person)?.date)
  if (diff !== 0) return diff
  return formatDisplayName(a.person).localeCompare(formatDisplayName(b.person), 'fr')
}

// ── Helpers purs ──────────────────────────────────────────────────────────────

function countKnown(items: Array<unknown | undefined>) {
  return items.filter(Boolean).length
}

function getKnownCountLabel(items: Array<unknown | undefined>, singular: string, plural: string) {
  const count = countKnown(items)
  return `${count} ${count > 1 ? plural : singular}`
}

function groupGrandchildrenByParent(
  items: { grandchild: FamilyGraphPerson; via: FamilyGraphPerson }[],
) {
  const groups = new Map<string, { parent: FamilyGraphPerson; children: FamilyGraphPerson[] }>()
  items.forEach(({ grandchild, via }) => {
    const existing = groups.get(via.id)
    if (existing) { existing.children.push(grandchild); return }
    groups.set(via.id, { parent: via, children: [grandchild] })
  })
  return Array.from(groups.values())
}

function getSiblingLabel(sex: FamilyGraphPerson['sex']) {
  if (sex === 'F') return 'Sœur'
  if (sex === 'M') return 'Frère'
  return 'Fratrie'
}

function getChildLabel(sex: FamilyGraphPerson['sex']) {
  if (sex === 'F') return 'Fille'
  if (sex === 'M') return 'Fils'
  return 'Enfant'
}

function getGrandchildLabel(sex: FamilyGraphPerson['sex']) {
  if (sex === 'F') return 'Petite-fille'
  if (sex === 'M') return 'Petit-fils'
  return 'Petit-enfant'
}

