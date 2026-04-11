import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Compass,
  Heart,
  Loader2,
  MapPin,
  Monitor,
  Search,
  UserCircle2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { ROOT_HONORED_PERSON_ID } from "../../../config/eventInfos";
import {
  createFamilyTreeViewTracker,
  type FamilyTreeViaAction,
} from "../../../lib/analytics/familyTreeViewTracker";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { SmartImage } from "../../../lib/media/useSmartImage";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";

import { FAMILY_GRAPH } from "../api/loadGraph";
import {
  getPersonContext,
  getPersonHeroConfig,
} from "../config/configGenealogy";
import { getMergedPersonOverridesMap } from "../data/profiles/getMergedPersonOverridesMap";
import { getParticipantDefaultGedcomPersonId } from "../data/profiles/getParticipantDefaultGedcomPersonId";
import type { PersonUiOverride } from "../data/profiles/uiOverrides";
import { getFamilyTreeEffectiveVisibilityMap } from "../data/visibility/getFamilyTreeEffectiveVisibilityMap";
import {
  findRelationshipPath,
  type RelationshipEdgeType,
  type RelationshipPathNode,
} from "../domain/graph/findRelationshipPath";
import { formatPlaceTransition } from "../domain/graph/genealogyUi";
import type { PersonSummary } from "../types/person";
import type { PersonVisibilityPreferenceMap } from "../types/visibility";

type TvRelationSectionKey =
  | "parents_section"
  | "spouses_section"
  | "children_section"
  | "siblings_section"
  | "grandparents_section";

type TvRelationGroupProps = {
  title: string;
  icon: LucideIcon;
  persons: PersonSummary[];
  emptyLabel: string;
  onSelect: (personId: string) => void;
};

function normalizePersonId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function anonymizePerson(person: PersonSummary): PersonSummary {
  if (
    person.canDisplay &&
    person.canDisplayName &&
    person.canDisplayPhoto &&
    person.canDisplayInfo
  ) {
    return person;
  }

  return {
    ...person,
    firstName:
      person.canDisplay && person.canDisplayName
        ? person.firstName
        : "Personne",
    lastName:
      person.canDisplay && person.canDisplayName ? person.lastName : "privée",
    nickname:
      person.canDisplay && person.canDisplayName ? person.nickname : undefined,
    photoSrc:
      person.canDisplay && person.canDisplayPhoto ? person.photoSrc : undefined,
    birthYear:
      person.canDisplay && person.canDisplayInfo ? person.birthYear : undefined,
    deathYear:
      person.canDisplay && person.canDisplayInfo ? person.deathYear : undefined,
    birthPlace:
      person.canDisplay && person.canDisplayInfo
        ? person.birthPlace
        : undefined,
    deathPlace:
      person.canDisplay && person.canDisplayInfo
        ? person.deathPlace
        : undefined,
    currentPlace:
      person.canDisplay && person.canDisplayInfo
        ? person.currentPlace
        : undefined,
    linkedSpouseLabel:
      person.canDisplay && person.canDisplayInfo
        ? person.linkedSpouseLabel
        : undefined,
    spouseRoleLabel:
      person.canDisplay && person.canDisplayInfo
        ? person.spouseRoleLabel
        : undefined,
    branch: person.canDisplay ? person.branch : undefined,
  };
}

function getDisplayPerson(
  person: PersonSummary,
  forceDisplayedPersonIds: Set<string>,
): PersonSummary {
  if (forceDisplayedPersonIds.has(person.id)) {
    return person;
  }

  return anonymizePerson(person);
}

function formatYears(person: PersonSummary): string | null {
  const { birthYear, deathYear, isPossiblyAlive } = person;

  if (!birthYear && !deathYear) return null;
  if (birthYear && deathYear) return `${birthYear} - ${deathYear}`;
  if (!isPossiblyAlive) return `${birthYear ?? "?"} - ?`;

  return birthYear ?? "?";
}

function formatLifePath(person: PersonSummary): string | null {
  return formatPlaceTransition(
    person.birthPlace,
    person.currentPlace,
    person.deathPlace,
  );
}

function getPluralLabel(count: number, singular: string, plural: string) {
  return count > 1 ? plural : singular;
}

