import { ArrowLeft, Heart, Lock, Search, UserCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import {
    FAMILY_SEARCH_DEFAULT_LIMIT,
    FAMILY_SEARCH_EMPTY_MESSAGE,
    FAMILY_SEARCH_HINT,
    FAMILY_SEARCH_MIN_QUERY_LENGTH,
    FAMILY_SEARCH_NO_RESULT_MESSAGE,
    FAMILY_SEARCH_RECENT_LIMIT,
    FAMILY_SEARCH_SHORT_QUERY_MESSAGE,
} from "../config/familySearchConfig";
import { buildFamilySearchIndex } from "../api/buildFamilySearchIndex";
import { searchPeople } from "../api/searchPeople";
import { FAMILY_GRAPH } from "../api/loadGraph";
import { getPersonContext } from "../config/configGenealogy";
import { findRelationshipPath, type RelationshipEdgeType, type RelationshipPathNode } from "../api/findRelationshipPath";
import { FamilySearchInput } from "../components/FamilySearchInput";
import { FamilySearchResultCard } from "../components/FamilySearchResultCard";
import {
    getRecentFamilySearches,
    pushRecentFamilySearch,
} from "../lib/familySearchRecent";
import type { PersonSummary } from "../types";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";

function getAncestorLabel(level: number) {
    if (level <= 0) return "famille";
    if (level === 1) return "parent";
    if (level === 2) return "grand-parent";
    if (level === 3) return "arrière-grand-parent";
    return `${"arrière-".repeat(level - 2)}grand-parent`;
}

function getDescendantLabel(level: number) {
    if (level <= 0) return "famille";
    if (level === 1) return "enfant";
    if (level === 2) return "petit-enfant";
    if (level === 3) return "arrière-petit-enfant";
    return `${"arrière-".repeat(level - 2)}petit-enfant`;
}

function getSiblingDescendantLabel(level: number): string {
    if (level <= 0) return "frère / sœur";
    if (level === 1) return "neveu / nièce";
    if (level === 2) return "petit-neveu / petite-nièce";
    if (level === 3) return "arrière-petit-neveu / arrière-petite-nièce";
    return `${"arrière-".repeat(level - 2)}petit-neveu / petite-nièce`;
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
        return `Cette personne est un ${getAncestorLabel(upCount)} de ${sourceDisplayName}.`;
    }

    if (spouseCount === 0 && downCount > 0 && upCount === 0) {
        return `Cette personne est un ${getDescendantLabel(downCount)} de ${sourceDisplayName}.`;
    }

    if (spouseCount === 0 && isSiblingLinePattern(moves)) {
        const level = moves.length - 2;
        return `Cette personne est un ${getSiblingDescendantLabel(level)} de ${sourceDisplayName}.`;
    }

    if (spouseCount > 0) {
        return `Le lien avec ${sourceDisplayName} passe par une alliance.`;
    }

    return `Voici le chemin familial le plus court depuis ${sourceDisplayName}.`;
}
export function FamilyTreeFindPersonPage() {
    const navigate = useNavigate();
    const { eventSlug } = useParams();
    const slug = eventSlug ?? "demo";

    const participantSession = getParticipantSession(slug);
    const participantId = participantSession?.participantId ?? null;

    const [searchParams] = useSearchParams();
    const centerId = searchParams.get("centerId") ?? "7398";
    const rootHonoredPersonId = "7398";
    const sourcePersonId = "7351";

    const [query, setQuery] = useState("");
    const debouncedQuery = useDebouncedValue(query, 300);
    const [recentIds, setRecentIds] = useState<string[]>([]);

    const searchIndex = useMemo(() => buildFamilySearchIndex(FAMILY_GRAPH), []);

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

    const trimmedQuery = query.trim();
    const trimmedDebouncedQuery = debouncedQuery.trim();
    const isTyping = trimmedQuery !== trimmedDebouncedQuery;

    const results = useMemo(() => {
        if (trimmedDebouncedQuery.length < FAMILY_SEARCH_MIN_QUERY_LENGTH) return [];

        return searchPeople({
            query: trimmedDebouncedQuery,
            documents: searchIndex,
            graph: FAMILY_GRAPH,
            centerPersonId: centerId,
            limit: FAMILY_SEARCH_DEFAULT_LIMIT,
        });
    }, [trimmedDebouncedQuery, searchIndex, centerId]);

    const enrichedResults = useMemo(() => {
        return results.map((result) => {
            const person = getPersonContext(result.personId).person;
            const source = getPersonContext(centerId).person;

            const path = findRelationshipPath(FAMILY_GRAPH, centerId, result.personId);
            const relationshipSummary = summarizeRelationshipPath(
                path,
                `${source.firstName} ${source.lastName}`.trim(),
            );

            return {
                person,
                score: result.score,
                matchedOn: result.matchedOn,
                relationshipSummary,
            };
        });
    }, [results, centerId]);

    const recentPersons = useMemo(() => {
        return recentIds
            .map((personId) => {
                try {
                    return getPersonContext(personId).person;
                } catch {
                    return null;
                }
            })
            .filter((person): person is PersonSummary => Boolean(person && !person.hidden));
    }, [recentIds]);

    function handleCenterPerson(personId: string) {
        pushRecentFamilySearch(slug, personId, FAMILY_SEARCH_RECENT_LIMIT);
        navigate(`/e/${slug}/family-tree/browse?personId=${encodeURIComponent(personId)}`);
    }

    function handleOpenProfile(personId: string) {
        pushRecentFamilySearch(slug, personId, FAMILY_SEARCH_RECENT_LIMIT);
        navigate(`/e/${slug}/fiche?id=${encodeURIComponent(personId)}`);
    }

    return (
        <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
            <main className="c-container pb-24 pt-3">
                <section className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
                                <Search size={14} />
                                Recherche dans l’arbre
                            </div>

                            <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
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

                <section className="space-y-3 mt-3">
                    <FamilySearchInput
                        value={query}
                        placeholder={FAMILY_SEARCH_HINT}
                        onChange={setQuery}
                        onClear={() => setQuery("")}
                    />

                    <div className="flex flex-wrap gap-3">
                        {centerId !== rootHonoredPersonId ? (
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/e/${slug}/familyTree/browse?personId=${encodeURIComponent(rootHonoredPersonId)}`,
                                    )
                                }
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-900"
                            >
                                <Heart size={16} />
                                Revenir à Gromèr
                            </button>
                        ) : null}

                        {centerId !== sourcePersonId ? (
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/e/${slug}/family-tree/browse?personId=${encodeURIComponent(sourcePersonId)}`,
                                    )
                                }
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-900"
                            >
                                <UserCircle2 size={16} />
                                Revenir à moi
                            </button>
                        ) : null}
                    </div>
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
                                        Une identité est considérée comme privée lorsque la personne concernée
                                        n’a pas elle-même consenti à apparaître dans l’arbre généalogique de cette application.
                                        Ces profils sont donc exclus des résultats de recherche.
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
                                        onOpenProfile={() => handleOpenProfile(person.id)}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </section>
                ) : trimmedQuery.length < FAMILY_SEARCH_MIN_QUERY_LENGTH ? (
                    <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm text-sm font-bold text-slate-600">
                        {FAMILY_SEARCH_SHORT_QUERY_MESSAGE}
                    </section>
                ) : isTyping ? (
                    <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm text-sm font-bold text-slate-600">
                        Recherche en cours…
                    </section>
                ) : enrichedResults.length === 0 ? (
                    <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm text-sm font-bold text-slate-600">
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
                                onOpenProfile={() => handleOpenProfile(result.person.id)}
                            />
                        ))}
                    </section>
                )}
            </main>
        </div>
    );
}