import type { FamilyGraphData, FamilyGraphFamily, FamilyGraphPerson, GedcomSex } from '@geniius/utils/family-graph'

// Converts the bridge's `/trees/:id/current` response — the Dart
// `TreeSnapshot.encode()` shape ({individuals: Individual[], unions:
// FamilyUnion[]}, see packages/geniius_core/lib/src/individual.dart and
// family_union.dart) — into the FamilyGraphData shape TreeStatsPage/
// TreeNavigatePage already expect (packages/geniius-utils/src/
// family-graph/gedcom-parser.ts).
//
// GedcomEvent/GedcomPlace/GedcomDate are structurally identical between
// the two ecosystems (deliberately built as twins) and pass through
// unchanged — only Individual/FamilyUnion's field names and a couple of
// value encodings (sex, single child-family vs an array, sex-neutral
// spouse slots vs husband/wife) differ enough to need real conversion.

type DartIndividual = {
  id: string
  firstNames: string
  lastName: string
  nickname?: string | null
  sex: 'male' | 'female' | 'unknown'
  occupation?: string | null
  title?: string | null
  events: unknown[]
  familyAsChildId?: string | null
  familyAsSpouseIds: string[]
  mediaIds: string[]
  primaryMediaId?: string | null
}

type DartFamilyUnion = {
  id: string
  spouse1Id?: string | null
  spouse2Id?: string | null
  childrenIds: string[]
  events: unknown[]
  mediaIds: string[]
  primaryMediaId?: string | null
}

export type TreeSnapshotJson = {
  individuals: DartIndividual[]
  unions: DartFamilyUnion[]
}

const SEX_MAP: Record<DartIndividual['sex'], GedcomSex> = { male: 'M', female: 'F', unknown: 'U' }

export function convertTreeSnapshotToFamilyGraph(snapshot: TreeSnapshotJson): FamilyGraphData {
  const sexById = new Map(snapshot.individuals.map((i) => [i.id, i.sex]))

  const people: Record<string, FamilyGraphPerson> = {}
  for (const person of snapshot.individuals) {
    people[person.id] = {
      id: person.id,
      firstName: person.firstNames,
      lastName: person.lastName,
      nickname: person.nickname ?? undefined,
      sex: SEX_MAP[person.sex],
      occupation: person.occupation ?? undefined,
      title: person.title ?? undefined,
      events: person.events as FamilyGraphPerson['events'],
      famcIds: person.familyAsChildId ? [person.familyAsChildId] : [],
      famsIds: person.familyAsSpouseIds,
      mediaIds: person.mediaIds,
      primaryMediaId: person.primaryMediaId ?? undefined,
    }
  }

  const families: Record<string, FamilyGraphFamily> = {}
  for (const union of snapshot.unions) {
    const [husbandId, wifeId] = assignHusbandWife(union.spouse1Id, union.spouse2Id, sexById)
    families[union.id] = {
      id: union.id,
      husbandId,
      wifeId,
      childIds: union.childrenIds,
      events: union.events as FamilyGraphFamily['events'],
      mediaIds: union.mediaIds,
      primaryMediaId: union.primaryMediaId ?? undefined,
    }
  }

  return { people, families, media: {} }
}

// Dart's spouse1Id/spouse2Id are sex-neutral slots; TS's husbandId/wifeId
// are sex-typed. Assign by each spouse's actual recorded sex when known
// (covers same-sex unions and unknown-sex individuals sanely — an
// unknown-sex spouse just falls back to whichever slot the other one
// didn't take), defaulting to spouse1→husband/spouse2→wife only when
// neither sex is known at all.
function assignHusbandWife(
  spouse1Id: string | null | undefined,
  spouse2Id: string | null | undefined,
  sexById: Map<string, DartIndividual['sex']>,
): [string | undefined, string | undefined] {
  const sex1 = spouse1Id ? sexById.get(spouse1Id) : undefined
  const sex2 = spouse2Id ? sexById.get(spouse2Id) : undefined

  if (sex1 === 'male' || sex2 === 'female') return [spouse1Id ?? undefined, spouse2Id ?? undefined]
  if (sex1 === 'female' || sex2 === 'male') return [spouse2Id ?? undefined, spouse1Id ?? undefined]
  return [spouse1Id ?? undefined, spouse2Id ?? undefined]
}