function getAncestorLabel(level: number, sex?: string) {
  const isFemale = sex === "F";
  const isMale = sex === "M";

  if (level <= 0) return "de la famille";

  if (level === 1) {
    if (isFemale) return "la mère";
    if (isMale) return "le père";
    return "un parent";
  }

  if (level === 2) {
    if (isFemale) return "la grand-mère";
    if (isMale) return "le grand-père";
    return "un grand-parent";
  }

  if (level === 3) {
    if (isFemale) return "l’arrière-grand-mère";
    if (isMale) return "l’arrière-grand-père";
    return "un arrière-grand-parent";
  }

  if (isFemale) return `l’${"arrière-".repeat(level - 2)}grand-mère`;
  if (isMale) return `l’${"arrière-".repeat(level - 2)}grand-père`;

  return `un ${"arrière-".repeat(level - 2)}grand-parent`;
}

function getDescendantLabel(level: number, sex?: string) {
  const isFemale = sex === "F";
  const isMale = sex === "M";

  if (level <= 0) return "de la famille";

  if (level === 1) {
    if (isFemale) return "la fille";
    if (isMale) return "le fils";
    return "un enfant";
  }

  if (level === 2) {
    if (isFemale) return "la petite-fille";
    if (isMale) return "le petit-fils";
    return "un petit-enfant";
  }

  if (level === 3) {
    if (isFemale) return "l’arrière-petite-fille";
    if (isMale) return "l’arrière-petit-fils";
    return "un arrière-petit-enfant";
  }

  if (isFemale) return `l’${"arrière-".repeat(level - 2)}petite-fille`;
  if (isMale) return `l’${"arrière-".repeat(level - 2)}petit-fils`;

  return `un ${"arrière-".repeat(level - 2)}petit-enfant`;
}

function getSiblingDescendantLabel(level: number, sex?: string) {
  const isFemale = sex === "F";
  const isMale = sex === "M";

  if (level <= 0) {
    if (isFemale) return "la sœur";
    if (isMale) return "le frère";
    return "un frère ou une sœur";
  }

  if (level === 1) {
    if (isFemale) return "la nièce";
    if (isMale) return "le neveu";
    return "un neveu ou une nièce";
  }

  if (level === 2) {
    if (isFemale) return "la petite-nièce";
    if (isMale) return "le petit-neveu";
    return "un petit-neveu ou une petite-nièce";
  }

  if (level === 3) {
    if (isFemale) return "l’arrière-petite-nièce";
    if (isMale) return "l’arrière-petit-neveu";
    return "un arrière-petit-neveu ou une arrière-petite-nièce";
  }

  if (isFemale) return `l’${"arrière-".repeat(level - 2)}petite-nièce`;
  if (isMale) return `l’${"arrière-".repeat(level - 2)}petit-neveu`;

  return `un ${"arrière-".repeat(level - 2)}petit-neveu ou une ${"arrière-".repeat(level - 2)}petite-nièce`;
}

function isSiblingLinePattern(moves: RelationshipEdgeType[]): boolean {
  if (moves.length < 2) return false;
  if (moves[0] !== "parent") return false;
  if (moves[1] !== "child") return false;
  return moves.slice(2).every((via) => via === "child");
}

function summarizeRelationshipToRoot(
  path: RelationshipPathNode[] | null,
  rootDisplayName: string,
  isCenteredOnMe: boolean,
  targetSex?: string,
) {
  if (!path) return "Aucun chemin trouvé.";

  if (path.length === 1) {
    return isCenteredOnMe
      ? "Tu es actuellement centré sur ton point de départ."
      : `Tu es actuellement centré sur ${rootDisplayName}.`;
  }

  const moves = path
    .slice(1)
    .map((node) => node.via)
    .filter((via): via is RelationshipEdgeType => Boolean(via));

  const upCount = moves.filter((via) => via === "parent").length;
  const downCount = moves.filter((via) => via === "child").length;
  const spouseCount = moves.filter((via) => via === "spouse").length;

  if (spouseCount === 0 && upCount > 0 && downCount === 0) {
    return isCenteredOnMe
      ? `Tu es ${getAncestorLabel(upCount, targetSex)} de ${rootDisplayName}.`
      : `Cette personne est ${getAncestorLabel(upCount, targetSex)} de ${rootDisplayName}.`;
  }

  if (spouseCount === 0 && downCount > 0 && upCount === 0) {
    return isCenteredOnMe
      ? `Tu es ${getDescendantLabel(downCount, targetSex)} de ${rootDisplayName}.`
      : `Cette personne est ${getDescendantLabel(downCount, targetSex)} de ${rootDisplayName}.`;
  }

  if (spouseCount === 0 && isSiblingLinePattern(moves)) {
    const level = moves.length - 2;
    return isCenteredOnMe
      ? `Tu es ${getSiblingDescendantLabel(level, targetSex)} de ${rootDisplayName}.`
      : `Cette personne est ${getSiblingDescendantLabel(level, targetSex)} de ${rootDisplayName}.`;
  }

  if (spouseCount > 0) {
    return isCenteredOnMe
      ? `Ton lien avec ${rootDisplayName} passe par une alliance.`
      : `Le lien avec ${rootDisplayName} passe par une alliance.`;
  }

  return isCenteredOnMe
    ? `Voici ton chemin familial le plus court depuis ${rootDisplayName}.`
    : `Voici le chemin familial le plus court depuis ${rootDisplayName}.`;
}

