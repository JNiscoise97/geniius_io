//FamilyTreeBrowsePage.tsx

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Eye,
  Heart,
  Lock,
  MapPin,
  Megaphone,
  MessageCircle,
  Plus,
  Search,
  UserCheck,
  UserCircle2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import {
  createFamilyTreeViewTracker,
  type FamilyTreeViaAction,
} from "../../../lib/analytics/familyTreeViewTracker";
import {
  findRelationshipPath,
  type RelationshipEdgeType,
  type RelationshipPathNode,
} from "../api/findRelationshipPath";
import { FAMILY_GRAPH } from "../api/loadGraph";
import {
  getPersonContext,
  getPersonHeroConfig,
} from "../config/configGenealogy";
import type { PersonSummary, PersonVisibilityPreferenceMap } from "../types";
import { getPersonContributionStats } from "../api/getPersonContributionStats";
import { getPersonReactionState } from "../api/getPersonReactionState";
import { togglePersonReaction } from "../api/togglePersonReaction";
import { FamilyRelationsSection } from "../components/FamilyRelationsSection";
import { PersonMemoriesPanel } from "../components/PersonMemoriesPanel";
import { PersonMemoryEditorPanel } from "../components/PersonMemoryEditorPanel";
import { PersonPhotoUploadPanel } from "../components/PersonPhotoUploadPanel";
import {
  getApprovedPersonMemories,
  type ApprovedPersonMemory,
} from "../api/getApprovedPersonMemories";
import {
  getApprovedPersonPhotos,
  type ApprovedPersonPhoto,
} from "../api/getApprovedPersonPhotos";
import { getMyPersonMemoryToBeApproved } from "../api/getMyPersonMemoryToBeApproved";
import { saveMyPersonMemory } from "../api/saveMyPersonMemory";
import { uploadPersonPhoto } from "../api/uploadPersonPhoto";
import { PersonPhotosPanel } from "../components/PersonPhotosPanel";
import { SmartImage } from "../../../lib/media/useSmartImage";
import { getMyPersonIdentityClaim } from "../api/getMyPersonIdentityClaim";
import { saveMyPersonIdentityClaim } from "../api/saveMyPersonIdentityClaim";
import { deleteMyPersonIdentityClaim } from "../api/deleteMyPersonIdentityClaim";
import { getMyPersonVisibilityRequest } from "../api/getMyPersonVisibilityRequest";
import { saveMyPersonVisibilityRequest } from "../api/saveMyPersonVisibilityRequest";
import { deleteMyPersonVisibilityRequest } from "../api/deleteMyPersonVisibilityRequest";
import { ROOT_HONORED_PERSON_ID } from "../../../config/eventInfos";
import { getParticipantDefaultGedcomPersonId } from "../api/getParticipantDefaultGedcomPersonId";
import { getFamilyTreeVisibilityPreferencesMap } from "../api/getFamilyTreeVisibilityPreferencesMap";

type BrowsePanelMode =
  | "relations"
  | "memories"
  | "memory_editor"
  | "photo_upload"
  | "photos";

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

