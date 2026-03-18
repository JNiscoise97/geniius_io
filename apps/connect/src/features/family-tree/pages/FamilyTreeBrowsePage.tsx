import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Heart,
  MapPin,
  Plus,
  User,
  UserCircle2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import type { PersonSummary } from "../types";
import {
  getPersonContext,
  getPersonHeroConfig,
} from "../config/configGenealogy";
import {
  findRelationshipPath,
  type RelationshipPathNode,
} from "../api/findRelationshipPath";
import { FAMILY_GRAPH } from "../api/loadGraph";
import {
  createFamilyTreeViewTracker,
  type FamilyTreeViaAction,
} from "../../../lib/analytics/familyTreeViewTracker";

function anonymizePerson(person: PersonSummary): PersonSummary {
  if (!person.hidden) return person;

  return {
    ...person,
    firstName: "Personne",
    lastName: "privée",
    nickname: undefined,
    photoSrc: undefined,
    birthYear: undefined,
    deathYear: undefined,
    birthPlace: undefined,
    deathPlace: undefined,
    linkedSpouseLabel: undefined,
    spouseRoleLabel: undefined,
    branch: undefined,
  };
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

function summarizeRelationshipPath(
  path: RelationshipPathNode[] | null,
  isSourceMe: boolean,
  sourceDisplayName: string,
) {
  if (!path) return "Aucun chemin trouvé.";

  if (path.length === 1) {
    return isSourceMe
      ? "Tu es actuellement centré sur toi."
      : `Tu es actuellement centré sur ${sourceDisplayName}.`;
  }

  const moves = path.slice(1).map((node) => node.via);
  const upCount = moves.filter((via) => via === "parent").length;
  const downCount = moves.filter((via) => via === "child").length;
  const spouseCount = moves.filter((via) => via === "spouse").length;

  if (spouseCount === 0 && upCount > 0 && downCount === 0) {
    return isSourceMe
      ? `Cette personne est ton ${getAncestorLabel(upCount)}.`
      : `Cette personne se situe à ${upCount} génération(s) au-dessus de ${sourceDisplayName}.`;
  }

  if (spouseCount === 0 && downCount > 0 && upCount === 0) {
    return isSourceMe
      ? `Cette personne est ton ${getDescendantLabel(downCount)}.`
      : `Cette personne se situe à ${downCount} génération(s) au-dessous de ${sourceDisplayName}.`;
  }

  if (spouseCount > 0) {
    return isSourceMe
      ? "Le lien passe par une alliance."
      : `Le lien avec ${sourceDisplayName} passe par une alliance.`;
  }

  return isSourceMe
    ? "Voici le chemin familial le plus court entre vous."
    : `Voici le chemin familial le plus court depuis ${sourceDisplayName}.`;
}

export function FamilyTreeBrowsePage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const [searchParams] = useSearchParams();
  const requestedPersonId = searchParams.get("personId");

  const rootHonoredPersonId = "7398";
  const sourcePersonId = "7351";
  const isSourceMe = false;

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

  const context = useMemo(() => getPersonContext(centerId), [centerId]);
  const displayPerson = useMemo(
    () => anonymizePerson(context.person),
    [context.person],
  );

  const sourcePerson = useMemo(
    () => anonymizePerson(getPersonContext(sourcePersonId).person),
    [sourcePersonId],
  );

  const relationshipPath = useMemo(
    () => findRelationshipPath(FAMILY_GRAPH, rootHonoredPersonId, centerId),
    [centerId, rootHonoredPersonId],
  );

  const heroConfig = useMemo(() => getPersonHeroConfig(centerId), [centerId]);
  const visibleOtherBranches = displayPerson.hidden
    ? []
    : heroConfig.otherBranches;

  const familyTreeTrackerRef = useRef<ReturnType<
    typeof createFamilyTreeViewTracker
  > | null>(null);

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
  }, [participantId, slug]);

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

  function goToPerson(personId: string, viaAction: FamilyTreeViaAction) {
    setCenterId(personId);
    const tracker = familyTreeTrackerRef.current;

    if (tracker) {
      void tracker.changePerson(personId, viaAction);
    }
  }

  function recenterOnSource() {
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

  const centerYears = formatYears(displayPerson);
  const centerPath = formatLifePath(displayPerson);

  const rootPerson = useMemo(
    () => anonymizePerson(getPersonContext(rootHonoredPersonId).person),
    [rootHonoredPersonId],
  );

  const relationshipSummary = summarizeRelationshipPath(
    relationshipPath,
    isSourceMe,
    isSourceMe ? "toi" : `Gromèr ${rootPerson.firstName}`,
  );

  const labelSpouses = getPluralLabel(
    context.spouses.length,
    "Conjoint",
    "Conjoints",
  );
  const labelChildren = getPluralLabel(
    context.children.length,
    "Enfant",
    "Enfants",
  );
  const labelSiblings = getPluralLabel(
    context.siblings.length,
    "Frère / sœur",
    "Fratrie",
  );

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-3">
        <section>
          <div className="flex items-start justify-end gap-3">
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

        {displayPerson.photoSrc ? (
          <section className="mb-4 mt-3 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
            <div className="aspect-square overflow-hidden rounded-[20px] bg-slate-100">
              <img
                src={displayPerson.photoSrc}
                alt={`${displayPerson.firstName} ${displayPerson.lastName}`}
                className="h-full w-full object-cover"
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
                    {displayPerson.hidden && (
                      <span className="inline-flex items-center rounded-full bg-black/20 px-3 py-1 text-[11px] font-extrabold text-white">
                        Profil masqué
                      </span>
                    )}

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

        <div className="space-y-4">
          <TreeRelationSection
            title="Parents"
            subtitle="Remonter d’une génération."
            headerClassName={heroConfig.headerClassName}
            persons={context.parents}
            isOpen={openSections.parents}
            onToggle={() => toggleSection("parents")}
            emptyLabel="Aucun parent affiché pour le moment."
            onSelect={goToPerson}
            viaAction="parents_section"
            showCount={false}
          />

          <TreeRelationSection
            title={labelSpouses}
            subtitle="Voir les unions liées à cette personne."
            headerClassName={heroConfig.headerClassName}
            persons={context.spouses}
            isOpen={openSections.spouses}
            onToggle={() => toggleSection("spouses")}
            emptyLabel="Aucun conjoint affiché pour le moment."
            onSelect={goToPerson}
            viaAction="spouses_section"
          />

          <TreeRelationSection
            title={labelChildren}
            subtitle="Descendre d’une génération."
            headerClassName={heroConfig.headerClassName}
            persons={context.children}
            isOpen={openSections.children}
            onToggle={() => toggleSection("children")}
            emptyLabel="Aucun enfant affiché pour le moment."
            onSelect={goToPerson}
            viaAction="children_section"
          />

          <TreeRelationSection
            title={labelSiblings}
            subtitle="Passer rapidement à un frère ou une sœur."
            headerClassName={heroConfig.headerClassName}
            persons={context.siblings}
            isOpen={openSections.siblings}
            onToggle={() => toggleSection("siblings")}
            emptyLabel="Aucune fratrie affichée pour le moment."
            onSelect={goToPerson}
            viaAction="siblings_section"
          />

          <TreeRelationSection
            title="Aïeux"
            subtitle="Accéder directement à la génération au-dessus des parents."
            headerClassName={heroConfig.headerClassName}
            persons={context.grandparents}
            isOpen={openSections.grandparents}
            onToggle={() => toggleSection("grandparents")}
            emptyLabel="Aucun aïeul affiché pour le moment."
            onSelect={goToPerson}
            viaAction="grandparents_section"
            showCount={false}
          />
        </div>

        <section className="mb-4 mt-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openCentralPerson}
              className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
            >
              Voir la fiche
              <ArrowRight size={16} />
            </button>

            {centerId !== rootHonoredPersonId ? (
              <button
                type="button"
                onClick={recenterOnRoot}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-900 transition active:scale-[0.99]"
              >
                <Heart size={16} />
                Revenir à Gromèr
              </button>
            ) : null}

            {centerId !== sourcePersonId ? (
              <button
                type="button"
                onClick={recenterOnSource}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-900 transition active:scale-[0.99]"
              >
                <UserCircle2 size={16} />
                {isSourceMe
                  ? "Me retrouver"
                  : `Revenir à ${sourcePerson.firstName}`}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => navigate(`/e/${slug}/family-tree/find-me`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-900 transition active:scale-[0.99]"
            >
              <UserCircle2 size={16} />
              Me trouver
            </button>
          </div>

          <div className="mt-4">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              {isSourceMe ? "Lien avec moi" : "Lien avec Gromèr"}
            </div>

            <div className="mt-2 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-2 text-sm font-black text-slate-900">
                <Heart
                  size={16}
                  className="mt-[2px] shrink-0 text-indigo-600"
                />
                <div>
                  <div>
                    {isSourceMe
                      ? `Chemin de parenté vers ${displayPerson.firstName} ${displayPerson.lastName}`
                      : `Chemin depuis Gromèr Covindou vers ${displayPerson.firstName} ${displayPerson.lastName}`}
                  </div>
                  <div className="mt-1 text-xs font-bold text-slate-500">
                    {relationshipSummary}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/e/${slug}/familyTree/story?from=${encodeURIComponent(
                      rootHonoredPersonId,
                    )}&to=${encodeURIComponent(centerId)}`,
                  )
                }
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
              >
                Voir l’histoire de cette branche
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function TreeRelationSection({
  title,
  subtitle,
  persons,
  isOpen,
  headerClassName,
  onToggle,
  emptyLabel,
  onSelect,
  viaAction,
  showCount = true,
}: {
  title: string;
  subtitle: string;
  persons: PersonSummary[];
  isOpen: boolean;
  headerClassName: string;
  onToggle: () => void;
  emptyLabel: string;
  onSelect: (personId: string, viaAction: FamilyTreeViaAction) => void;
  viaAction: FamilyTreeViaAction;
  showCount?: boolean;
}) {
  const count = persons.length;

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full rounded-[26px] p-4 text-left ${headerClassName}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[20px] font-black">
                {title}
                {showCount ? ` (${count})` : ""}
              </div>
            </div>

            <p className="mt-1 text-sm font-bold leading-6 text-white/90">
              {subtitle}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl bg-white/10 p-2 text-white">
            {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
        </div>
      </button>

      {isOpen ? (
        persons.length === 0 ? (
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 shadow-sm">
            {emptyLabel}
          </div>
        ) : (
          <div className="space-y-3">
            {persons.map((person) => (
              <TreePersonCard
                key={person.id}
                person={anonymizePerson(person)}
                onClick={() => onSelect(person.id, viaAction)}
              />
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}

function TreePersonCard({
  person,
  onClick,
}: {
  person: PersonSummary;
  onClick: () => void;
}) {
  const lowerSubtitle = person.subtitle?.toLowerCase() ?? "";
  const isSpouse =
    lowerSubtitle.includes("conjoint") ||
    lowerSubtitle.includes("conjointe") ||
    lowerSubtitle.includes("époux") ||
    lowerSubtitle.includes("épouse");

  const years = formatYears(person);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] active:shadow-none"
    >
      <div className="flex items-start gap-3">
        {person.photoSrc ? (
          <img
            src={person.photoSrc}
            alt={`${person.firstName} ${person.lastName}`}
            className="h-12 w-12 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
            {isSpouse ? <Heart size={20} /> : <User size={20} />}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[16px] font-black text-slate-900">
              {person.firstName} {person.lastName}
            </div>

            {person.subtitle ? (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">
                {person.subtitle}
              </span>
            ) : null}

            {person.hidden ? (
              <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-black text-slate-700">
                Profil masqué
              </span>
            ) : null}

            {isSpouse && person.spouseRoleLabel ? (
              <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700">
                {person.spouseRoleLabel}
              </span>
            ) : null}

            {!isSpouse && person.linkedSpouseLabel ? (
              <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700">
                {person.linkedSpouseLabel}
              </span>
            ) : null}
          </div>

          {years ? (
            <p className="mt-1 text-xs font-bold text-slate-700">{years}</p>
          ) : null}
        </div>

        <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
          <ArrowRight size={18} />
        </div>
      </div>
    </button>
  );
}