function parseBirthYear(value?: string | number | null): number | null {
  if (value === undefined || value === null || value === "") return null;

  const year =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);

  return Number.isNaN(year) ? null : year;
}

function sortPersonsByBirthYear(persons: PersonSummary[]): PersonSummary[] {
  return persons.reduce<PersonSummary[]>((ordered, person) => {
    const personYear = parseBirthYear(person.birthYear);

    if (personYear === null) {
      ordered.push(person);
      return ordered;
    }

    const insertAt = ordered.findIndex((candidate) => {
      const candidateYear = parseBirthYear(candidate.birthYear);
      return candidateYear !== null && candidateYear > personYear;
    });

    if (insertAt === -1) {
      ordered.push(person);
    } else {
      ordered.splice(insertAt, 0, person);
    }

    return ordered;
  }, []);
}

function removeUniformLinkedSpouseLabel(
  persons: PersonSummary[],
): PersonSummary[] {
  const distinctLabels = Array.from(
    new Set(
      persons
        .map((person) => person.linkedSpouseLabel?.trim())
        .filter((label): label is string => Boolean(label)),
    ),
  );

  if (distinctLabels.length !== 1) {
    return persons;
  }

  return persons.map((person) => ({
    ...person,
    linkedSpouseLabel: undefined,
  }));
}

