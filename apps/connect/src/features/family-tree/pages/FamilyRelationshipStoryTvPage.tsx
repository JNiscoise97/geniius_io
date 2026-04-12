import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ListTree,
  Loader2,
  Monitor,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";

import { getFamilyTreeEffectiveVisibilityMap } from "../data/visibility/getFamilyTreeEffectiveVisibilityMap";
import { getMyPersonIdentityClaim } from "../data/identity/getMyPersonIdentityClaim";
import { getParticipantDefaultGedcomPersonId } from "../data/profiles/getParticipantDefaultGedcomPersonId";
import { getMergedPersonOverridesMap } from "../data/profiles/getMergedPersonOverridesMap";

import { buildRelationshipStory } from "../domain/story/buildRelationshipStory";
import { FAMILY_GRAPH } from "../api/loadGraph";
import { RELATIONSHIP_STORY_DEFAULT_SOURCE_ID } from "../config/relationshipStoryConfig";

import type { PersonUiOverride } from "../data/profiles/uiOverrides";
import type { PersonVisibilityPreferenceMap } from "../types/visibility";
import { formatPersonName, formatYears } from "../domain/graph/genealogyUi";

type IdentityClaimStatus = "pending" | "approved" | "rejected" | null;

function normalizePersonId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function PersonPhoto({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="h-20 w-20 shrink-0 rounded-[22px] object-cover"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[22px] bg-slate-100 text-slate-400">
      <span className="text-3xl font-black">?</span>
    </div>
  );
}

