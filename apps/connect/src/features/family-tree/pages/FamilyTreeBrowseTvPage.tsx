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
import { findRelationshipPath } from "../domain/graph/findRelationshipPath";
import {
  formatBrowseLifePath,
  formatBrowseYears,
  getBrowseDisplayPerson,
  getPluralLabel,
  removeUniformLinkedSpouseLabel,
  sortPersonsByBirthYear,
  summarizeRelationshipToRoot,
} from "../domain/browse/browsePersonUtils";
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
  subtitle: string;
  icon: LucideIcon;
  persons: PersonSummary[];
  emptyLabel: string;
  onSelect: (personId: string) => void;
};

function normalizePersonId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function PersonVisual({
  person,
  sizeClassName = "h-full w-full",
}: {
  person: PersonSummary;
  sizeClassName?: string;
}) {
  const displayName = `${person.firstName} ${person.lastName}`.trim();

  if (person.canDisplay && person.canDisplayPhoto && person.photoSrc) {
    return (
      <SmartImage
        src={person.photoSrc}
        alt={displayName || "Personne"}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-black/10 text-white/80 ${sizeClassName}`}
    >
      <Users size={56} />
    </div>
  );
}

function ProjectionStatCard({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: string;
  accent?: "default" | "soft";
}) {
  return (
    <div
      className={[
        "rounded-[24px] border px-5 py-4 shadow-sm",
        accent === "soft"
          ? "border-white/15 bg-white/10 text-white"
          : "border-slate-200 bg-white text-slate-900",
      ].join(" ")}
    >
      <div
        className={[
          "text-[12px] font-black uppercase tracking-[0.16em]",
          accent === "soft" ? "text-white/70" : "text-slate-500",
        ].join(" ")}
      >
        {label}
      </div>
      <div className="mt-2 text-[28px] font-black leading-none">{value}</div>
    </div>
  );
}

function ProjectionActionButton({
  title,
  subtitle,
  icon: Icon,
  onClick,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:bg-slate-50 active:scale-[0.995]"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
          <Icon size={24} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[20px] font-black text-slate-950">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              {subtitle}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 rounded-2xl bg-slate-100 p-3 text-slate-900">
          <ArrowRight size={20} />
        </div>
      </div>
    </button>
  );
}

function TvPersonCard({
  person,
  onSelect,
}: {
  person: PersonSummary;
  onSelect: () => void;
}) {
  const years =
    person.canDisplay && person.canDisplayInfo ? formatBrowseYears(person) : null;

  const lifePath =
    person.canDisplay && person.canDisplayInfo ? formatBrowseLifePath(person) : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white active:scale-[0.995]"
    >
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[22px] bg-slate-200">
          {person.canDisplay && person.canDisplayPhoto && person.photoSrc ? (
            <SmartImage
              src={person.photoSrc}
              alt={`${person.firstName} ${person.lastName}`.trim()}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-500">
              <Users size={28} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[22px] font-black tracking-tight text-slate-950">
            {person.firstName} {person.lastName}
          </div>

          {person.nickname ? (
            <div className="mt-1 truncate text-base font-bold text-slate-600">
              {person.sex === "F" ? "appelée" : "appelé"} {person.nickname}
            </div>
          ) : null}

          {person.subtitle ? (
            <div className="mt-2 inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[12px] font-black text-slate-700 shadow-sm">
              {person.subtitle}
            </div>
          ) : null}

          {years ? (
            <div className="mt-2 text-base font-semibold text-slate-700">
              {years}
            </div>
          ) : null}

          {lifePath ? (
            <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm">
              <MapPin size={14} />
              <span className="truncate">{lifePath}</span>
            </div>
          ) : null}

          {person.linkedSpouseLabel ? (
            <div className="mt-2 text-sm font-semibold text-slate-500">
              {person.linkedSpouseLabel}
            </div>
          ) : null}

          {person.spouseRoleLabel ? (
            <div className="mt-2 text-sm font-semibold text-slate-500">
              {person.spouseRoleLabel}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 rounded-2xl bg-white p-3 text-slate-700 shadow-sm transition group-hover:bg-slate-900 group-hover:text-white">
          <ChevronRight size={20} />
        </div>
      </div>
    </button>
  );
}

function TvRelationGroup({
  title,
  subtitle,
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
          <div className="text-sm font-semibold text-slate-500">{subtitle}</div>
        </div>
      </div>

      {persons.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-base font-semibold text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="grid gap-3">
          {persons.map((person) => (
            <TvPersonCard
              key={person.id}
              person={person}
              onSelect={() => onSelect(person.id)}
            />
          ))}
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

  const [defaultGedcomPersonId, setDefaultGedcomPersonId] = useState<string | null>(null);
  const [defaultGedcomPersonLoading, setDefaultGedcomPersonLoading] = useState(false);

  const [visibilityPreferencesByPersonId, setVisibilityPreferencesByPersonId] =
    useState<PersonVisibilityPreferenceMap>({});
  const [effectiveVisibilityLoading, setEffectiveVisibilityLoading] = useState(true);

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
  const sosaReferencePersonId = sourcePersonId ?? null;

  const context = useMemo(
    () =>
      getPersonContext(
        centerId,
        visibilityPreferencesByPersonId,
        sosaReferencePersonId,
        overridesByPersonId,
      ),
    [centerId, visibilityPreferencesByPersonId, sosaReferencePersonId, overridesByPersonId],
  );

  const forceDisplayedPersonIds = useMemo(() => new Set<string>(), []);

  const displayPerson = useMemo(
    () => getBrowseDisplayPerson(context.person, forceDisplayedPersonIds, false),
    [context.person, forceDisplayedPersonIds],
  );

  const displayParents = useMemo(
    () =>
      context.parents.map((person) =>
        getBrowseDisplayPerson(person, forceDisplayedPersonIds, false),
      ),
    [context.parents, forceDisplayedPersonIds],
  );

  const displaySpouses = useMemo(
    () =>
      context.spouses.map((person) =>
        getBrowseDisplayPerson(person, forceDisplayedPersonIds, false),
      ),
    [context.spouses, forceDisplayedPersonIds],
  );

  const displayChildren = useMemo(
    () =>
      removeUniformLinkedSpouseLabel(
        sortPersonsByBirthYear(context.children).map((person) =>
          getBrowseDisplayPerson(person, forceDisplayedPersonIds, false),
        ),
      ),
    [context.children, forceDisplayedPersonIds],
  );

  const displaySiblings = useMemo(
    () =>
      sortPersonsByBirthYear(context.siblings).map((person) =>
        getBrowseDisplayPerson(person, forceDisplayedPersonIds, false),
      ),
    [context.siblings, forceDisplayedPersonIds],
  );

  const displayGrandparents = useMemo(
    () =>
      context.grandparents.map((person) =>
        getBrowseDisplayPerson(person, forceDisplayedPersonIds, false),
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
    [centerId, visibilityPreferencesByPersonId, sosaReferencePersonId, overridesByPersonId],
  );

  const rootPerson = useMemo(
    () =>
      getBrowseDisplayPerson(
        getPersonContext(
          rootHonoredPersonId,
          visibilityPreferencesByPersonId,
          sosaReferencePersonId,
          overridesByPersonId,
        ).person,
        new Set<string>(),
        false,
      ),
    [rootHonoredPersonId, visibilityPreferencesByPersonId, sosaReferencePersonId, overridesByPersonId],
  );

  const isCenteredOnSource = Boolean(sourcePersonId && centerId === sourcePersonId);

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
      ? formatBrowseYears(displayPerson)
      : null;

  const centerPath =
    displayPerson.canDisplay && displayPerson.canDisplayInfo
      ? formatBrowseLifePath(displayPerson)
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

  const relationsCount =
    displayParents.length +
    displaySpouses.length +
    displayChildren.length +
    displaySiblings.length +
    displayGrandparents.length;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="mx-auto max-w-[1900px] px-6 pb-10 pt-6 2xl:px-8">
        <section className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Monitor size={26} />
              </div>

              <div className="min-w-0">
                <div className="text-[12px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Projection famille
                </div>
                <h1 className="truncate text-[30px] font-black tracking-tight text-slate-950">
                  Arbre familial — affichage grand écran
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
        ) : !defaultGedcomPersonLoading && participantId && !hasDefaultTreeEntry ? (
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
                  "overflow-hidden rounded-[36px] text-white shadow-[0_28px_60px_rgba(15,23,42,0.22)]",
                  heroConfig.heroClassName,
                ].join(" ")}
              >
                <div className="grid gap-6 p-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <div>
                    <div className="aspect-square overflow-hidden rounded-[30px] bg-white/10 ring-1 ring-white/20">
                      <PersonVisual person={displayPerson} />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[13px] font-black uppercase tracking-[0.22em] text-white/70">
                          Personne affichée
                        </div>

                        <button
                          type="button"
                          onClick={openCentralPerson}
                          className="mt-3 text-left"
                        >
                          <div className="text-[56px] font-black leading-[0.94] tracking-tight">
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

                      <div className="flex max-w-[42%] flex-wrap justify-end gap-2">
                        {!displayPerson.canDisplay ? (
                          <span className="inline-flex items-center rounded-full bg-black/20 px-4 py-2 text-sm font-extrabold text-white">
                            Profil masqué
                          </span>
                        ) : !displayPerson.canDisplayName ||
                          !displayPerson.canDisplayPhoto ||
                          !displayPerson.canDisplayInfo ? (
                          <span className="inline-flex items-center rounded-full bg-black/20 px-4 py-2 text-sm font-extrabold text-white">
                            Profil partiellement visible
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

                    <div className="mt-6 grid gap-3 md:grid-cols-3">
                      <ProjectionStatCard
                        label="Personnes liées"
                        value={String(relationsCount)}
                        accent="soft"
                      />
                      <ProjectionStatCard
                        label="Parents + aïeux"
                        value={String(displayParents.length + displayGrandparents.length)}
                        accent="soft"
                      />
                      <ProjectionStatCard
                        label="Descendance proche"
                        value={String(displayChildren.length + displaySiblings.length)}
                        accent="soft"
                      />
                    </div>

                    {centerId !== rootHonoredPersonId ? (
                      <div className="mt-6 rounded-[24px] bg-black/15 p-5">
                        <div className="flex items-start gap-3 text-[22px] font-black leading-snug text-white">
                          <Heart size={22} className="mt-1 shrink-0 text-white" />
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
                  subtitle={`${displayParents.length} ${getPluralLabel(
                    displayParents.length,
                    "personne affichée",
                    "personnes affichées",
                  )}`}
                  icon={Users}
                  persons={displayParents}
                  emptyLabel="Aucun parent affichable."
                  onSelect={(personId) =>
                    goToRelationPerson(personId, "parents_section")
                  }
                />

                <TvRelationGroup
                  title={getPluralLabel(displaySpouses.length, "Conjoint", "Conjoints")}
                  subtitle={`${displaySpouses.length} ${getPluralLabel(
                    displaySpouses.length,
                    "personne affichée",
                    "personnes affichées",
                  )}`}
                  icon={Heart}
                  persons={displaySpouses}
                  emptyLabel="Aucun conjoint affichable."
                  onSelect={(personId) =>
                    goToRelationPerson(personId, "spouses_section")
                  }
                />

                <TvRelationGroup
                  title={getPluralLabel(displayChildren.length, "Enfant", "Enfants")}
                  subtitle={`${displayChildren.length} ${getPluralLabel(
                    displayChildren.length,
                    "personne affichée",
                    "personnes affichées",
                  )}`}
                  icon={Compass}
                  persons={displayChildren}
                  emptyLabel="Aucun enfant affichable."
                  onSelect={(personId) =>
                    goToRelationPerson(personId, "children_section")
                  }
                />

                <TvRelationGroup
                  title={getPluralLabel(displaySiblings.length, "Frère / sœur", "Fratrie")}
                  subtitle={`${displaySiblings.length} ${getPluralLabel(
                    displaySiblings.length,
                    "personne affichée",
                    "personnes affichées",
                  )}`}
                  icon={Users}
                  persons={displaySiblings}
                  emptyLabel="Aucun frère ou sœur affichable."
                  onSelect={(personId) =>
                    goToRelationPerson(personId, "siblings_section")
                  }
                />

                <div className="2xl:col-span-2">
                  <TvRelationGroup
                    title="Aïeux"
                    subtitle={`${displayGrandparents.length} ${getPluralLabel(
                      displayGrandparents.length,
                      "personne affichée",
                      "personnes affichées",
                    )}`}
                    icon={Users}
                    persons={displayGrandparents}
                    emptyLabel="Aucun aïeul affichable."
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
                    Navigation rapide
                  </div>

                  <div className="mt-4 grid gap-3">
                    {centerId !== rootHonoredPersonId ? (
                      <ProjectionActionButton
                        title={`Centrer sur Gromèr ${rootPerson.firstName}`}
                        subtitle="Revenir à la racine de l’arbre affiché"
                        icon={Heart}
                        onClick={recenterOnRoot}
                      />
                    ) : null}

                    {sourcePersonId && centerId !== sourcePersonId ? (
                      <ProjectionActionButton
                        title="Revenir à mon point de départ"
                        subtitle="Recentrer sur la personne de référence"
                        icon={UserCircle2}
                        onClick={recenterOnSource}
                      />
                    ) : null}

                    <ProjectionActionButton
                      title="Chercher une personne"
                      subtitle="Ouvrir la recherche dans l’arbre"
                      icon={Search}
                      onClick={() => navigate(`/e/${slug}/family-tree/find-person`)}
                    />

                    <ProjectionActionButton
                      title="Ouvrir la fiche complète"
                      subtitle="Afficher la fiche détaillée de la personne centrale"
                      icon={Compass}
                      onClick={openCentralPerson}
                    />
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-[22px] font-black tracking-tight text-slate-950">
                    Repères clavier
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
                      <span className="font-black text-slate-900">Échap</span> :
                      quitter ce mode
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