function ReactionCountBadge({
  count,
  active,
}: {
  count: number;
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex min-w-[22px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-black ${
        active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
      }`}
    >
      {count}
    </span>
  );
}

function formatYears(person: PersonSummary) {
  const { birthYear, deathYear, isPossiblyAlive } = person;

  if (!birthYear && !deathYear) return null;

  if (birthYear && deathYear) {
    return `${birthYear} - ${deathYear}`;
  }

  if (!isPossiblyAlive) {
    return `${birthYear ?? "?"} - ?`;
  }

  return birthYear ?? "?";
}

type ParsedPlace = {
  city?: string;
  department?: string;
  region?: string;
  country?: string;
};

function cleanPart(value?: string): string | undefined {
  const s = value?.trim();
  if (!s || s === "?") return undefined;
  return s;
}

function parsePlace(place?: string): ParsedPlace | null {
  if (!place) return null;

  const parts = place.split(",").map((p) => cleanPart(p));

  if (parts.length >= 5) {
    return {
      city: parts[0],
      department: parts[2],
      region: parts[3],
      country: parts[4],
    };
  }

  if (parts.length === 4) {
    return {
      city: parts[0],
      department: parts[1],
      region: parts[2],
      country: parts[3],
    };
  }

  if (parts.length === 3) {
    return {
      city: parts[0],
      region: parts[1],
      country: parts[2],
    };
  }

  if (parts.length === 2) {
    return {
      city: parts[0],
      country: parts[1],
    };
  }

  if (parts.length === 1) {
    return {
      city: parts[0],
    };
  }

  return null;
}

function normalizeTerritory(place: ParsedPlace | null): ParsedPlace | null {
  if (!place) return null;

  const dep = place.department?.toLowerCase();
  const reg = place.region?.toLowerCase();
  const country = place.country?.toLowerCase();

  if (dep === "réunion" && reg === "réunion" && country === "france") {
    return {
      ...place,
      department: undefined,
      region: undefined,
      country: "LA RÉUNION",
    };
  }

  if (dep === "guadeloupe" && reg === "guadeloupe" && country === "france") {
    return {
      ...place,
      department: undefined,
      region: undefined,
      country: "GUADELOUPE",
    };
  }

  return place;
}

function same(a?: string, b?: string): boolean {
  return (a ?? "").toLowerCase() === (b ?? "").toLowerCase();
}

function shouldDisplayCountry(place: ParsedPlace): boolean {
  return Boolean(place.country && place.country !== "LA RÉUNION");
}

function pickSingle(place: ParsedPlace | null): string | null {
  if (!place) return null;

  if (place.city) {
    return shouldDisplayCountry(place)
      ? [place.city, place.country].filter(Boolean).join(", ")
      : place.city;
  }

  return place.department ?? place.region ?? place.country ?? null;
}

function formatLocal(place: ParsedPlace): string {
  if (place.city) {
    return shouldDisplayCountry(place)
      ? [place.city, place.country].filter(Boolean).join(", ")
      : place.city;
  }

  return place.department ?? place.region ?? place.country ?? "?";
}

function formatRegional(place: ParsedPlace): string {
  const parts = shouldDisplayCountry(place)
    ? [place.city, place.department, place.region, place.country]
    : [place.city, place.department, place.region];

  return parts.filter(Boolean).join(", ") || place.country || "?";
}

function formatInternational(place: ParsedPlace): string {
  return (
    [place.city, place.region, place.country].filter(Boolean).join(", ") || "?"
  );
}

function formatPlaceTransition(
  birthPlace?: string,
  deathPlace?: string,
): string | null {
  const birth = normalizeTerritory(parsePlace(birthPlace));
  const death = normalizeTerritory(parsePlace(deathPlace));

  if (!birth && !death) return null;
  if (!birth) return pickSingle(death);
  if (!death) return pickSingle(birth);

  const sameCountry = same(birth.country, death.country);
  const sameRegion = same(birth.region, death.region);
  const sameDepartment = same(birth.department, death.department);
  const sameCity = same(birth.city, death.city);

  if (sameCity && sameDepartment && sameRegion && sameCountry) {
    return pickSingle(birth);
  }

  if (sameDepartment && sameRegion && sameCountry) {
    return `${formatLocal(birth)} → ${formatLocal(death)}`;
  }

  if (sameRegion && sameCountry) {
    return `${formatRegional(birth)} → ${formatRegional(death)}`;
  }

  if (sameCountry) {
    return `${formatRegional(birth)} → ${formatRegional(death)}`;
  }

  return `${formatInternational(birth)} → ${formatInternational(death)}`;
}

function formatLifePath(person: PersonSummary) {
  return formatPlaceTransition(person.birthPlace, person.deathPlace);
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

  if (isFemale) {
    return `l’${"arrière-".repeat(level - 2)}grand-mère`;
  }

  if (isMale) {
    return `l’${"arrière-".repeat(level - 2)}grand-père`;
  }

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

  if (isFemale) {
    return `l’${"arrière-".repeat(level - 2)}petite-fille`;
  }

  if (isMale) {
    return `l’${"arrière-".repeat(level - 2)}petit-fils`;
  }

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

  if (isFemale) {
    return `l’${"arrière-".repeat(level - 2)}petite-nièce`;
  }

  if (isMale) {
    return `l’${"arrière-".repeat(level - 2)}petit-neveu`;
  }

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
      ? "Tu es actuellement centré sur toi."
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

function sortPersonsByBirthYear(persons: PersonSummary[]): PersonSummary[] {
  return [...persons].sort((a, b) => {
    const aYear = Number(a.birthYear);
    const bYear = Number(b.birthYear);

    const aHasYear = Boolean(a.birthYear && !Number.isNaN(aYear));
    const bHasYear = Boolean(b.birthYear && !Number.isNaN(bYear));

    if (aHasYear && bHasYear) {
      return aYear - bYear;
    }

    if (aHasYear && !bHasYear) {
      return -1;
    }

    if (!aHasYear && bHasYear) {
      return 1;
    }

    return 0;
  });
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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function FamilyTreeBrowsePage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const [searchParams] = useSearchParams();
  const requestedPersonId = searchParams.get("personId");

  const [hasKnownPerson, setHasKnownPerson] = useState(false);
  const [hasHeardOfPerson, setHasHeardOfPerson] = useState(false);
  const [hasTouchedPerson, setHasTouchedPerson] = useState(false);
  const [hasMyComment, setHasMyComment] = useState(false);
  const [memoriesCount, setMemoriesCount] = useState(0);
  const [knownCount, setKnownCount] = useState(0);
  const [heardCount, setHeardCount] = useState(0);
  const [photosCount, setPhotosCount] = useState(0);
  const [reactionsCount, setReactionsCount] = useState(0);
  const [panelMode, setPanelMode] = useState<BrowsePanelMode>("relations");

  const [claimedPersonId, setClaimedPersonId] = useState<string | null>(null);
  const [myIdentityClaimStatus, setMyIdentityClaimStatus] = useState<
    "pending" | "approved" | "rejected" | "auto_verified" | null
  >(null);
  const [isSavingIdentityClaim, setIsSavingIdentityClaim] = useState(false);

  const [approvedMemories, setApprovedMemories] = useState<
    ApprovedPersonMemory[]
  >([]);
  const [approvedPhotos, setApprovedPhotos] = useState<ApprovedPersonPhoto[]>(
    [],
  );
  const [memoryDraft, setMemoryDraft] = useState("");
  const [myMemoryStatus, setMyMemoryStatus] = useState<
    "pending" | "approved" | "rejected" | null
  >(null);
  const [myMemoryModeratorComment, setMyMemoryModeratorComment] = useState<
    string | null
  >(null);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [myVisibilityRequestStatus, setMyVisibilityRequestStatus] = useState<
    "pending" | "approved" | "rejected" | null
  >(null);
  const [
    myVisibilityRequestModeratorComment,
    setMyVisibilityRequestModeratorComment,
  ] = useState<string | null>(null);
  const [isSavingVisibilityRequest, setIsSavingVisibilityRequest] =
    useState(false);

  const [defaultGedcomPersonId, setDefaultGedcomPersonId] = useState<
    string | null
  >(null);
  const [defaultGedcomPersonLoading, setDefaultGedcomPersonLoading] =
    useState(false);

  const rootHonoredPersonId = ROOT_HONORED_PERSON_ID;
  const sourcePersonId =
    myIdentityClaimStatus === "approved" ||
    myIdentityClaimStatus === "auto_verified"
      ? claimedPersonId
      : null;
  const hasDefaultTreeEntry = Boolean(defaultGedcomPersonId);

  const initialCenterId =
    requestedPersonId && FAMILY_GRAPH.people[requestedPersonId]
      ? requestedPersonId
      : rootHonoredPersonId;

  const [centerId, setCenterId] = useState<string>(initialCenterId);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    parents: true,
    spouses: true,
    children: true,
    siblings: true,
    grandparents: false,
  });

  const [visibilityPreferencesByPersonId, setVisibilityPreferencesByPersonId] =
  useState<PersonVisibilityPreferenceMap>({});

  const context = useMemo(
  () => getPersonContext(centerId, visibilityPreferencesByPersonId),
  [centerId, visibilityPreferencesByPersonId],
);
  console.log("context", context)

  const hasPendingClaimForCurrentPerson =
    myIdentityClaimStatus === "pending" && claimedPersonId === centerId;

  const isApprovedClaimForCurrentPerson =
    (myIdentityClaimStatus === "approved" ||
      myIdentityClaimStatus === "auto_verified") &&
    claimedPersonId === centerId;

  const forceDisplayedPersonIds = useMemo(() => {
    const ids = new Set<string>();

    if (
      claimedPersonId &&
      (myIdentityClaimStatus === "approved" ||
        myIdentityClaimStatus === "auto_verified")
    ) {
      ids.add(claimedPersonId);
    }

    return ids;
  }, [claimedPersonId, myIdentityClaimStatus]);

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
  () => getPersonHeroConfig(centerId, visibilityPreferencesByPersonId),
  [centerId, visibilityPreferencesByPersonId],
);

  const visibleOtherBranches =
  displayPerson.canDisplay && displayPerson.canDisplayName
    ? heroConfig.otherBranches
    : [];

  const familyTreeTrackerRef = useRef<ReturnType<
    typeof createFamilyTreeViewTracker
  > | null>(null);

  const hasPendingVisibilityRequestForCurrentPerson =
    myVisibilityRequestStatus === "pending";

  const hasRejectedVisibilityRequestForCurrentPerson =
    myVisibilityRequestStatus === "rejected";

  const centerYears =
  displayPerson.canDisplay && displayPerson.canDisplayInfo
    ? formatYears(displayPerson)
    : null;
  const centerPath =
  displayPerson.canDisplay && displayPerson.canDisplayInfo
    ? formatLifePath(displayPerson)
    : null;

  const rootPerson = useMemo(
  () =>
    anonymizePerson(
      getPersonContext(rootHonoredPersonId, visibilityPreferencesByPersonId)
        .person,
    ),
  [rootHonoredPersonId, visibilityPreferencesByPersonId],
);
  const isCenteredOnMe = Boolean(sourcePersonId && centerId === sourcePersonId);

  const relationshipSummary = summarizeRelationshipToRoot(
    relationshipPath,
    `Gromèr ${rootPerson.firstName}`,
    isCenteredOnMe,
    displayPerson.sex,
  );

  const labelSpouses = getPluralLabel(
    displaySpouses.length,
    "Conjoint",
    "Conjoints",
  );
  const labelChildren = getPluralLabel(
    displayChildren.length,
    "Enfant",
    "Enfants",
  );
  const labelSiblings = getPluralLabel(
    displaySiblings.length,
    "Frère / sœur",
    "Fratrie",
  );

  const knowLabel = displayPerson.isPossiblyAlive
    ? "Je connais cette personne"
    : "J’ai connu cette personne";

  const heardLabel =
    displayPerson.sex === "F"
      ? "J’ai entendu parler d’elle"
      : displayPerson.sex === "M"
        ? "J’ai entendu parler de lui"
        : "J’ai entendu parler de cette personne";

  const photoLabel = displayPerson.photoSrc
    ? displayPerson.sex === "F"
      ? "J’ai une autre photo d’elle"
      : displayPerson.sex === "M"
        ? "J’ai une autre photo de lui"
        : "J’ai une autre photo"
    : displayPerson.sex === "F"
      ? "J’ai une photo d’elle"
      : displayPerson.sex === "M"
        ? "J’ai une photo de lui"
        : "J’ai une photo";

  const personDisplayName =
    `${displayPerson.firstName} ${displayPerson.lastName}`.trim();

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

      setDefaultGedcomPersonId(personId?.trim() ? personId : null);
    } catch (error) {
      console.error(error);
      setDefaultGedcomPersonId(null);
    } finally {
      setDefaultGedcomPersonLoading(false);
    }
  }

  async function loadVisibilityPreferencesMap() {
  try {
    const map = await getFamilyTreeVisibilityPreferencesMap({
      eventSlug: slug,
    });

    setVisibilityPreferencesByPersonId(map);
    console.log("map",map)
  } catch (error) {
    console.error(error);
    setVisibilityPreferencesByPersonId({});
  }
}

useEffect(() => {
  void loadVisibilityPreferencesMap();
}, [slug]);

  const loadCurrentPersonData = useCallback(async () => {
    if (!participantId) return;

    const [
      reactionState,
      stats,
      myMemory,
      approved,
      approvedPhotosData,
      identityClaim,
      visibilityRequest,
    ] = await Promise.all([
      getPersonReactionState({
        eventSlug: slug,
        participantId,
        personId: centerId,
      }),
      getPersonContributionStats({
        eventSlug: slug,
        personId: centerId,
      }),
      getMyPersonMemoryToBeApproved({
        eventSlug: slug,
        participantId,
        personId: centerId,
      }),
      getApprovedPersonMemories({
        eventSlug: slug,
        personId: centerId,
        currentParticipantId: participantId,
      }),
      getApprovedPersonPhotos({
        eventSlug: slug,
        personId: centerId,
        currentParticipantId: participantId,
      }),
      getMyPersonIdentityClaim({
        eventSlug: slug,
        participantId,
      }),
      getMyPersonVisibilityRequest({
        eventSlug: slug,
        participantId,
        personId: centerId,
      }),
    ]);

    setHasKnownPerson(reactionState.knewPerson);
    setHasHeardOfPerson(reactionState.heardOfPerson);
    setHasTouchedPerson(reactionState.touchedByPerson);

    setMemoriesCount(stats.memoriesCount);
    setKnownCount(stats.knownCount);
    setHeardCount(stats.heardCount);
    setPhotosCount(stats.photosCount);
    setReactionsCount(stats.reactionsCount);

    setClaimedPersonId(identityClaim?.person_id ?? null);
    setMyIdentityClaimStatus(identityClaim?.claim_status ?? null);

    setHasMyComment(Boolean(myMemory?.content?.trim()));
    setMemoryDraft(myMemory?.content ?? "");
    setMyMemoryStatus(myMemory?.moderation_status ?? null);
    setMyMemoryModeratorComment(myMemory?.moderator_comment ?? null);

    setApprovedMemories(approved);
    setApprovedPhotos(approvedPhotosData);

    setMyVisibilityRequestStatus(visibilityRequest?.request_status ?? null);
    setMyVisibilityRequestModeratorComment(
      visibilityRequest?.moderator_comment ?? null,
    );
  }, [centerId, participantId, slug]);

  useEffect(() => {
    if (!participantId) return;

    const tracker = createFamilyTreeViewTracker({
      participantId,
      eventSlug: slug,
      sourcePageKey: `/e/${slug}/familyTree/browse`,
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
      pageKey: `/e/${slug}/familyTree/browse`,
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
    setPanelMode("relations");
  }, [centerId]);

  useEffect(() => {
    if (!displayPerson.canDisplay) {
      setPanelMode("relations");
    }
  }, [displayPerson.canDisplay]);

  useEffect(() => {
    if (displayPerson.canDisplay) {
      setMyVisibilityRequestStatus(null);
      setMyVisibilityRequestModeratorComment(null);
    }
  }, [displayPerson.canDisplay]);

  useEffect(() => {
    if (!participantId) return;

    let isCancelled = false;

    async function run() {
      try {
        await loadCurrentPersonData();
      } catch (e) {
        if (!isCancelled) {
          console.error("Erreur loadCurrentPersonData", e);
        }
      }
    }

    void run();

    return () => {
      isCancelled = true;
    };
  }, [participantId, loadCurrentPersonData]);

  useEffect(() => {
    void loadDefaultGedcomPersonId();
  }, [participantId, slug]);

  function goToPerson(personId: string, viaAction: FamilyTreeViaAction) {
    setCenterId(personId);
    const tracker = familyTreeTrackerRef.current;

    if (tracker) {
      void tracker.changePerson(personId, viaAction);
    }
  }

  function recenterOnSource() {
    if (!sourcePersonId) return;

    setCenterId(sourcePersonId);
    const tracker = familyTreeTrackerRef.current;

    if (tracker) {
      void tracker.changePerson(sourcePersonId, "recenter_source");
    }
  }

  function recenterOnRoot() {
    setCenterId(rootHonoredPersonId);
    const tracker = familyTreeTrackerRef.current;

    if (tracker) {
      void tracker.changePerson(rootHonoredPersonId, "recenter_root");
    }
  }

  function openCentralPerson() {
    navigate(`/e/${slug}/fiche?id=${context.person.id}`);
  }

  function toggleSection(key: string) {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  async function handleRequestDisplay() {
    if (!participantId) return;

    setIsSavingVisibilityRequest(true);

    try {
      if (myVisibilityRequestStatus === "pending") {
        await deleteMyPersonVisibilityRequest({
          eventSlug: slug,
          participantId,
          personId: centerId,
        });
      } else {
        await saveMyPersonVisibilityRequest({
          eventSlug: slug,
          participantId,
          personId: centerId,
        });
      }

      await loadCurrentPersonData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingVisibilityRequest(false);
    }
  }

  async function handleSetAsMe() {
    if (!participantId) return;

    setIsSavingIdentityClaim(true);

    try {
      await Promise.all([
        saveMyPersonIdentityClaim({
          eventSlug: slug,
          participantId,
          personId: centerId,
        }),
        wait(3000),
      ]);

      await loadCurrentPersonData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingIdentityClaim(false);
    }
  }

  async function handleCancelIdentityClaim() {
    if (!participantId) return;

    setIsSavingIdentityClaim(true);

    try {
      await deleteMyPersonIdentityClaim({
        eventSlug: slug,
        participantId,
        personId: centerId,
      });

      await loadCurrentPersonData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingIdentityClaim(false);
    }
  }

  async function handleToggleKnown() {
    if (!participantId) return;

    const next = !hasKnownPerson;
    setHasKnownPerson(next);
    setKnownCount((prev) => Math.max(0, prev + (next ? 1 : -1)));

    try {
      await togglePersonReaction({
        eventSlug: slug,
        participantId,
        personId: centerId,
        reactionType: "knew_person",
        isActive: next,
      });
    } catch {
      setHasKnownPerson(!next);
      setKnownCount((prev) => Math.max(0, prev + (next ? -1 : 1)));
    }
  }

  async function handleToggleHeard() {
    if (!participantId) return;

    const next = !hasHeardOfPerson;
    setHasHeardOfPerson(next);
    setHeardCount((prev) => Math.max(0, prev + (next ? 1 : -1)));

    try {
      await togglePersonReaction({
        eventSlug: slug,
        participantId,
        personId: centerId,
        reactionType: "heard_of_person",
        isActive: next,
      });
    } catch {
      setHasHeardOfPerson(!next);
      setHeardCount((prev) => Math.max(0, prev + (next ? -1 : 1)));
    }
  }

  async function handleToggleTouched() {
    if (!participantId) return;

    const next = !hasTouchedPerson;
    setHasTouchedPerson(next);
    setReactionsCount((prev) => Math.max(0, prev + (next ? 1 : -1)));

    try {
      await togglePersonReaction({
        eventSlug: slug,
        participantId,
        personId: centerId,
        reactionType: "touched_by_person",
        isActive: next,
      });
    } catch {
      setHasTouchedPerson(!next);
      setReactionsCount((prev) => Math.max(0, prev + (next ? -1 : 1)));
    }
  }

  async function handleSaveMemory() {
    if (!participantId) return;

    const content = memoryDraft.trim();
    if (!content) return;

    setIsSavingMemory(true);

    try {
      await saveMyPersonMemory({
        eventSlug: slug,
        participantId,
        personId: centerId,
        content,
      });

      setPanelMode("relations");
      await loadCurrentPersonData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingMemory(false);
    }
  }

  async function handleUploadPhoto(file: File) {
    if (!participantId) return;

    setIsUploadingPhoto(true);

    try {
      await uploadPersonPhoto({
        eventSlug: slug,
        participantId,
        personId: centerId,
        file,
      });

      setPanelMode("relations");
      await loadCurrentPersonData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  function openFamilyKnowledge() {
    navigate(`/e/${slug}/family-knowledge`);
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-3">
        <section>
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(`/e/${slug}/family-tree/find-person`)}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <Search size={14} />
                Chercher une personne
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/e/${slug}/family-tree`)}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                Retour
              </span>
            </button>
          </div>
        </section>

        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-amber-900">
                Chantiers en cours
              </div>
              <div className="mt-0.5 text-xs text-amber-800">
                <ol>
                  <li>
                    Ajouter les photos des défunts
                    <ol>
                      <li>Auguste VIRAMA</li>
                      <li>Simone RAMA</li>
                      <li>Firmin BLUKER</li>
                      <li>Charlot BLUKER</li>
                      <li>Sylvio BLUKER</li>
                      <li>Georget MARDEMOUTOU</li>
                    </ol>
                  </li>
                  <li>
                    Inclure les lieux de domicile dans le circuit des lieux
                    d&apos;une personne
                  </li>
                  <li>
                    Message &quot;pas de conjoint / d&apos;enfant
                    identifié&quot;
                  </li>
                  <li>
                    Bouton de réactions:
                    <ul>
                      <li>
                        bouton C&apos;est moi, si c&apos;est moi pas de je
                        l&apos;ai connu ni de j&apos;ai entendu parler de lui
                      </li>
                      <li>
                        bouton C&apos;est moi, pouvoir override la photo
                        affichée
                      </li>
                      <li>
                        bouton C&apos;est moi, les labels des boutons &quot;sur
                        cette personne&quot;, &quot;de lui&quot; sont bizarre
                      </li>
                      <li>Demander le démasquage + Notif mail</li>
                    </ul>
                  </li>
                  <li>Signaler un manque, un soucis</li>
                  <li>Calque family-knowledge sur browse</li>
                  <li>
                    Photos:
                    <ul>
                      <li>Revoir l&apos;entête de ajouter une photo</li>
                      <li>Pouvoir supprimer une photo</li>
                      <li>
                        Consentement pour afficher le nom de la personne qui
                        publie
                      </li>
                      <li>
                        Demander si l&apos;utilisateur a recueilli le
                        consentement de la personne
                      </li>
                      <li>Photo pour remplacer celle affichée</li>
                      <li>Voir les photos affichées</li>
                      <li>Ajouter un commentaire à la photo</li>
                      <li>Notif mail</li>
                    </ul>
                  </li>
                  <li>
                    Souvenirs
                    <ul>
                      <li>
                        Enregistrer un draft par person_id et participant_id
                      </li>
                      <li>Pouvoir écrire plusieurs souvenirs</li>
                      <li>Pouvoir supprimer un souvenir</li>
                      <li>
                        Consentement pour afficher le nom de la personne qui
                        publie
                      </li>
                      <li>Photo pour remplacer celle affichée</li>
                      <li>Notif mail</li>
                    </ul>
                  </li>
                  <li>Récupérer le consentement</li>
                  <li>Déléguation de consentement</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {!defaultGedcomPersonLoading && !hasDefaultTreeEntry ? (
          <section className="mt-3 space-y-3">
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-amber-900">
                    L’exploration de l’arbre n’est pas encore disponible pour
                    toi
                  </div>
                  <div className="mt-1 text-xs leading-5 text-amber-800">
                    L’organisation n’a pas encore suffisamment d’éléments pour
                    te rattacher à une branche de l’arbre. Renseigne les
                    informations sur ta famille pour faciliter ton
                    identification.
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openFamilyKnowledge}
              className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
            >
              <Users size={16} />
              Renseigner ma famille
            </button>
          </section>
        ) : (
          <>
            {displayPerson.canDisplay &&
            displayPerson.canDisplayPhoto &&
            displayPerson.photoSrc ? (
              <section className="mb-4 mt-3 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
                <div className="aspect-square overflow-hidden rounded-[20px] bg-slate-100">
                  <SmartImage
                    src={displayPerson.photoSrc}
                    alt={`${displayPerson.firstName} ${displayPerson.lastName}`}
                  />
                </div>
              </section>
            ) : null}

            <section className="sticky top-0 z-30 -mx-1 mb-3 mt-3 border-b border-slate-200/80 bg-[color:var(--bg)]/95 px-1 pb-3 pt-1 backdrop-blur">
              <div
                className={[
                  "rounded-[26px] p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.20)]",
                  heroConfig.heroClassName,
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={openCentralPerson}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-wide text-white/70">
                        Individu central
                      </span>

                      <div className="flex max-w-[70%] flex-wrap justify-end gap-2">
                        {!displayPerson.canDisplay ? (
                          <span className="inline-flex items-center rounded-full bg-black/20 px-3 py-1 text-[11px] font-extrabold text-white">
                            Profil masqué
                          </span>
                        ) : !displayPerson.canDisplayName ||
                          !displayPerson.canDisplayPhoto ||
                          !displayPerson.canDisplayInfo ? (
                          <span className="inline-flex items-center rounded-full bg-black/20 px-3 py-1 text-[11px] font-extrabold text-white">
                            Profil partiellement masqué
                          </span>
                        ) : null}

                        {visibleOtherBranches.map((branch) => (
                          <span
                            key={branch.id}
                            className={[
                              "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold",
                              branch.chipClassName,
                            ].join(" ")}
                          >
                            <Plus size={14} />
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-1 text-[26px] font-black leading-[1.02] tracking-tight">
                      {displayPerson.firstName} {displayPerson.lastName}
                    </div>

                    {displayPerson.nickname ? (
                      <div className="mb-2 mt-2 text-[20px] font-black leading-[1.02] tracking-tight">
                        {displayPerson.sex === "F" ? "appelée" : "appelé"}{" "}
                        {displayPerson.nickname}
                      </div>
                    ) : null}

                    {centerYears ? (
                      <div className="mt-2 text-[13px] font-extrabold text-white/90">
                        {centerYears}
                      </div>
                    ) : null}

                    {centerPath ? (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[11px] font-extrabold text-white/90">
                        <MapPin size={12} />
                        {centerPath}
                      </div>
                    ) : null}
                  </button>
                </div>
              </div>
            </section>

            {centerId !== rootHonoredPersonId ? (
              <div className="mt-4">
                <div className="mt-2 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-2 text-sm font-black text-slate-900">
                    <Heart
                      size={16}
                      className="mt-[2px] shrink-0 text-indigo-600"
                    />
                    <div>
                      <div className="text-slate-900">
                        {relationshipSummary}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <section className="mb-4 mt-3 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Réagir
                </div>

                {displayPerson.canDisplay ? (
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                    <button
                      type="button"
                      onClick={() => setPanelMode("memories")}
                      className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 transition ${
                        panelMode === "memories"
                          ? "bg-slate-900 text-white"
                          : "text-slate-500"
                      }`}
                    >
                      <MessageCircle size={20} />
                      {memoriesCount}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPanelMode("photos")}
                      className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 transition ${
                        panelMode === "photos"
                          ? "bg-slate-900 text-white"
                          : "text-slate-500"
                      }`}
                    >
                      <Camera size={20} />
                      {photosCount}
                    </button>

                    <span className="inline-flex items-center gap-1">
                      <Heart
                        size={20}
                        className={`transition ${
                          reactionsCount > 0
                            ? "text-red-500 scale-110"
                            : "text-slate-400"
                        }`}
                        fill={reactionsCount > 0 ? "currentColor" : "none"}
                      />
                      {reactionsCount}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {!displayPerson.canDisplay ? (
                  <>
                    <div className="flex w-full flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void (hasPendingClaimForCurrentPerson
                            ? handleCancelIdentityClaim()
                            : handleSetAsMe())
                        }
                        disabled={isSavingIdentityClaim}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
                          isApprovedClaimForCurrentPerson
                            ? "bg-indigo-600 text-white"
                            : hasPendingClaimForCurrentPerson
                              ? "bg-amber-100 text-amber-900"
                              : "bg-slate-100 text-slate-700"
                        } ${isSavingIdentityClaim ? "opacity-70" : ""}`}
                      >
                        <UserCheck
                          size={14}
                          className={`transition ${
                            isSavingIdentityClaim
                              ? "animate-pulse"
                              : isApprovedClaimForCurrentPerson
                                ? "scale-110"
                                : ""
                          }`}
                        />
                        {isSavingIdentityClaim
                          ? "Vérification en cours..."
                          : isApprovedClaimForCurrentPerson
                            ? "C'est moi !"
                            : hasPendingClaimForCurrentPerson
                              ? "Finalement, je ne pense pas que c'est moi."
                              : "Je pense que c'est moi !"}
                      </button>
                    </div>

                    <div className="flex w-full flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleRequestDisplay()}
                        disabled={isSavingVisibilityRequest}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
                          hasPendingVisibilityRequestForCurrentPerson
                            ? "bg-amber-100 text-amber-900"
                            : hasRejectedVisibilityRequestForCurrentPerson
                              ? "bg-rose-100 text-rose-900"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <Eye size={14} />
                        {hasPendingVisibilityRequestForCurrentPerson
                          ? "Annuler ma demande d’affichage pour cette personne"
                          : hasRejectedVisibilityRequestForCurrentPerson
                            ? "Redemander l’affichage de cette personne"
                            : "Demander l’affichage de cette personne"}
                      </button>

                      {hasPendingVisibilityRequestForCurrentPerson ? (
                        <div className="inline-flex items-center rounded-xl bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-900">
                          Demande d’affichage en attente de modération
                        </div>
                      ) : null}

                      {hasRejectedVisibilityRequestForCurrentPerson &&
                      myVisibilityRequestModeratorComment ? (
                        <div className="w-full rounded-[16px] border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] leading-5 text-rose-900">
                          {myVisibilityRequestModeratorComment}
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleToggleTouched()}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
                          hasTouchedPerson
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <Heart
                          size={14}
                          className={`transition ${
                            hasTouchedPerson ? "text-red-300 scale-110" : ""
                          }`}
                          fill={hasTouchedPerson ? "currentColor" : "none"}
                        />
                        J'aime
                      </button>

                      {displayPerson.isPossiblyAlive ? (
                        <button
                          type="button"
                          onClick={() =>
                            void (hasPendingClaimForCurrentPerson
                              ? handleCancelIdentityClaim()
                              : handleSetAsMe())
                          }
                          disabled={isSavingIdentityClaim}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
                            isApprovedClaimForCurrentPerson
                              ? "bg-indigo-600 text-white"
                              : hasPendingClaimForCurrentPerson
                                ? "bg-amber-100 text-amber-900"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <UserCheck
                            size={14}
                            className={`transition ${
                              isApprovedClaimForCurrentPerson ? "scale-110" : ""
                            }`}
                          />
                          {isApprovedClaimForCurrentPerson
                            ? "C'est moi !"
                            : hasPendingClaimForCurrentPerson
                              ? "Finalement, je ne pense pas que c'est moi."
                              : "Je pense que c'est moi !"}
                        </button>
                      ) : null}
                    </div>

                    {!isApprovedClaimForCurrentPerson ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleToggleKnown()}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
                            hasKnownPerson
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <UserCheck size={14} />
                          {knowLabel}
                          {knownCount > 0 && (
                            <ReactionCountBadge
                              count={knownCount}
                              active={hasKnownPerson}
                            />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleToggleHeard()}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
                            hasHeardOfPerson
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <Megaphone size={14} />
                          {heardLabel}
                          {heardCount > 0 && (
                            <ReactionCountBadge
                              count={heardCount}
                              active={hasHeardOfPerson}
                            />
                          )}
                        </button>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPanelMode("memory_editor")}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
                          panelMode === "memory_editor"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <MessageCircle size={14} />
                        {hasMyComment
                          ? "Modifier le souvenir que j’ai partagé"
                          : "Partager un souvenir sur cette personne"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPanelMode("photo_upload")}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
                          panelMode === "photo_upload"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <Camera size={14} />
                        {photoLabel}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>

            {panelMode === "relations" ? (
              <>
                <FamilyRelationsSection
                  headerClassName={heroConfig.headerClassName}
                  openSections={openSections}
                  onToggle={toggleSection}
                  onSelect={goToPerson}
                  labelSpouses={labelSpouses}
                  labelChildren={labelChildren}
                  labelSiblings={labelSiblings}
                  parents={displayParents}
                  spouses={displaySpouses}
                  children={displayChildren}
                  siblings={displaySiblings}
                  grandparents={displayGrandparents}
                />

                <section className="mb-4 mt-3 rounded-[24px] border border-slate-300 bg-slate-900 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                  <div className="px-2 pb-1 pt-1">
                    <div className="text-[18px] font-black text-white">
                      Navigation
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3">
                    {centerId !== rootHonoredPersonId ? (
                      <button
                        type="button"
                        onClick={recenterOnRoot}
                        className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] active:shadow-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                            <Heart size={20} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-[16px] font-black text-slate-900">
                              Centrer sur Gromèr {rootPerson.firstName}
                            </div>
                          </div>

                          <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
                            <ArrowRight size={18} />
                          </div>
                        </div>
                      </button>
                    ) : null}

                    {sourcePersonId && centerId !== sourcePersonId ? (
                      <button
                        type="button"
                        onClick={recenterOnSource}
                        className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] active:shadow-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                            <UserCircle2 size={20} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-[16px] font-black text-slate-900">
                              Centrer sur moi
                            </div>
                          </div>

                          <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
                            <ArrowRight size={18} />
                          </div>
                        </div>
                      </button>
                    ) : null}
                  </div>
                </section>
              </>
            ) : panelMode === "memories" ? (
              <PersonMemoriesPanel
                memories={approvedMemories}
                pendingMemory={
                  myMemoryStatus === "pending" && memoryDraft.trim()
                    ? { content: memoryDraft }
                    : null
                }
                onBack={() => setPanelMode("relations")}
              />
            ) : panelMode === "memory_editor" ? (
              <PersonMemoryEditorPanel
                personDisplayName={personDisplayName}
                initialValue={memoryDraft}
                moderationStatus={myMemoryStatus}
                moderatorComment={myMemoryModeratorComment}
                isSaving={isSavingMemory}
                onChange={setMemoryDraft}
                onSave={() => void handleSaveMemory()}
                onBack={() => setPanelMode("relations")}
              />
            ) : panelMode === "photo_upload" ? (
              <PersonPhotoUploadPanel
                personDisplayName={personDisplayName}
                isSubmitting={isUploadingPhoto}
                onSelectFile={(file) => void handleUploadPhoto(file)}
                onBack={() => setPanelMode("relations")}
              />
            ) : (
              <PersonPhotosPanel
                photos={approvedPhotos}
                onBack={() => setPanelMode("relations")}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