function TvRelationGroup({
  title,
  icon: Icon,
  persons,
  emptyLabel,
  onSelect,
}: TvRelationGroupProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon size={22} />
        </div>

        <div className="min-w-0">
          <h2 className="text-[22px] font-black tracking-tight text-slate-950">
            {title}
          </h2>

          <div className="text-sm font-semibold text-slate-500">
            {persons.length}{" "}
            {getPluralLabel(persons.length, "personne", "personnes")}
          </div>
        </div>
      </div>

      {persons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-base font-semibold text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="grid gap-3">
          {persons.map((person) => {
            const years =
              person.canDisplay && person.canDisplayInfo
                ? formatYears(person)
                : null;

            const lifePath =
              person.canDisplay && person.canDisplayInfo
                ? formatLifePath(person)
                : null;

            return (
              <button
                key={person.id}
                type="button"
                onClick={() => onSelect(person.id)}
                className="group w-full rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white active:scale-[0.995]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-200">
                    {person.canDisplay &&
                    person.canDisplayPhoto &&
                    person.photoSrc ? (
                      <SmartImage
                        src={person.photoSrc}
                        alt={`${person.firstName} ${person.lastName}`}
                      />
                    ) : (
                      <Users size={26} className="text-slate-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[22px] font-black tracking-tight text-slate-950">
                      {person.firstName} {person.lastName}
                    </div>

                    {person.nickname ? (
                      <div className="mt-1 truncate text-base font-bold text-slate-600">
                        {person.sex === "F" ? "appelée" : "appelé"}{" "}
                        {person.nickname}
                      </div>
                    ) : null}

                    {years ? (
                      <div className="mt-1 text-base font-semibold text-slate-600">
                        {years}
                      </div>
                    ) : null}

                    {lifePath ? (
                      <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-700">
                        <MapPin size={14} />
                        <span className="truncate">{lifePath}</span>
                      </div>
                    ) : null}

                    {person.linkedSpouseLabel ? (
                      <div className="mt-2 text-sm font-semibold text-slate-500">
                        avec {person.linkedSpouseLabel}
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0 rounded-2xl bg-white p-3 text-slate-700 shadow-sm transition group-hover:bg-slate-900 group-hover:text-white">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function FamilyTreeBrowseTvPage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const [searchParams] = useSearchParams();
  const requestedPersonId = searchParams.get("personId");

  const rootHonoredPersonId = ROOT_HONORED_PERSON_ID;

  const [defaultGedcomPersonId, setDefaultGedcomPersonId] = useState<
    string | null
  >(null);
  const [defaultGedcomPersonLoading, setDefaultGedcomPersonLoading] =
    useState(false);

  const [visibilityPreferencesByPersonId, setVisibilityPreferencesByPersonId] =
    useState<PersonVisibilityPreferenceMap>({});
  const [effectiveVisibilityLoading, setEffectiveVisibilityLoading] =
    useState(true);

  const [overridesByPersonId, setOverridesByPersonId] = useState<
    Record<string, PersonUiOverride>
  >({});
  const [overridesLoading, setOverridesLoading] = useState(true);

  const hasDefaultTreeEntry = Boolean(defaultGedcomPersonId);

  const initialCenterId =
    requestedPersonId && FAMILY_GRAPH.people[requestedPersonId]
      ? requestedPersonId
      : rootHonoredPersonId;

  const [centerId, setCenterId] = useState<string>(initialCenterId);

  const sourcePersonId = defaultGedcomPersonId;
  const sosaReferencePersonId = sourcePersonId ?? defaultGedcomPersonId ?? null;

  const context = useMemo(
    () =>
      getPersonContext(
        centerId,
        visibilityPreferencesByPersonId,
        sosaReferencePersonId,
        overridesByPersonId,
      ),
    [
      centerId,
      visibilityPreferencesByPersonId,
      sosaReferencePersonId,
      overridesByPersonId,
    ],
  );

  const forceDisplayedPersonIds = useMemo(() => new Set<string>(), []);

  const displayPerson = useMemo(
    () => getDisplayPerson(context.person, forceDisplayedPersonIds),
    [context.person, forceDisplayedPersonIds],
  );

  const displayParents = useMemo(
    () =>
      context.parents.map((person) =>
        getDisplayPerson(person, forceDisplayedPersonIds),
      ),
    [context.parents, forceDisplayedPersonIds],
  );

  const displaySpouses = useMemo(
    () =>
      context.spouses.map((person) =>
        getDisplayPerson(person, forceDisplayedPersonIds),
      ),
    [context.spouses, forceDisplayedPersonIds],
  );

  const displayChildren = useMemo(
    () =>
      removeUniformLinkedSpouseLabel(
        sortPersonsByBirthYear(context.children).map((person) =>
          getDisplayPerson(person, forceDisplayedPersonIds),
        ),
      ),
    [context.children, forceDisplayedPersonIds],
  );

  const displaySiblings = useMemo(
    () =>
      sortPersonsByBirthYear(context.siblings).map((person) =>
        getDisplayPerson(person, forceDisplayedPersonIds),
      ),
    [context.siblings, forceDisplayedPersonIds],
  );

  const displayGrandparents = useMemo(
    () =>
      context.grandparents.map((person) =>
        getDisplayPerson(person, forceDisplayedPersonIds),
      ),
    [context.grandparents, forceDisplayedPersonIds],
  );

  const relationshipPath = useMemo(
    () => findRelationshipPath(FAMILY_GRAPH, rootHonoredPersonId, centerId),
    [centerId, rootHonoredPersonId],
  );

  const heroConfig = useMemo(
    () =>
      getPersonHeroConfig(
        centerId,
        visibilityPreferencesByPersonId,
        sosaReferencePersonId,
        overridesByPersonId,
      ),
    [
      centerId,
      visibilityPreferencesByPersonId,
      sosaReferencePersonId,
      overridesByPersonId,
    ],
  );

  const rootPerson = useMemo(
    () =>
      anonymizePerson(
        getPersonContext(
          rootHonoredPersonId,
          visibilityPreferencesByPersonId,
          sosaReferencePersonId,
          overridesByPersonId,
        ).person,
      ),
    [
      rootHonoredPersonId,
      visibilityPreferencesByPersonId,
      sosaReferencePersonId,
      overridesByPersonId,
    ],
  );

  const isCenteredOnSource =
    Boolean(sourcePersonId) && centerId === sourcePersonId;

  const relationshipSummary = summarizeRelationshipToRoot(
    relationshipPath,
    `Gromèr ${rootPerson.firstName}`,
    isCenteredOnSource,
    displayPerson.sex,
  );

  const visibleOtherBranches =
    displayPerson.canDisplay && displayPerson.canDisplayName
      ? heroConfig.otherBranches
      : [];

  const centerYears =
    displayPerson.canDisplay && displayPerson.canDisplayInfo
      ? formatYears(displayPerson)
      : null;

  const centerPath =
    displayPerson.canDisplay && displayPerson.canDisplayInfo
      ? formatLifePath(displayPerson)
      : null;

  const familyTreeTrackerRef = useRef<ReturnType<
    typeof createFamilyTreeViewTracker
  > | null>(null);

  async function loadDefaultGedcomPersonId() {
    if (!participantId) {
      setDefaultGedcomPersonId(null);
      return;
    }

    try {
      setDefaultGedcomPersonLoading(true);

      const personId = await getParticipantDefaultGedcomPersonId({
        eventSlug: slug,
        participantId,
      });

      setDefaultGedcomPersonId(normalizePersonId(personId));
    } catch (error) {
      console.error(error);
      setDefaultGedcomPersonId(null);
    } finally {
      setDefaultGedcomPersonLoading(false);
    }
  }

  async function loadVisibilityPreferencesMap() {
    try {
      setEffectiveVisibilityLoading(true);

      const map = await getFamilyTreeEffectiveVisibilityMap({
        eventSlug: slug,
      });

      setVisibilityPreferencesByPersonId(map);
    } catch (error) {
      console.error(error);
      setVisibilityPreferencesByPersonId({});
    } finally {
      setEffectiveVisibilityLoading(false);
    }
  }

  async function loadOverridesMap() {
    try {
      setOverridesLoading(true);

      const map = await getMergedPersonOverridesMap(slug);
      setOverridesByPersonId(map);
    } catch (error) {
      console.error(error);
      setOverridesByPersonId({});
    } finally {
      setOverridesLoading(false);
    }
  }

  function goToPerson(personId: string, viaAction: FamilyTreeViaAction) {
    setCenterId(personId);

    const tracker = familyTreeTrackerRef.current;
    if (tracker) {
      void tracker.changePerson(personId, viaAction);
    }
  }

  function goToRelationPerson(
    personId: string,
    viaAction: TvRelationSectionKey,
  ) {
    goToPerson(personId, viaAction);
  }

  function recenterOnSource() {
    if (!sourcePersonId) return;
    goToPerson(sourcePersonId, "recenter_source");
  }

  function recenterOnRoot() {
    goToPerson(rootHonoredPersonId, "recenter_root");
  }

  function openCentralPerson() {
    navigate(`/e/${slug}/family-tree/person?id=${centerId}`);
  }

  useEffect(() => {
    void loadVisibilityPreferencesMap();
  }, [slug]);

  useEffect(() => {
    void loadOverridesMap();
  }, [slug]);

  useEffect(() => {
    void loadDefaultGedcomPersonId();
  }, [participantId, slug]);

  useEffect(() => {
    if (!participantId) return;

    const tracker = createFamilyTreeViewTracker({
      participantId,
      eventSlug: slug,
      sourcePageKey: `/e/${slug}/family-tree/browse-tv`,
      initialPersonId: centerId,
    });

    familyTreeTrackerRef.current = tracker;
    tracker.start();

    return () => {
      familyTreeTrackerRef.current = null;
      void tracker.stop();
    };
  }, [participantId, slug, centerId]);

  useEffect(() => {
    if (!participantId) return;

    const tracker = createPageTimeTracker({
      participantId,
      eventSlug: slug,
      pageKey: `/e/${slug}/family-tree/browse-tv`,
    });

    tracker.start();

    return () => {
      void tracker.stop();
    };
  }, [participantId, slug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [centerId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        navigate(`/e/${slug}/family-tree`);
        return;
      }

      if (event.key.toLowerCase() === "h") {
        recenterOnRoot();
        return;
      }

      if (event.key.toLowerCase() === "m") {
        recenterOnSource();
        return;
      }

      if (event.key.toLowerCase() === "f") {
        navigate(`/e/${slug}/family-tree/find-person`);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, slug, sourcePersonId]);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="mx-auto max-w-[1800px] px-6 pb-10 pt-6 2xl:px-8">
        <section className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Monitor size={26} />
              </div>

              <div className="min-w-0">
                <div className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Mode écran large
                </div>

                <h1 className="truncate text-[30px] font-black tracking-tight text-slate-950">
                  Arbre familial — affichage TV
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/e/${slug}/family-tree/find-person`)}
                className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <Search size={18} />
                Chercher
              </button>

              <button
                type="button"
                onClick={() => navigate(`/e/${slug}/family-tree`)}
                className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
                Retour
              </button>
            </div>
          </div>
        </section>

        {effectiveVisibilityLoading || overridesLoading ? (
          <section>
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="inline-flex items-center gap-3 text-lg font-bold text-slate-700">
                <Loader2 className="h-6 w-6 animate-spin" />
                Chargement de la fiche…
              </div>
            </div>
          </section>
        ) : !defaultGedcomPersonLoading &&
          participantId &&
          !hasDefaultTreeEntry ? (
          <section>
            <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="text-[28px] font-black tracking-tight text-amber-950">
                L’exploration de l’arbre n’est pas encore disponible
              </div>

              <div className="mt-3 max-w-4xl text-lg leading-8 text-amber-900">
                L’organisation n’a pas encore assez d’éléments pour rattacher ce
                profil à une branche.
              </div>
            </div>
          </section>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
            <section className="min-w-0">
              <div
                className={[
                  "rounded-[36px] p-6 text-white shadow-[0_28px_60px_rgba(15,23,42,0.22)]",
                  heroConfig.heroClassName,
                ].join(" ")}
              >
                <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                  <div>
                    <div className="aspect-square overflow-hidden rounded-[30px] bg-white/10 ring-1 ring-white/20">
                      {displayPerson.canDisplay &&
                      displayPerson.canDisplayPhoto &&
                      displayPerson.photoSrc ? (
                        <SmartImage
                          src={displayPerson.photoSrc}
                          alt={`${displayPerson.firstName} ${displayPerson.lastName}`}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-black/10">
                          <Users size={68} className="text-white/70" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[13px] font-black uppercase tracking-[0.22em] text-white/70">
                          Individu central
                        </div>

                        <button
                          type="button"
                          onClick={openCentralPerson}
                          className="mt-3 text-left"
                        >
                          <div className="text-[54px] font-black leading-[0.95] tracking-tight">
                            {displayPerson.firstName} {displayPerson.lastName}
                          </div>

                          {displayPerson.nickname ? (
                            <div className="mt-3 text-[28px] font-black leading-tight text-white/90">
                              {displayPerson.sex === "F" ? "appelée" : "appelé"}{" "}
                              {displayPerson.nickname}
                            </div>
                          ) : null}
                        </button>

                        {centerYears ? (
                          <div className="mt-4 text-[24px] font-extrabold text-white/90">
                            {centerYears}
                          </div>
                        ) : null}

                        {centerPath ? (
                          <div className="mt-4 inline-flex max-w-full items-center gap-3 rounded-full bg-white/10 px-5 py-3 text-lg font-bold text-white/95">
                            <MapPin size={18} />
                            <span className="truncate">{centerPath}</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex max-w-[40%] flex-wrap justify-end gap-2">
                        {!displayPerson.canDisplay ? (
                          <span className="inline-flex items-center rounded-full bg-black/20 px-4 py-2 text-sm font-extrabold text-white">
                            Profil masqué
                          </span>
                        ) : !displayPerson.canDisplayName ||
                          !displayPerson.canDisplayPhoto ||
                          !displayPerson.canDisplayInfo ? (
                          <span className="inline-flex items-center rounded-full bg-black/20 px-4 py-2 text-sm font-extrabold text-white">
                            Profil partiellement masqué
                          </span>
                        ) : null}

                        {visibleOtherBranches.map((branch) => (
                          <span
                            key={branch.id}
                            className={[
                              "inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold",
                              branch.chipClassName,
                            ].join(" ")}
                          >
                            {branch.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {centerId !== rootHonoredPersonId ? (
                      <div className="mt-6 rounded-[24px] bg-black/15 p-5">
                        <div className="flex items-start gap-3 text-[22px] font-black leading-snug text-white">
                          <Heart
                            size={22}
                            className="mt-1 shrink-0 text-white"
                          />
                          <div>{relationshipSummary}</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 2xl:grid-cols-2">
                <TvRelationGroup
                  title="Parents"
                  icon={Users}
                  persons={displayParents}
                  emptyLabel="Aucun parent affichable."
                  onSelect={(personId) =>
                    goToRelationPerson(personId, "parents_section")
                  }
                />

                <TvRelationGroup
                  title={getPluralLabel(
                    displaySpouses.length,
                    "Conjoint",
                    "Conjoints",
                  )}
                  icon={Heart}
                  persons={displaySpouses}
                  emptyLabel="Aucun conjoint affichable."
                  onSelect={(personId) =>
                    goToRelationPerson(personId, "spouses_section")
                  }
                />

                <TvRelationGroup
                  title={getPluralLabel(
                    displayChildren.length,
                    "Enfant",
                    "Enfants",
                  )}
                  icon={Compass}
                  persons={displayChildren}
                  emptyLabel="Aucun enfant affichable."
                  onSelect={(personId) =>
                    goToRelationPerson(personId, "children_section")
                  }
                />

                <TvRelationGroup
                  title={getPluralLabel(
                    displaySiblings.length,
                    "Frère / sœur",
                    "Fratrie",
                  )}
                  icon={Users}
                  persons={displaySiblings}
                  emptyLabel="Aucun frère ou sœur affichable."
                  onSelect={(personId) =>
                    goToRelationPerson(personId, "siblings_section")
                  }
                />

                <div className="2xl:col-span-2">
                  <TvRelationGroup
                    title="Grands-parents"
                    icon={Users}
                    persons={displayGrandparents}
                    emptyLabel="Aucun grand-parent affichable."
                    onSelect={(personId) =>
                      goToRelationPerson(personId, "grandparents_section")
                    }
                  />
                </div>
              </div>
            </section>

            <aside className="min-w-0">
              <div className="sticky top-6 space-y-6">
                <section className="rounded-[28px] border border-slate-300 bg-slate-900 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                  <div className="text-[26px] font-black tracking-tight text-white">
                    Navigation
                  </div>

                  <div className="mt-4 grid gap-3">
                    {centerId !== rootHonoredPersonId ? (
                      <button
                        type="button"
                        onClick={recenterOnRoot}
                        className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:bg-slate-50 active:scale-[0.995]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                            <Heart size={24} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-[20px] font-black text-slate-900">
                              Centrer sur Gromèr {rootPerson.firstName}
                            </div>
                          </div>

                          <div className="shrink-0 rounded-2xl bg-slate-100 p-3 text-slate-900">
                            <ArrowRight size={20} />
                          </div>
                        </div>
                      </button>
                    ) : null}

                    {sourcePersonId && centerId !== sourcePersonId ? (
                      <button
                        type="button"
                        onClick={recenterOnSource}
                        className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:bg-slate-50 active:scale-[0.995]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                            <UserCircle2 size={24} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-[20px] font-black text-slate-900">
                              Revenir à mon point de départ
                            </div>
                          </div>

                          <div className="shrink-0 rounded-2xl bg-slate-100 p-3 text-slate-900">
                            <ArrowRight size={20} />
                          </div>
                        </div>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/e/${slug}/family-tree/find-person`)
                      }
                      className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:bg-slate-50 active:scale-[0.995]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                          <Search size={24} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-[20px] font-black text-slate-900">
                            Chercher une personne
                          </div>
                        </div>

                        <div className="shrink-0 rounded-2xl bg-slate-100 p-3 text-slate-900">
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={openCentralPerson}
                      className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:bg-slate-50 active:scale-[0.995]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <Compass size={24} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-[20px] font-black text-slate-900">
                            Ouvrir la fiche complète
                          </div>
                        </div>

                        <div className="shrink-0 rounded-2xl bg-slate-100 p-3 text-slate-900">
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    </button>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-[22px] font-black tracking-tight text-slate-950">
                    Repères
                  </div>

                  <div className="mt-4 space-y-3 text-[17px] leading-7 text-slate-700">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-black text-slate-900">H</span> :
                      revenir sur l’ancêtre d’honneur
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-black text-slate-900">M</span> :
                      revenir à mon point de départ
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-black text-slate-900">F</span> :
                      ouvrir la recherche
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-black text-slate-900">Échap</span>{" "}
                      : quitter ce mode
                    </div>
                  </div>
                </section>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}