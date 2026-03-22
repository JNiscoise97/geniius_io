// src/features/family-tree/pages/FamilyRelationshipStoryPage.tsx

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ListTree,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";

import { getFamilyTreeEffectiveVisibilityMap } from "../api/getFamilyTreeEffectiveVisibilityMap";
import { getMyPersonIdentityClaim } from "../api/getMyPersonIdentityClaim";
import { getParticipantDefaultGedcomPersonId } from "../api/getParticipantDefaultGedcomPersonId";
import { buildRelationshipStory } from "../api/buildRelationshipStory";
import { FAMILY_GRAPH } from "../api/loadGraph";

import { getPersonHeroConfig } from "../config/configGenealogy";
import { RELATIONSHIP_STORY_DEFAULT_SOURCE_ID } from "../config/relationshipStoryConfig";

import { RelationshipStoryProgress } from "../components/RelationshipStoryProgress";
import { RelationshipStoryStepView } from "../components/RelationshipStoryStepView";
import { RelationshipStorySummaryView } from "../components/RelationshipStorySummaryView";

import type { PersonVisibilityPreferenceMap } from "../types";
import type { PersonUiOverride } from "../api/uiOverrides";
import { getMergedPersonOverridesMap } from "../api/getMergedPersonOverridesMap";

type IdentityClaimStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "auto_verified"
  | null;

export function FamilyRelationshipStoryPage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const [searchParams] = useSearchParams();

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const [claimedPersonId, setClaimedPersonId] = useState<string | null>(null);
  const [myIdentityClaimStatus, setMyIdentityClaimStatus] =
    useState<IdentityClaimStatus>(null);
  const [defaultGedcomPersonId, setDefaultGedcomPersonId] = useState<
    string | null
  >(null);
  const [visibilityPreferencesByPersonId, setVisibilityPreferencesByPersonId] =
    useState<PersonVisibilityPreferenceMap>({});
  const [identityContextLoading, setIdentityContextLoading] = useState(true);

  const [overridesByPersonId, setOverridesByPersonId] = useState<
  Record<string, PersonUiOverride>
