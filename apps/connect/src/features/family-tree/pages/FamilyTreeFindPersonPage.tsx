import { ArrowLeft, Lock, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import { ROOT_HONORED_PERSON_ID } from "../../../config/eventInfos";
import { buildFamilySearchIndex } from "../api/buildFamilySearchIndex";
import {
  findRelationshipPath,
  type RelationshipEdgeType,
  type RelationshipPathNode,
} from "../api/findRelationshipPath";
import { getMyPersonIdentityClaim } from "../api/getMyPersonIdentityClaim";
import { getParticipantDefaultGedcomPersonId } from "../api/getParticipantDefaultGedcomPersonId";
import { FAMILY_GRAPH } from "../api/loadGraph";
import { searchPeople } from "../api/searchPeople";
import { FamilySearchInput } from "../components/FamilySearchInput";
import { FamilySearchResultCard } from "../components/FamilySearchResultCard";
import {
  FAMILY_SEARCH_DEFAULT_LIMIT,
  FAMILY_SEARCH_EMPTY_MESSAGE,
  FAMILY_SEARCH_HINT,
  FAMILY_SEARCH_MIN_QUERY_LENGTH,
  FAMILY_SEARCH_NO_RESULT_MESSAGE,
  FAMILY_SEARCH_RECENT_LIMIT,
  FAMILY_SEARCH_SHORT_QUERY_MESSAGE,
} from "../config/familySearchConfig";
import { getPersonContext } from "../config/configGenealogy";
import {
  getRecentFamilySearches,
  pushRecentFamilySearch,
} from "../lib/familySearchRecent";
import type { PersonSummary, PersonVisibilityPreferenceMap } from "../types";
import { getFamilyTreeEffectiveVisibilityMap } from "../api/getFamilyTreeEffectiveVisibilityMap";

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

function summarizeRelationshipPath(
  path: RelationshipPathNode[] | null,
  sourceDisplayName: string,
  targetSex?: string,
) {
  if (!path) return undefined;

  if (path.length === 1) {
    return `Tu es actuellement centré sur ${sourceDisplayName}.`;
  }

  const moves = path
    .slice(1)
    .map((node) => node.via)
    .filter((via): via is RelationshipEdgeType => Boolean(via));

  const upCount = moves.filter((via) => via === "parent").length;
  const downCount = moves.filter((via) => via === "child").length;
  const spouseCount = moves.filter((via) => via === "spouse").length;

  if (spouseCount === 0 && upCount > 0 && downCount === 0) {
    return `Cette personne est ${getAncestorLabel(upCount, targetSex)} de ${sourceDisplayName}.`;
  }

  if (spouseCount === 0 && downCount > 0 && upCount === 0) {
    return `Cette personne est ${getDescendantLabel(downCount, targetSex)} de ${sourceDisplayName}.`;
  }

  if (spouseCount === 0 && isSiblingLinePattern(moves)) {
    const level = moves.length - 2;
    return `Cette personne est ${getSiblingDescendantLabel(level, targetSex)} de ${sourceDisplayName}.`;
  }

  if (spouseCount > 0) {
    return `Le lien avec ${sourceDisplayName} passe par une alliance.`;
  }

  return `Voici le chemin familial le plus court depuis ${sourceDisplayName}.`;
}

function getDisplaySearchPerson(
  person: PersonSummary,
  forceDisplayedPersonIds: string[],
): PersonSummary {
  if (forceDisplayedPersonIds.includes(person.id)) {
    return person;
  }

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
      person.canDisplay && person.canDisplayName
        ? person.lastName
        : "privée",
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

export function FamilyTreeFindPersonPage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const [searchParams] = useSearchParams();
  const centerId = searchParams.get("centerId") ?? ROOT_HONORED_PERSON_ID;

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [defaultGedcomPersonId, setDefaultGedcomPersonId] = useState<
    string | null
  >(null);
  const [defaultGedcomPersonLoading, setDefaultGedcomPersonLoading] =
    useState(false);

  const [claimedPersonId, setClaimedPersonId] = useState<string | null>(null);
  const [myIdentityClaimStatus, setMyIdentityClaimStatus] = useState<
    "pending" | "approved" | "rejected" | "auto_verified" | null
  >(null);

  const [visibilityPreferencesByPersonId, setVisibilityPreferencesByPersonId] =
    useState<PersonVisibilityPreferenceMap>({});
  const [visibilityPreferencesLoading, setVisibilityPreferencesLoading] =
    useState(true);

  const forceDisplayedPersonIds = useMemo(() => {
    const ids: string[] = [];

    if (
      claimedPersonId &&
      (myIdentityClaimStatus === "approved" ||
        myIdentityClaimStatus === "auto_verified")
    ) {
      ids.push(claimedPersonId);
    }

    return ids;
  }, [claimedPersonId, myIdentityClaimStatus]);

  const searchIndex = useMemo(() => {
    return buildFamilySearchIndex(FAMILY_GRAPH, visibilityPreferencesByPersonId);
  }, [visibilityPreferencesByPersonId]);

  useEffect(() => {
    async function loadVisibilityPreferencesMap() {
      try {
        setVisibilityPreferencesLoading(true);

        const map = await getFamilyTreeEffectiveVisibilityMap({
          eventSlug: slug,
        });

        setVisibilityPreferencesByPersonId(map);
      } catch (error) {
        console.error(error);
        setVisibilityPreferencesByPersonId({});
      } finally {
        setVisibilityPreferencesLoading(false);
      }
    }

    void loadVisibilityPreferencesMap();
  }, [slug]);

  useEffect(() => {
    if (!participantId) return;

    const tracker = createPageTimeTracker({
      participantId,
      eventSlug: slug,
      pageKey: `/e/${slug}/familyTree/find-person`,
    });

    tracker.start();

    return () => {
      void tracker.stop();
    };
  }, [participantId, slug]);

  useEffect(() => {
    setRecentIds(
      getRecentFamilySearches(slug, FAMILY_SEARCH_RECENT_LIMIT).map(
        (entry) => entry.personId,
      ),
    );
  }, [slug]);

  useEffect(() => {
    async function loadMyIdentityClaim() {
      if (!participantId) {
        setClaimedPersonId(null);
        setMyIdentityClaimStatus(null);
        return;
      }

      try {
        const claim = await getMyPersonIdentityClaim({
          eventSlug: slug,
          participantId,
        });

        setClaimedPersonId(claim?.person_id ?? null);
        setMyIdentityClaimStatus(claim?.claim_status ?? null);
      } catch (error) {
        console.error(error);
        setClaimedPersonId(null);
        setMyIdentityClaimStatus(null);
      }
    }

    void loadMyIdentityClaim();
  }, [participantId, slug]);

  useEffect(() => {
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

    void loadDefaultGedcomPersonId();
  }, [participantId, slug]);

  const trimmedQuery = query.trim();
  const trimmedDebouncedQuery = debouncedQuery.trim();
  const isTyping = trimmedQuery !== trimmedDebouncedQuery;
  const canSearchInTree = Boolean(defaultGedcomPersonId);

  const results = useMemo(() => {
    if (!canSearchInTree) return [];
    if (visibilityPreferencesLoading) return [];

    if (trimmedDebouncedQuery.length < FAMILY_SEARCH_MIN_QUERY_LENGTH) {
      return [];
    }

    return searchPeople({
      query: trimmedDebouncedQuery,
      documents: searchIndex,
      graph: FAMILY_GRAPH,
      centerPersonId: centerId,
      limit: FAMILY_SEARCH_DEFAULT_LIMIT,
      forceDisplayedPersonIds,
    });
  }, [
    canSearchInTree,
    visibilityPreferencesLoading,
    trimmedDebouncedQuery,
    searchIndex,
    centerId,
    forceDisplayedPersonIds,
  ]);

  const enrichedResults = useMemo(() => {
    return results.map((result) => {
      const rawPerson = getPersonContext(
        result.personId,
        visibilityPreferencesByPersonId,
      ).person;

      const person = getDisplaySearchPerson(rawPerson, forceDisplayedPersonIds);
      const source = getPersonContext(
        centerId,
        visibilityPreferencesByPersonId,
      ).person;

      const path = findRelationshipPath(FAMILY_GRAPH, centerId, result.personId);
      const relationshipSummary = summarizeRelationshipPath(
        path,
        `${source.firstName} ${source.lastName}`.trim(),
        rawPerson.sex,
      );

    if (result.personId === "7351") {
      console.log("rawPerson flags", {
        canDisplay: rawPerson.canDisplay,
        canDisplayName: rawPerson.canDisplayName,
        canDisplayPhoto: rawPerson.canDisplayPhoto,
        canDisplayInfo: rawPerson.canDisplayInfo,
      });
      console.log("rawPerson", rawPerson);
  console.log("displayedPerson", person);
  console.log("relationshipSummary", relationshipSummary);
    }
    console.log("forceDisplayedPersonIds", forceDisplayedPersonIds);

      return {
        person,
        score: result.score,
        matchedOn: result.matchedOn,
        relationshipSummary,
      };
    });
  }, [
    results,
    centerId,
    forceDisplayedPersonIds,
    visibilityPreferencesByPersonId,
  ]);

  const recentPersons = useMemo(() => {
    return recentIds
      .map((personId) => {
        try {
          return getPersonContext(
            personId,
            visibilityPreferencesByPersonId,
          ).person;
        } catch {
          return null;
        }
      })
      .filter((person): person is PersonSummary => {
        if (!person) return false;
        if (person.canDisplay) return true;
        return forceDisplayedPersonIds.includes(person.id);
      })
      .map((person) => getDisplaySearchPerson(person, forceDisplayedPersonIds));
  }, [recentIds, forceDisplayedPersonIds, visibilityPreferencesByPersonId]);

  function handleCenterPerson(personId: string) {
    pushRecentFamilySearch(slug, personId, FAMILY_SEARCH_RECENT_LIMIT);
    navigate(
      `/e/${slug}/family-tree/browse?personId=${encodeURIComponent(personId)}`,
    );
  }

  function openFamilyKnowledge() {
    navigate(`/e/${slug}/family-knowledge`);
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-3">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
                <Search size={14} />
                Recherche dans l’arbre
              </div>

              <h1 className="mt-4 text-[28px] font-black leading-[1.05] tracking-tight text-slate-900">
                Trouver une personne
              </h1>

              <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
                Retrouve rapidement un individu puis recentre l’arbre sur lui.
              </p>
            </div>

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

        {!defaultGedcomPersonLoading && !canSearchInTree ? (
          <section className="mt-4 space-y-3">
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-amber-900">
                    La recherche n’est pas encore disponible pour toi
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
        ) : null}

        {!defaultGedcomPersonLoading && canSearchInTree ? (
          <>
            <section className="mt-3 space-y-3">
              <FamilySearchInput
                value={query}
                placeholder={FAMILY_SEARCH_HINT}
                onChange={setQuery}
                onClear={() => setQuery("")}
              />
            </section>

            {!trimmedQuery ? (
              <section className="mt-4 space-y-3">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-bold text-slate-600">
                    {FAMILY_SEARCH_EMPTY_MESSAGE}
                  </div>
                </div>

                <div className="mt-4 rounded-[20px] border border-indigo-200 bg-indigo-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-indigo-950">
                        Certaines personnes n’apparaissent pas dans la recherche
                      </div>
                      <div className="mt-1 text-xs leading-5 text-indigo-900">
                        Une identité est considérée comme privée lorsque la
                        personne concernée n’a pas elle-même consenti à
                        apparaître dans l’arbre généalogique de cette
                        application. Ces profils sont donc exclus des résultats
                        de recherche.
                      </div>
                    </div>
                  </div>
                </div>

                {recentPersons.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                      Recherches récentes
                    </div>

                    {recentPersons.map((person) => (
                      <FamilySearchResultCard
                        key={person.id}
                        person={person}
                        onCenter={() => handleCenterPerson(person.id)}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            ) : trimmedQuery.length < FAMILY_SEARCH_MIN_QUERY_LENGTH ? (
              <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 text-sm font-bold text-slate-600 shadow-sm">
                {FAMILY_SEARCH_SHORT_QUERY_MESSAGE}
              </section>
            ) : isTyping || visibilityPreferencesLoading ? (
              <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 text-sm font-bold text-slate-600 shadow-sm">
                Recherche en cours…
              </section>
            ) : enrichedResults.length === 0 ? (
              <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 text-sm font-bold text-slate-600 shadow-sm">
                {FAMILY_SEARCH_NO_RESULT_MESSAGE}
              </section>
            ) : (
              <section className="mt-4 space-y-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  Résultats ({enrichedResults.length})
                </div>

                {enrichedResults.map((result) => (
                  <FamilySearchResultCard
                    key={result.person.id}
                    person={result.person}
                    relationshipSummary={result.relationshipSummary}
                    onCenter={() => handleCenterPerson(result.person.id)}
                  />
                ))}
              </section>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}