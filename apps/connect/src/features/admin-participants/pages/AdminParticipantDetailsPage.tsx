import {
  Activity,
  ArrowLeft,
  Heart,
  Loader2,
  MapPinned,
  MessageSquare,
  UserCircle2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminParticipantDetails } from "../api/getAdminParticipantDetails";
import type { AdminParticipantDetails } from "../types/adminParticipantTypes";
import {
  getFamilyKnowledgeCloseFamily,
  type FamilyKnowledgePersonEntry,
} from "../../family-knowledge/api/getFamilyKnowledgeCloseFamily";
import {
  getFamilyKnowledgeGrandparents,
  type FamilyKnowledgeAuntUnclePerson,
  type FamilyKnowledgeGrandparentPerson,
} from "../../family-knowledge/api/getFamilyKnowledgeGrandparents";
import {
  getFamilyKnowledgeGodparents,
  type FamilyKnowledgeGodchildPerson,
  type FamilyKnowledgeGodparentLinkPerson,
  type FamilyKnowledgeParrainageSection,
} from "../../family-knowledge/api/getFamilyKnowledgeGodparents";
import { getFamilyKnowledgeCurrentLinks } from "../../family-knowledge/api/getFamilyKnowledgeCurrentLinks";
import { getFamilyKnowledgeMemory } from "../../family-knowledge/api/getFamilyKnowledgeMemory";
import { listFamilyReactionFeed } from "../../family-reactions/api/listFamilyReactionFeed";
import type { FamilyReactionFeedItem } from "../../family-reactions/types";

type LoadState =
  | {
      kind: "loading";
    }
  | {
      kind: "ready";
      item: AdminParticipantDetails | null;
      familyKnowledge: {
        closeFamily: Awaited<ReturnType<typeof getFamilyKnowledgeCloseFamily>> | null;
        grandparents: Awaited<ReturnType<typeof getFamilyKnowledgeGrandparents>> | null;
        godparents: Awaited<ReturnType<typeof getFamilyKnowledgeGodparents>> | null;
        currentLinks: Awaited<ReturnType<typeof getFamilyKnowledgeCurrentLinks>> | null;
        memory: Awaited<ReturnType<typeof getFamilyKnowledgeMemory>> | null;
      };
      reactions: FamilyReactionFeedItem[];
    }
  | {
      kind: "error";
      message: string;
    };

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-black text-slate-900">{value}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-sm font-medium leading-5 text-slate-700">{label}</div>
      <div className="shrink-0 text-right text-sm font-black text-slate-900">
        {value}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-black text-slate-900">{title}</div>
      {description ? (
        <div className="mt-1 text-sm font-medium leading-6 text-slate-700">
          {description}
        </div>
      ) : null}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-700">
      {text}
    </div>
  );
}

