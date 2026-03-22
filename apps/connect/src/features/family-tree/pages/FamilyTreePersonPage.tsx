import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  MapPin,
  ShieldAlert,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { SmartImage } from "../../../lib/media/useSmartImage";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";

import { getFamilyTreeEffectiveVisibilityMap } from "../api/getFamilyTreeEffectiveVisibilityMap";
import {
  getPersonParticipantProfile,
  type PersonParticipantProfile,
} from "../api/getPersonParticipantProfile";
import { FAMILY_GRAPH } from "../api/loadGraph";
import {
  getPersonContext,
  getPersonHeroConfig,
} from "../config/configGenealogy";
import type { PersonSummary, PersonVisibilityPreferenceMap } from "../types";
import { formatPlaceTransition } from "../lib/genealogyUi";
import { getMergedPersonOverridesMap } from "../api/getMergedPersonOverridesMap";
import type { PersonUiOverride } from "../api/uiOverrides";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";

function PersonVisual({ name, photoSrc }: { name: string; photoSrc?: string }) {
  if (photoSrc) {
    return (
      <div className="h-24 w-24 overflow-hidden rounded-[22px] bg-slate-100 shadow-sm">
        <SmartImage src={photoSrc} alt={name} />
      </div>
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-[22px] bg-slate-100 text-slate-600">
      <User size={24} />
    </div>
  );
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

function formatYears(person: PersonSummary) {
  const { birthYear, deathYear, isPossiblyAlive } = person;

  if (!birthYear && !deathYear) return null;
  if (birthYear && deathYear) return `${birthYear} - ${deathYear}`;
  if (!isPossiblyAlive) return `${birthYear ?? "?"} - ?`;

  return birthYear ?? "?";
}

function hasParticipantProfileContent(
  profile: PersonParticipantProfile | null,
) {
  if (!profile) return false;

  return Boolean(
    profile.city ||
    profile.occupation ||
    profile.interests ||
    profile.freeShare,
  );
}

export function FamilyTreePersonPage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const [searchParams] = useSearchParams();

  const personId = searchParams.get("id") ?? "";
  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const [visibilityPreferencesByPersonId, setVisibilityPreferencesByPersonId] =
    useState<PersonVisibilityPreferenceMap>({});
  const [participantProfile, setParticipantProfile] =
    useState<PersonParticipantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [overridesByPersonId, setOverridesByPersonId] = useState<
    Record<string, PersonUiOverride>
  >({});


  
    useEffect(() => {
      if (!participantId) return;
  
      const tracker = createPageTimeTracker({
        participantId,
        eventSlug: slug,
        pageKey: `/e/${slug}/family-tree/person?id=${personId}`,
      });
  
      tracker.start();
  
      return () => {
        void tracker.stop();
      };
    }, [participantId, slug]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setIsLoading(true);

        const [visibilityMap, personParticipantProfile, mergedOverrides] =
          await Promise.all([
            getFamilyTreeEffectiveVisibilityMap({
              eventSlug: slug,
            }),
            personId
              ? getPersonParticipantProfile({
                  eventSlug: slug,
                  personId,
                })
              : Promise.resolve(null),
            getMergedPersonOverridesMap(slug),
          ]);

        if (!cancelled) {
          setVisibilityPreferencesByPersonId(visibilityMap);
          setParticipantProfile(personParticipantProfile);
          setOverridesByPersonId(mergedOverrides);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setVisibilityPreferencesByPersonId({});
          setParticipantProfile(null);
          setOverridesByPersonId({});
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [slug, personId]);

  const personExists = Boolean(personId && FAMILY_GRAPH.people[personId]);

  const context = useMemo(() => {
    if (!personExists) return null;
    return getPersonContext(
      personId,
      visibilityPreferencesByPersonId,
      undefined,
      overridesByPersonId,
    );
  }, [
    personExists,
    personId,
    visibilityPreferencesByPersonId,
    overridesByPersonId,
  ]);

  const heroConfig = useMemo(() => {
    if (!personExists) return null;
    return getPersonHeroConfig(
      personId,
      visibilityPreferencesByPersonId,
      undefined,
      overridesByPersonId,
    );
  }, [
    personExists,
    personId,
    visibilityPreferencesByPersonId,
    overridesByPersonId,
  ]);

  const displayPerson = useMemo(() => {
    if (!context) return null;
    return anonymizePerson(context.person);
  }, [context]);

  const years = displayPerson ? formatYears(displayPerson) : null;
  const lifePath = displayPerson
    ? formatPlaceTransition(
        displayPerson.birthPlace,
        displayPerson.currentPlace,
        displayPerson.deathPlace,
      )
    : null;

  const showParticipantProfile =
    hasParticipantProfileContent(participantProfile);

  function handleBack() {
    navigate(`/e/${slug}/family-tree/browse?personId=${personId}`);
  }

  function handleReportIssue() {
    const params = new URLSearchParams({
      preset: "report-person-issue",
      personId,
    });

    if (displayPerson?.canDisplayName) {
      if (displayPerson.firstName) {
        params.set("personFirstName", displayPerson.firstName);
      }
      if (displayPerson.lastName) {
        params.set("personLastName", displayPerson.lastName);
      }
    }

    navigate(`/e/${slug}/contact?${params.toString()}`);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pb-24 pt-3">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement de la fiche…
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!personExists || !displayPerson || !heroConfig) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pb-24 pt-3">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <ArrowLeft size={14} />
              Retour
            </button>
          </div>

          <section className="mt-3 rounded-[24px] border border-rose-200 bg-rose-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
              <div>
                <div className="text-sm font-semibold text-rose-900">
                  Fiche introuvable
                </div>
                <div className="mt-1 text-xs leading-5 text-rose-800">
                  Cette personne n’existe pas ou n’est plus accessible.
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-3">
        <section>
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <ArrowLeft size={14} />
              Retour
            </button>

            <button
              type="button"
              onClick={handleReportIssue}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700 shadow-sm"
            >
              <ShieldAlert size={14} />
              Signaler une incohérence
            </button>
          </div>
        </section>

        <section className="mt-3">
          <div
            className={[
              "rounded-[26px] p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.20)]",
              heroConfig.heroClassName,
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-white/70">
                Fiche personne
              </span>

              {!displayPerson.canDisplay ? (
                <span className="inline-flex items-center rounded-full bg-black/20 px-3 py-1 text-[11px] font-extrabold text-white">
                  Profil masqué
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex items-start gap-4">
              <PersonVisual
                name={`${displayPerson.firstName} ${displayPerson.lastName}`}
                photoSrc={
                  displayPerson.canDisplay && displayPerson.canDisplayPhoto
                    ? displayPerson.photoSrc
                    : undefined
                }
              />

              <div className="min-w-0 flex-1">
                <div className="text-[26px] font-black leading-[1.02] tracking-tight">
                  {displayPerson.firstName} {displayPerson.lastName}
                </div>

                {displayPerson.nickname ? (
                  <div className="mt-2 text-[20px] font-black leading-[1.02] tracking-tight">
                    {displayPerson.sex === "F" ? "appelée" : "appelé"}{" "}
                    {displayPerson.nickname}
                  </div>
                ) : null}

                {years ? (
                  <div className="mt-2 text-[13px] font-extrabold text-white/90">
                    {years}
                  </div>
                ) : null}

                {lifePath ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[11px] font-extrabold text-white/90">
                    <MapPin size={12} />
                    {lifePath}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-amber-900">
                Page en construction
              </div>
              <div className="mt-0.5 text-xs text-amber-800">
                <ol>
                  <li>
                    Informations généalogiques à venir
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {showParticipantProfile ? (
          <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              En savoir plus
            </div>

            <div className="mt-3 space-y-4">
              {participantProfile?.city ? (
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    Vit aujourd’hui à
                  </div>
                  <div className="mt-1 text-sm font-semibold leading-6 text-slate-800">
                    {participantProfile.city}
                  </div>
                </div>
              ) : null}

              {participantProfile?.occupation ? (
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    Dans la vie
                  </div>
                  <div className="mt-1 text-sm font-semibold leading-6 text-slate-800 whitespace-pre-line">
                    {participantProfile.occupation}
                  </div>
                </div>
              ) : null}

              {participantProfile?.interests ? (
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    Centres d’intérêt
                  </div>
                  <div className="mt-1 text-sm font-semibold leading-6 text-slate-800 whitespace-pre-line">
                    {participantProfile.interests}
                  </div>
                </div>
              ) : null}

              {participantProfile?.freeShare ? (
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    Quelques mots en plus
                  </div>
                  <div className="mt-1 text-sm font-semibold leading-6 text-slate-800 whitespace-pre-line">
                    {participantProfile.freeShare}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Résumé
          </div>

          <div className="mt-3 space-y-3 text-sm text-slate-700">
            <div>
              <span className="font-black text-slate-900">Identifiant :</span>{" "}
              {displayPerson.id}
            </div>

            {displayPerson.branch?.length ? (
              <div>
                <span className="font-black text-slate-900">Branches :</span>{" "}
                {displayPerson.branch.join(", ")}
              </div>
            ) : null}

            {participantId ? (
              <div className="text-xs text-slate-500">
                Cette page est consultée dans le cadre de ta session
                participante.
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