function StoryGenerationCard({
  index,
  isActive,
  name,
  years,
  photoSrc,
  onClick,
}: {
  index: number;
  isActive: boolean;
  name: string;
  years: string | null;
  photoSrc?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-[28px] border bg-white px-6 py-5 text-left shadow-sm transition",
        isActive
          ? "border-slate-900 ring-2 ring-slate-200"
          : "border-slate-200 hover:border-slate-300",
      ].join(" ")}
    >
      <div className="flex items-center gap-5">
        <PersonPhoto src={photoSrc} alt={name} />

        <div className="min-w-0 flex-1">
          <div className="text-[18px] font-black uppercase tracking-wide text-slate-500">
            Génération {index + 1}
          </div>

          <div className="mt-1 text-[38px] font-black leading-tight tracking-tight text-slate-950">
            {name}
          </div>

          {years ? (
            <div className="mt-2 text-[26px] font-bold text-slate-700">
              {years}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export function FamilyRelationshipStoryTvPage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const [searchParams] = useSearchParams();

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const [claimedPersonId, setClaimedPersonId] = useState<string | null>(null);
  const [myIdentityClaimStatus, setMyIdentityClaimStatus] =
    useState<IdentityClaimStatus>(null);
  const [defaultGedcomPersonId, setDefaultGedcomPersonId] = useState<string | null>(null);
  const [visibilityPreferencesByPersonId, setVisibilityPreferencesByPersonId] =
    useState<PersonVisibilityPreferenceMap>({});
  const [identityContextLoading, setIdentityContextLoading] = useState(true);

  const [overridesByPersonId, setOverridesByPersonId] = useState<
    Record<string, PersonUiOverride>
  >({});

  const [currentIndex, setCurrentIndex] = useState(0);

  const sourcePersonId =
    myIdentityClaimStatus === "approved" && claimedPersonId
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

        setClaimedPersonId(normalizePersonId(identityClaim?.person_id ?? null));
        setMyIdentityClaimStatus(identityClaim?.claim_status ?? null);
        setDefaultGedcomPersonId(normalizePersonId(defaultPersonId));
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

    return buildRelationshipStory(FAMILY_GRAPH, sourceId, targetId, {
      visibilityPreferencesByPersonId,
      sosaReferencePersonId,
      overridesByPersonId,
    });
  }, [
    sourceId,
    targetId,
    visibilityPreferencesByPersonId,
    sosaReferencePersonId,
    overridesByPersonId,
  ]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [sourceId, targetId]);

  useEffect(() => {
    if (!participantId) return;

    const tracker = createPageTimeTracker({
      participantId,
      eventSlug: slug,
      pageKey: `/e/${slug}/family-tree/story-tv`,
    });

    tracker.start();

    return () => {
      void tracker.stop();
    };
  }, [participantId, slug]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!story) return;

      if (event.key === "Escape") {
        navigate(`/e/${slug}/family-tree`);
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        setCurrentIndex((prev) => Math.min(prev + 1, story.steps.length - 1));
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }

      if (event.key === "Enter") {
        const step = story.steps[currentIndex];
        if (!step) return;

        navigate(
          `/e/${slug}/family-tree/browse?personId=${encodeURIComponent(step.person.id)}`,
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, navigate, slug, story]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [currentIndex]);

  if (identityContextLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <main className="mx-auto max-w-[1400px] px-8 pb-12 pt-8">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="inline-flex items-center gap-3 text-xl font-bold text-slate-700">
              <Loader2 className="h-6 w-6 animate-spin" />
              Chargement de l’histoire familiale…
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!story || !targetId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <main className="mx-auto max-w-[1400px] px-8 pb-12 pt-8">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-[34px] font-black tracking-tight text-slate-900">
              Histoire familiale indisponible
            </div>
            <p className="mt-3 text-xl leading-9 text-slate-600">
              Impossible de construire l’histoire familiale entre ces deux personnes.
            </p>
          </section>
        </main>
      </div>
    );
  }

  const currentStep = story.steps[currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <main className="mx-auto max-w-[1400px] px-8 pb-12 pt-8">
        <section className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Monitor size={26} />
              </div>

              <div>
                <div className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Histoire familiale
                </div>
                <div className="text-[22px] font-black text-slate-900">
                  Version rétroprojecteur
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/e/${slug}/family-tree/browse?personId=${encodeURIComponent(currentStep.person.id)}`,
                  )
                }
                className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-800 shadow-sm"
              >
                <ListTree size={18} />
                Voir dans l’arbre
              </button>

              <button
                type="button"
                onClick={() => navigate(`/e/${slug}/family-tree`)}
                className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-800 shadow-sm"
              >
                <ArrowLeft size={18} />
                Retour
              </button>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-500">
            Histoire familiale
          </div>

          <div className="mt-2 text-[46px] font-black leading-tight tracking-tight text-slate-950">
            De Gromèr Covindou à toi
          </div>

          <p className="mt-3 text-[24px] font-semibold leading-9 text-slate-600">
            Voici la synthèse du lien familial entre ces deux personnes.
          </p>
        </section>

        <section className="mb-5 flex items-center justify-between rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-3 rounded-2xl bg-slate-100 px-5 py-3 text-lg font-black text-slate-900 disabled:opacity-40"
          >
            <ChevronUp size={20} />
            Précédent
          </button>

          <div className="text-[22px] font-black text-slate-800">
            Génération {currentIndex + 1} sur {story.steps.length}
          </div>

          <button
            type="button"
            onClick={() =>
              setCurrentIndex((prev) => Math.min(prev + 1, story.steps.length - 1))
            }
            disabled={currentIndex === story.steps.length - 1}
            className="inline-flex items-center gap-3 rounded-2xl bg-slate-100 px-5 py-3 text-lg font-black text-slate-900 disabled:opacity-40"
          >
            Suivant
            <ChevronDown size={20} />
          </button>
        </section>

        <section className="space-y-4">
          {story.steps.map((step, index) => (
            <StoryGenerationCard
              key={step.person.id}
              index={index}
              isActive={index === currentIndex}
              name={formatPersonName(step.person)}
              years={formatYears(step.person)}
              photoSrc={step.person.photoSrc}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </section>
      </main>
    </div>
  );
}