function formatBooleanValue(value: boolean | null | undefined): string {
  if (value === true) return "Oui";
  if (value === false) return "Non";
  return "—";
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0 min";

  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} h ${minutes} min`;
  }

  if (minutes > 0) {
    return `${minutes} min`;
  }

  return `${seconds} s`;
}

function formatYesNoValue(value: "" | "yes" | "no" | undefined): string {
  if (value === "yes") return "Oui";
  if (value === "no") return "Non";
  return "—";
}

function formatText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function formatLongText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Aucune réponse détaillée.";
}

function formatContactChannels(values: string[] | null | undefined): string {
  if (!values || values.length === 0) return "—";
  return values.join(", ");
}

function getPersonDisplayName(person: {
  firstName?: string;
  lastName?: string;
  nickname?: string;
}) {
  const fullName = [person.firstName?.trim(), person.lastName?.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) return fullName;
  if (person.nickname?.trim()) return person.nickname.trim();
  return "Non renseigné";
}

function formatLifeYears(birthYear?: string, deathYear?: string): string {
  const birth = birthYear?.trim() || "";
  const death = deathYear?.trim() || "";

  if (!birth && !death) return "—";
  if (birth && death) return `${birth} – ${death}`;
  if (birth) return `${birth} –`;
  return `– ${death}`;
}

function formatSexValue(value: "" | "M" | "F" | "U" | undefined): string {
  if (value === "M") return "Homme";
  if (value === "F") return "Femme";
  if (value === "U") return "Inconnu / non précisé";
  return "—";
}

function formatConfidenceValue(value: "" | "low" | "medium" | "high" | undefined): string {
  if (value === "low") return "Faible";
  if (value === "medium") return "Moyenne";
  if (value === "high") return "Élevée";
  return "—";
}

function formatRelationshipType(
  value: "" | "both_parents" | "father_only" | "mother_only" | undefined
): string {
  if (value === "both_parents") return "Des deux parents";
  if (value === "father_only") return "Du père seulement";
  if (value === "mother_only") return "De la mère seulement";
  return "—";
}

function countKnownPeople<T extends { known: boolean }>(items: T[]): number {
  return items.filter((item) => item.known).length;
}

function filterKnownPeople<T extends { known: boolean }>(items: T[]): T[] {
  return items.filter((item) => item.known);
}

function getReactionKindLabel(kind: FamilyReactionFeedItem["kind"]): string {
  switch (kind) {
    case "touched_by_person":
      return "J’aime";
    case "heard_of_person":
      return "A entendu parler";
    case "knew_person":
      return "A connu";
    case "memory":
      return "Souvenir";
    case "photo":
      return "Photo";
    default:
      return kind;
  }
}

function PersonCard({
  title,
  person,
}: {
  title: string;
  person:
    | FamilyKnowledgePersonEntry
    | FamilyKnowledgeGrandparentPerson
    | FamilyKnowledgeAuntUnclePerson
    | FamilyKnowledgeGodparentLinkPerson
    | FamilyKnowledgeGodchildPerson;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-black text-slate-900">{title}</div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <DetailRow label="Connu" value={person.known ? "Oui" : "Non"} />
        <DetailRow label="Nom affiché" value={getPersonDisplayName(person)} />
        {"sex" in person ? (
          <DetailRow label="Sexe" value={formatSexValue(person.sex)} />
        ) : null}
        <DetailRow label="En vie" value={formatYesNoValue(person.isAlive)} />
        <DetailRow label="Photo connue" value={formatYesNoValue(person.hasPhoto)} />
        {"birthYear" in person ? (
          <DetailRow
            label="Naissance / décès"
            value={formatLifeYears(person.birthYear, person.deathYear)}
          />
        ) : null}
        {"birthPlace" in person ? (
          <DetailRow label="Lieu de naissance" value={formatText(person.birthPlace)} />
        ) : null}
        {"currentPlace" in person ? (
          <DetailRow label="Lieu actuel" value={formatText(person.currentPlace)} />
        ) : null}
        {"deathPlace" in person ? (
          <DetailRow label="Lieu de décès" value={formatText(person.deathPlace)} />
        ) : null}
        {"confidence" in person ? (
          <DetailRow
            label="Niveau de confiance"
            value={formatConfidenceValue(person.confidence)}
          />
        ) : null}
        {"relationshipType" in person ? (
          <DetailRow
            label="Type de rattachement"
            value={formatRelationshipType(person.relationshipType)}
          />
        ) : null}
        {"isFamilyMember" in person ? (
          <DetailRow
            label="Membre de la famille"
            value={formatYesNoValue(person.isFamilyMember)}
          />
        ) : null}
      </div>

      {"notes" in person && person.notes.trim() ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">
            Notes
          </div>
          <div className="mt-1 text-sm font-medium leading-6 text-slate-800">
            {person.notes}
          </div>
        </div>
      ) : null}

      {"familyRelationshipDetail" in person && person.familyRelationshipDetail.trim() ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">
            Détail du lien familial
          </div>
          <div className="mt-1 text-sm font-medium leading-6 text-slate-800">
            {person.familyRelationshipDetail}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReactionItemCard({ item }: { item: FamilyReactionFeedItem }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-black text-slate-900">{item.text}</div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
          {getReactionKindLabel(item.kind)}
        </span>
      </div>

      <div className="mt-2 text-xs font-bold text-slate-500">
        {item.personLabel} • {formatDateTime(item.createdAt)}
      </div>

      {item.subtext ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium leading-6 text-slate-800">
          {item.subtext}
        </div>
      ) : null}

      {item.publicUrl ? (
        <div className="mt-3">
          <a
            href={item.publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700"
          >
            Ouvrir le média
          </a>
        </div>
      ) : null}
    </div>
  );
}

function ParrainageSectionDetails({
  title,
  section,
}: {
  title: string;
  section: FamilyKnowledgeParrainageSection;
}) {
  const knownGodchildren = filterKnownPeople(section.godchildren);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-black text-slate-900">{title}</div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <DetailRow label="Baptisé" value={formatYesNoValue(section.isBaptized)} />
        <DetailRow
          label="A des filleuls"
          value={formatYesNoValue(section.hasGodchildren)}
        />
        <DetailRow
          label="Nombre de filleuls connus"
          value={String(knownGodchildren.length)}
        />
      </div>

      <div className="mt-4 grid gap-3">
        <PersonCard title="Parrain" person={section.godfather} />
        <PersonCard title="Marraine" person={section.godmother} />
      </div>
    </div>
  );
}

export function AdminParticipantDetailsPage() {
  const nav = useNavigate();
  const { eventSlug, participantId } = useParams();

  const resolvedEventSlug = eventSlug ?? "";
  const resolvedParticipantId = participantId ?? "";

  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setState({ kind: "loading" });

        const item = await getAdminParticipantDetails({
          eventSlug: resolvedEventSlug,
          participantId: resolvedParticipantId,
        });

        if (!item) {
          if (!cancelled) {
            setState({
              kind: "ready",
              item: null,
              familyKnowledge: {
                closeFamily: null,
                grandparents: null,
                godparents: null,
                currentLinks: null,
                memory: null,
              },
              reactions: [],
            });
          }
          return;
        }

        const [
          closeFamily,
          grandparents,
          godparents,
          currentLinks,
          memory,
          reactions,
        ] = await Promise.all([
          getFamilyKnowledgeCloseFamily({
            participantId: resolvedParticipantId,
          }).catch(() => null),

          getFamilyKnowledgeGrandparents({
            participantId: resolvedParticipantId,
          }).catch(() => null),

          getFamilyKnowledgeGodparents({
            participantId: resolvedParticipantId,
          }).catch(() => null),

          getFamilyKnowledgeCurrentLinks({
            participantId: resolvedParticipantId,
          }).catch(() => null),

          getFamilyKnowledgeMemory({
            participantId: resolvedParticipantId,
          }).catch(() => null),

          listFamilyReactionFeed({
            eventSlug: resolvedEventSlug,
            currentParticipantId: resolvedParticipantId,
            audience: "mine",
          }).catch(() => []),
        ]);

        if (!cancelled) {
          setState({
            kind: "ready",
            item,
            familyKnowledge: {
              closeFamily,
              grandparents,
              godparents,
              currentLinks,
              memory,
            },
            reactions,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : "Impossible de charger le participant.",
          });
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [resolvedEventSlug, resolvedParticipantId]);

  const tracking = state.kind === "ready" && state.item ? state.item.tracking : null;

  const trackingTopPages = useMemo(() => {
    if (!tracking) return [];
    return tracking.topPages.slice(0, 10);
  }, [tracking]);

  const trackingTopTreePeople = useMemo(() => {
    if (!tracking) return [];
    return tracking.topTreePeople.slice(0, 10);
  }, [tracking]);

  if (state.kind === "loading") {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-900">
            <Loader2 className="animate-spin" size={20} />
            <div className="text-lg font-black">Chargement du participant...</div>
          </div>
        </div>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
        <div className="font-black text-rose-900">{state.message}</div>
      </div>
    );
  }

  if (!state.item) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
        <div className="font-black text-amber-900">Participant introuvable.</div>
      </div>
    );
  }

  const item = state.item;
  const { closeFamily, grandparents, godparents, currentLinks, memory } =
    state.familyKnowledge;
  const reactions = state.reactions;

  const knownSiblings = closeFamily ? filterKnownPeople(closeFamily.siblings) : [];
  const knownChildren = closeFamily ? filterKnownPeople(closeFamily.children) : [];

  const knownPaternalAuntsUncles = grandparents
    ? filterKnownPeople(grandparents.paternalAuntsUncles)
    : [];
  const knownMaternalAuntsUncles = grandparents
    ? filterKnownPeople(grandparents.maternalAuntsUncles)
    : [];

  const differentReactionPeopleCount = new Set(
    reactions.map((reaction) => reaction.personId)
  ).size;

  const reactionCounts = {
    total: reactions.length,
    simple: reactions.filter(
      (entry) =>
        entry.kind === "touched_by_person" ||
        entry.kind === "heard_of_person" ||
        entry.kind === "knew_person"
    ).length,
    memories: reactions.filter((entry) => entry.kind === "memory").length,
    photos: reactions.filter((entry) => entry.kind === "photo").length,
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {item.firstName} {item.lastName}
          </h1>
          <div className="mt-1 text-sm font-medium text-slate-700">
            Tableau de bord participant
          </div>
        </div>

        <button
          type="button"
          onClick={() => nav(`/admin/events/${resolvedEventSlug}/participants`)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
        >
          <ArrowLeft size={14} />
          Retour
        </button>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
            <UserCircle2 size={20} />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">Identité et contact</div>
            <div className="mt-1 text-sm font-medium text-slate-700">
              Données actuellement branchées depuis participants et participant_consents.
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard label="Prénom" value={item.firstName || "—"} />
          <InfoCard label="Nom" value={item.lastName || "—"} />
          <InfoCard label="Surnom" value={item.nickname || "—"} />
          <InfoCard
            label="Année de naissance"
            value={item.birthYear ? String(item.birthYear) : "—"}
          />
          <InfoCard label="Email" value={item.email || "—"} />
          <InfoCard label="Téléphone" value={item.phone || "—"} />
          <InfoCard label="Messenger" value={item.messenger || "—"} />
          <InfoCard label="WhatsApp" value={item.hasWhatsapp ? "Oui" : "Non"} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoCard
            label="Afficher dans l’arbre généalogique"
            value={formatBooleanValue(item.allowNameInFamilyTree)}
          />
          <InfoCard
            label="Canaux de contact privilégiés"
            value={formatContactChannels(item.preferredContactChannels)}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
            <UserCircle2 size={20} />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">
              Consentements et partage
            </div>
            <div className="mt-1 text-sm font-medium text-slate-700">
              Vue structurée comme le formulaire rempli par le participant.
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            label="Consentements complétés"
            value={formatBooleanValue(item.consents?.completed)}
          />
          <InfoCard
            label="Version"
            value={
              item.consents?.consentVersion !== null &&
              item.consents?.consentVersion !== undefined
                ? String(item.consents.consentVersion)
                : "—"
            }
          />
          <InfoCard
            label="Page vue le"
            value={formatDateTime(item.consents?.pageSeenAt)}
          />
          <InfoCard
            label="Soumis le"
            value={formatDateTime(item.consents?.submittedAt)}
          />
        </div>

        {!item.consents ? (
          <div className="mt-5">
            <EmptyBlock text="Aucun consentement enregistré pour cet événement." />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <SectionCard
              title="Arbre généalogique"
              description="Ce que les membres connectés de la famille peuvent voir dans l’arbre."
            >
              <DetailRow
                label="Afficher mon nom dans l’arbre familial"
                value={formatBooleanValue(item.consents.allowNameInFamilyTree)}
              />
              <DetailRow
                label="Afficher ma photo dans l’arbre familial"
                value={formatBooleanValue(item.consents.allowPhotoInFamilyTree)}
              />
              <DetailRow
                label="Afficher mes informations dans l’arbre familial"
                value={formatBooleanValue(item.consents.allowInfoInFamilyTree)}
              />
            </SectionCard>

            <SectionCard
              title="Photos et médias"
              description="Partage et affichage des photos dans l’application et les souvenirs."
            >
              <DetailRow
                label="Partager avec la famille les photos où j’apparais"
                value={formatBooleanValue(item.consents.allowFamilyPhotoSharing)}
              />
              <DetailRow
                label="Afficher dans l’application les photos où j’apparais"
                value={formatBooleanValue(item.consents.allowPhotoDisplayInApp)}
              />
              <DetailRow
                label="Utiliser les photos de l’événement dans les souvenirs familiaux"
                value={formatBooleanValue(item.consents.allowEventPhotoMemory)}
              />
            </SectionCard>

            <SectionCard
              title="Contact et communication"
              description="Ce que la famille ou les organisateurs peuvent utiliser pour le contact."
            >
              <DetailRow
                label="Afficher mes coordonnées aux membres de la famille"
                value={formatBooleanValue(
                  item.consents.allowContactDetailsWithFamily
                )}
              />
              <DetailRow
                label="Être contacté pour de futurs événements familiaux"
                value={formatBooleanValue(item.consents.allowFutureFamilyContact)}
              />
            </SectionCard>

            <SectionCard
              title="Contribution au projet familial"
              description="Utilisation des informations et contributions dans le travail généalogique."
            >
              <DetailRow
                label="Utiliser mes informations pour enrichir l’arbre généalogique"
                value={formatBooleanValue(item.consents.allowGenealogyEnrichment)}
              />
              <DetailRow
                label="Conserver mes contributions généalogiques"
                value={formatBooleanValue(
                  item.consents.allowGenealogyContributionStorage
                )}
              />
            </SectionCard>

            <SectionCard
              title="Utilisation dans l’application"
              description="Visibilité dans les écrans d’activité et de jeu."
            >
              <DetailRow
                label="Afficher mon nom dans les activités de la cousinade"
                value={formatBooleanValue(item.consents.allowNameInEventActivities)}
              />
              <DetailRow
                label="Afficher ma participation dans les jeux ou animations"
                value={formatBooleanValue(item.consents.allowParticipationInGames)}
              />
            </SectionCard>

            {item.consents.otherPreferences ? (
              <SectionCard title="Autre préférence ou remarque">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-800">
                  {item.consents.otherPreferences}
                </div>
              </SectionCard>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <InfoCard
                label="Créé le"
                value={formatDateTime(item.consents.createdAt)}
              />
              <InfoCard
                label="Mis à jour le"
                value={formatDateTime(item.consents.updatedAt)}
              />
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
            <MapPinned size={20} />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">
              Questionnaire family knowledge
            </div>
            <div className="mt-1 text-sm font-medium text-slate-700">
              Vue détaillée des réponses connues dans les différents modules.
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            label="Famille proche"
            value={closeFamily ? "Renseigné" : "Non renseigné"}
          />
          <InfoCard
            label="Grands-parents"
            value={grandparents ? "Renseigné" : "Non renseigné"}
          />
          <InfoCard
            label="Parrains / marraines"
            value={godparents ? "Renseigné" : "Non renseigné"}
          />
          <InfoCard
            label="Mémoire familiale"
            value={memory ? "Renseigné" : "Non renseigné"}
          />
        </div>

        <div className="mt-6 space-y-6">
          <SectionCard
            title="Famille proche"
            description="Parents, fratrie, enfants et situation conjugale."
          >
            {closeFamily ? (
              <>
                <DetailRow
                  label="A des frères et sœurs"
                  value={formatYesNoValue(closeFamily.hasSiblings)}
                />
                <DetailRow
                  label="Nombre de frères et sœurs connus"
                  value={String(countKnownPeople(closeFamily.siblings))}
                />
                <DetailRow
                  label="Ordre de fratrie connu"
                  value={closeFamily.knowsSiblingOrder ? "Oui" : "Non"}
                />
                <DetailRow
                  label="A des enfants"
                  value={formatYesNoValue(closeFamily.hasChildren)}
                />
                <DetailRow
                  label="Nombre d’enfants connus"
                  value={String(countKnownPeople(closeFamily.children))}
                />
                <DetailRow
                  label="Est en couple"
                  value={formatYesNoValue(closeFamily.isInRelationship)}
                />

                <PersonCard title="Parent 1" person={closeFamily.parent1} />
                <PersonCard title="Parent 2" person={closeFamily.parent2} />
                <PersonCard title="Conjoint" person={closeFamily.partner} />

                {knownSiblings.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-black text-slate-900">
                      Frères et sœurs ({knownSiblings.length})
                    </div>
                    {knownSiblings.map((person, index) => (
                      <PersonCard
                        key={person.id}
                        title={`Frère / sœur ${index + 1}`}
                        person={person}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyBlock text="Aucun frère ou sœur détaillé." />
                )}

                {knownChildren.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-black text-slate-900">
                      Enfants ({knownChildren.length})
                    </div>
                    {knownChildren.map((person, index) => (
                      <PersonCard
                        key={person.id}
                        title={`Enfant ${index + 1}`}
                        person={person}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyBlock text="Aucun enfant détaillé." />
                )}
              </>
            ) : (
              <EmptyBlock text="Aucune réponse enregistrée." />
            )}
          </SectionCard>

          <SectionCard
            title="Grands-parents, oncles et tantes"
            description="Détail des ascendants et collatéraux côté paternel et maternel."
          >
            {grandparents ? (
              <>
                <PersonCard
                  title="Grand-père paternel"
                  person={grandparents.paternalGrandfather}
                />
                <PersonCard
                  title="Grand-mère paternelle"
                  person={grandparents.paternalGrandmother}
                />
                <PersonCard
                  title="Grand-père maternel"
                  person={grandparents.maternalGrandfather}
                />
                <PersonCard
                  title="Grand-mère maternelle"
                  person={grandparents.maternalGrandmother}
                />

                <DetailRow
                  label="Oncles / tantes côté paternel"
                  value={String(knownPaternalAuntsUncles.length)}
                />
                <DetailRow
                  label="Ordre des frères / sœurs du père connu"
                  value={grandparents.knowsFatherSiblingOrder ? "Oui" : "Non"}
                />

                {knownPaternalAuntsUncles.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-black text-slate-900">
                      Côté paternel
                    </div>
                    {knownPaternalAuntsUncles.map((person, index) => (
                      <PersonCard
                        key={person.id}
                        title={`Oncle / tante paternel(le) ${index + 1}`}
                        person={person}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyBlock text="Aucun oncle ou tante détaillé côté paternel." />
                )}

                <DetailRow
                  label="Oncles / tantes côté maternel"
                  value={String(knownMaternalAuntsUncles.length)}
                />
                <DetailRow
                  label="Ordre des frères / sœurs de la mère connu"
                  value={grandparents.knowsMotherSiblingOrder ? "Oui" : "Non"}
                />

                {knownMaternalAuntsUncles.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-black text-slate-900">
                      Côté maternel
                    </div>
                    {knownMaternalAuntsUncles.map((person, index) => (
                      <PersonCard
                        key={person.id}
                        title={`Oncle / tante maternel(le) ${index + 1}`}
                        person={person}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyBlock text="Aucun oncle ou tante détaillé côté maternel." />
                )}
              </>
            ) : (
              <EmptyBlock text="Aucune réponse enregistrée." />
            )}
          </SectionCard>

          <SectionCard
            title="Parrains et marraines"
            description="Détail du baptême, des parrains / marraines et des filleuls."
          >
            {godparents ? (
              <>
                <ParrainageSectionDetails title="Participant" section={godparents.self} />
                <ParrainageSectionDetails title="Père" section={godparents.father} />
                <ParrainageSectionDetails title="Mère" section={godparents.mother} />
                <ParrainageSectionDetails
                  title="Grand-père paternel"
                  section={godparents.paternalGrandfather}
                />
                <ParrainageSectionDetails
                  title="Grand-mère paternelle"
                  section={godparents.paternalGrandmother}
                />
                <ParrainageSectionDetails
                  title="Grand-père maternel"
                  section={godparents.maternalGrandfather}
                />
                <ParrainageSectionDetails
                  title="Grand-mère maternelle"
                  section={godparents.maternalGrandmother}
                />
              </>
            ) : (
              <EmptyBlock text="Aucune réponse enregistrée." />
            )}
          </SectionCard>

          <SectionCard
            title="Liens actuels avec la famille"
            description="Personnes de la famille encore en contact avec le participant."
          >
            {currentLinks ? (
              currentLinks.contacts.length > 0 ? (
                <>
                  <DetailRow
                    label="Nombre de contacts familiaux"
                    value={String(currentLinks.contacts.length)}
                  />
                  {currentLinks.contacts.map((contact, index) => (
                    <div
                      key={`${contact.firstName}-${contact.lastName}-${index}`}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="text-sm font-black text-slate-900">
                        Contact {index + 1}
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <DetailRow
                          label="Nom"
                          value={getPersonDisplayName(contact)}
                        />
                        <DetailRow
                          label="Type de lien"
                          value={formatText(contact.relationshipType)}
                        />
                        <DetailRow
                          label="Libellé du lien"
                          value={formatText(contact.relationshipLabel)}
                        />
                        <DetailRow
                          label="Photo connue"
                          value={formatYesNoValue(contact.hasPhoto)}
                        />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <EmptyBlock text="Aucun contact familial renseigné." />
              )
            ) : (
              <EmptyBlock text="Aucune réponse enregistrée." />
            )}
          </SectionCard>

          <SectionCard
            title="Mémoire familiale"
            description="Souvenirs, anecdote familiale, personnes ressources et photos."
          >
            {memory ? (
              <>
                <DetailRow
                  label="Nombre de personnes ressources"
                  value={String(memory.storyTellers.length)}
                />
                <DetailRow
                  label="A déjà vu des photos de famille"
                  value={formatYesNoValue(memory.hasSeenFamilyPhotos)}
                />
                <DetailRow
                  label="Possède des photos de famille"
                  value={formatYesNoValue(memory.hasFamilyPhotos)}
                />

                {memory.storyTellers.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-black text-slate-900">
                      Personnes ressources
                    </div>
                    {memory.storyTellers.map((person, index) => (
                      <div
                        key={`${person.firstName}-${person.lastName}-${index}`}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <div className="text-sm font-black text-slate-900">
                          Personne ressource {index + 1}
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <DetailRow
                            label="Nom"
                            value={getPersonDisplayName(person)}
                          />
                          <DetailRow
                            label="Lien"
                            value={formatText(person.relationshipLabel)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyBlock text="Aucune personne ressource mentionnée." />
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-black text-slate-900">
                    Anecdote familiale
                  </div>
                  <div className="mt-2 text-sm font-medium leading-6 text-slate-800">
                    {formatLongText(memory.familyAnecdote)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-black text-slate-900">
                    Contexte des photos de famille déjà vues
                  </div>
                  <div className="mt-2 text-sm font-medium leading-6 text-slate-800">
                    {formatLongText(memory.seenFamilyPhotosContext)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-black text-slate-900">
                    Note sur les photos de famille détenues
                  </div>
                  <div className="mt-2 text-sm font-medium leading-6 text-slate-800">
                    {formatLongText(memory.familyPhotosNote)}
                  </div>
                </div>
              </>
            ) : (
              <EmptyBlock text="Aucune réponse enregistrée." />
            )}
          </SectionCard>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
            <Heart size={20} />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">Réactions</div>
            <div className="mt-1 text-sm font-medium text-slate-700">
              Historique des réactions, souvenirs et photos déposés par ce participant.
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard label="Total" value={String(reactionCounts.total)} />
          <InfoCard
            label="Réactions simples"
            value={String(reactionCounts.simple)}
          />
          <InfoCard label="Souvenirs" value={String(reactionCounts.memories)} />
          <InfoCard label="Photos" value={String(reactionCounts.photos)} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoCard
            label="Personnes différentes concernées"
            value={String(differentReactionPeopleCount)}
          />
          <InfoCard
            label="Dernière activité"
            value={
              reactions.length > 0 ? formatDateTime(reactions[0]?.createdAt) : "—"
            }
          />
        </div>

        <div className="mt-6">
          {reactions.length === 0 ? (
            <EmptyBlock text="Aucune réaction enregistrée pour ce participant." />
          ) : (
            <div className="space-y-3">
              {reactions.map((reaction) => (
                <ReactionItemCard key={reaction.id} item={reaction} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
            <Activity size={20} />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">Tracking</div>
            <div className="mt-1 text-sm font-medium text-slate-700">
              Agrégation des traces d’usage enregistrées pour ce participant.
            </div>
          </div>
        </div>

        {tracking ? (
          <>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard
                label="Sessions de pages"
                value={String(tracking.pageSessionsCount)}
              />
              <InfoCard
                label="Pages distinctes"
                value={String(tracking.pageDistinctCount)}
              />
              <InfoCard
                label="Temps visible pages"
                value={formatDuration(tracking.totalPageVisibleMs)}
              />
              <InfoCard
                label="Temps engagé pages"
                value={formatDuration(tracking.totalPageEngagedMs)}
              />
              <InfoCard
                label="Événements pages"
                value={String(tracking.totalPageEventCount)}
              />
              <InfoCard
                label="Dernière activité page"
                value={formatDateTime(tracking.lastPageActivityAt)}
              />
              <InfoCard
                label="Vues arbre"
                value={String(tracking.treeViewsCount)}
              />
              <InfoCard
                label="Personnes d’arbre distinctes"
                value={String(tracking.treeDistinctPeopleCount)}
              />
              <InfoCard
                label="Temps visible arbre"
                value={formatDuration(tracking.totalTreeVisibleMs)}
              />
              <InfoCard
                label="Temps engagé arbre"
                value={formatDuration(tracking.totalTreeEngagedMs)}
              />
              <InfoCard
                label="Événements arbre"
                value={String(tracking.totalTreeEventCount)}
              />
              <InfoCard
                label="Dernière activité arbre"
                value={formatDateTime(tracking.lastTreeActivityAt)}
              />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <SectionCard
                title="Pages les plus consultées"
                description="Top des pages selon le temps engagé."
              >
                {trackingTopPages.length === 0 ? (
                  <EmptyBlock text="Aucune donnée de page enregistrée." />
                ) : (
                  trackingTopPages.map((page) => (
                    <div
                      key={page.pageKey}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="text-sm font-black text-slate-900">
                        {page.pageKey}
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <DetailRow label="Sessions" value={String(page.sessions)} />
                        <DetailRow
                          label="Temps visible"
                          value={formatDuration(page.visibleMs)}
                        />
                        <DetailRow
                          label="Temps engagé"
                          value={formatDuration(page.engagedMs)}
                        />
                        <DetailRow
                          label="Événements"
                          value={String(page.eventCount)}
                        />
                        <DetailRow
                          label="Dernier passage"
                          value={formatDateTime(page.lastLeftAt)}
                        />
                      </div>
                    </div>
                  ))
                )}
              </SectionCard>

              <SectionCard
                title="Personnes les plus vues dans l’arbre"
                description="Top des fiches consultées dans l’arbre familial."
              >
                {trackingTopTreePeople.length === 0 ? (
                  <EmptyBlock text="Aucune vue d’arbre enregistrée." />
                ) : (
                  trackingTopTreePeople.map((person) => (
                    <div
                      key={person.personId}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="text-sm font-black text-slate-900">
                        {person.personLabel}
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <DetailRow label="Vues" value={String(person.views)} />
                        <DetailRow
                          label="Temps visible"
                          value={formatDuration(person.visibleMs)}
                        />
                        <DetailRow
                          label="Temps engagé"
                          value={formatDuration(person.engagedMs)}
                        />
                        <DetailRow
                          label="Événements"
                          value={String(person.eventCount)}
                        />
                        <DetailRow
                          label="Dernier passage"
                          value={formatDateTime(person.lastLeftAt)}
                        />
                      </div>
                    </div>
                  ))
                )}
              </SectionCard>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <EmptyBlock text="Aucune donnée de tracking disponible." />
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
            <MessageSquare size={20} />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">Notes admin</div>
            <div className="mt-1 text-sm font-medium text-slate-700">
              Zone placeholder pour enrichissements futurs.
            </div>
          </div>
        </div>

        <div className="mt-4">
          <EmptyBlock text="Placeholder : observations, suivi manuel, besoins de relance, statut qualité des données." />
        </div>
      </section>
    </div>
  );
}