>({});

  const sourcePersonId =
    myIdentityClaimStatus === "approved" ||
    myIdentityClaimStatus === "auto_verified"
      ? claimedPersonId
      : null;

  const sosaReferencePersonId = sourcePersonId ?? defaultGedcomPersonId ?? null;

  const sourceId =
    searchParams.get("from") ?? RELATIONSHIP_STORY_DEFAULT_SOURCE_ID;

  const targetId =
    searchParams.get("to") ?? sourcePersonId ?? defaultGedcomPersonId ?? null;

  useEffect(() => {
    if (!participantId) {
      setClaimedPersonId(null);
      setMyIdentityClaimStatus(null);
      setDefaultGedcomPersonId(null);
      setVisibilityPreferencesByPersonId({});
      setIdentityContextLoading(false);
      return;
    }

    let isCancelled = false;

    async function loadIdentityContext(currentParticipantId: string) {
      try {
        setIdentityContextLoading(true);

        const [identityClaim, defaultPersonId, visibilityMap, mergedOverrides] =
          await Promise.all([
            getMyPersonIdentityClaim({
              eventSlug: slug,
              participantId: currentParticipantId,
            }),
            getParticipantDefaultGedcomPersonId({
              eventSlug: slug,
              participantId: currentParticipantId,
            }),
            getFamilyTreeEffectiveVisibilityMap({
              eventSlug: slug,
            }),
            getMergedPersonOverridesMap(slug),
          ]);

        if (isCancelled) return;

        setClaimedPersonId(identityClaim?.person_id ?? null);
        setMyIdentityClaimStatus(identityClaim?.claim_status ?? null);
        setDefaultGedcomPersonId(defaultPersonId?.trim() ? defaultPersonId : null);
        setVisibilityPreferencesByPersonId(visibilityMap);
        setOverridesByPersonId(mergedOverrides);
      } catch (error) {
        if (!isCancelled) {
          console.error(error);
          setClaimedPersonId(null);
          setMyIdentityClaimStatus(null);
          setDefaultGedcomPersonId(null);
          setVisibilityPreferencesByPersonId({});
          setOverridesByPersonId({});
        }
      } finally {
        if (!isCancelled) {
          setIdentityContextLoading(false);
        }
      }
    }

    void loadIdentityContext(participantId);

    return () => {
      isCancelled = true;
    };
  }, [participantId, slug]);

  const story = useMemo(() => {
    if (!sourceId || !targetId) return null;
    console.log("buildRelationshipStory",buildRelationshipStory(FAMILY_GRAPH, sourceId, targetId, {
      visibilityPreferencesByPersonId,
      sosaReferencePersonId,
      overridesByPersonId
    }))
    return buildRelationshipStory(FAMILY_GRAPH, sourceId, targetId, {
      visibilityPreferencesByPersonId,
      sosaReferencePersonId,
      overridesByPersonId
    });
  }, [sourceId, targetId, visibilityPreferencesByPersonId, sosaReferencePersonId, overridesByPersonId]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [sourceId, targetId]);

  useEffect(() => {
    if (!participantId) return;

    const tracker = createPageTimeTracker({
      participantId,
      eventSlug: slug,
      pageKey: `/e/${slug}/family-tree/story`,
    });

    tracker.start();

    return () => {
      void tracker.stop();
    };
  }, [participantId, slug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [currentIndex]);

  if (identityContextLoading) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pb-24 pt-3">
          <button
            type="button"
            onClick={() => navigate(`/e/${slug}/family-tree`)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
          >
            <ArrowLeft size={14} />
            Retour
          </button>

          <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement de l’histoire familiale…
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!story || !targetId) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pb-24 pt-3">
          <button
            type="button"
            onClick={() => navigate(`/e/${slug}/family-tree`)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
          >
            <ArrowLeft size={14} />
            Retour
          </button>

          <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-lg font-black text-slate-900">
              Histoire familiale indisponible
            </div>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              Impossible de construire l’histoire familiale entre ces deux
              personnes.
            </p>
          </section>
        </main>
      </div>
    );
  }

  const storyData = story;

  const heroConfig = getPersonHeroConfig(
    sourceId,
    visibilityPreferencesByPersonId,
    sosaReferencePersonId,
    overridesByPersonId
  );

  const showButtonVoirDansArbre = false;
  const showSummaryOnly = true;

  const totalScreens = showSummaryOnly ? 1 : storyData.steps.length + 1;
  const isSummary = showSummaryOnly || currentIndex === storyData.steps.length;
  const currentStep =
    !showSummaryOnly && !isSummary ? storyData.steps[currentIndex] : null;

  function goPrevious() {
    if (showSummaryOnly) return;
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }

  function goNext() {
    if (showSummaryOnly) return;
    setCurrentIndex((prev) => Math.min(prev + 1, totalScreens - 1));
  }

  function goToSummary() {
    if (showSummaryOnly) return;
    setCurrentIndex(storyData.steps.length);
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-3">
        <section>
          <div className="flex items-start justify-end gap-3">
            {showButtonVoirDansArbre && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/e/${slug}/family-tree/browse?personId=${encodeURIComponent(
                      targetId,
                    )}`,
                  )
                }
                className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <ListTree size={14} />
                  Voir dans l’arbre
                </span>
              </button>
            )}

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

        <section className="mb-4 mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            <BookOpen size={14} />
            Histoire familiale
          </div>

          <div className="mt-2 text-[20px] font-black leading-tight text-slate-900">
            De Gromèr {storyData.source.firstName} à toi
          </div>

          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
            {showSummaryOnly
              ? "Voici la synthèse du lien familial entre ces deux personnes."
              : "Avance génération par génération pour suivre le fil qui relie ces deux personnes."}
          </p>
        </section>

        {!showSummaryOnly ? (
          <RelationshipStoryProgress
            currentIndex={currentIndex}
            total={totalScreens}
          />
        ) : null}

        <div className="mt-4">
          {isSummary ? (
            <RelationshipStorySummaryView
              story={storyData}
              heroClassName={heroConfig.heroClassName}
              showDetails={false}
              onSelectStep={
                showSummaryOnly
                  ? undefined
                  : (index) => setCurrentIndex(index)
              }
            />
          ) : currentStep ? (
            <RelationshipStoryStepView
              step={currentStep}
              heroClassName={heroConfig.heroClassName}
            />
          ) : null}
        </div>

        {!showSummaryOnly ? (
          <section className="sticky bottom-3 mt-5">
            <div className="rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-[0_18px_30px_rgba(15,23,42,0.12)] backdrop-blur">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={goPrevious}
                  disabled={currentIndex === 0}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-900 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Précédent
                </button>

                {!isSummary ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex flex-[1.3] items-center justify-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white"
                  >
                    {currentIndex === storyData.steps.length - 1
                      ? "Voir la synthèse"
                      : "Suivant"}
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(0)}
                    className="inline-flex flex-[1.3] items-center justify-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white"
                  >
                    Rejouer l’histoire
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>

              {!isSummary && storyData.steps.length > 1 ? (
                <button
                  type="button"
                  onClick={goToSummary}
                  className="mt-3 w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700"
                >
                  Aller directement à la synthèse
                </button>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}