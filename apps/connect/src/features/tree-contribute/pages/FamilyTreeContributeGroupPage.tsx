// pages/tree-contribute/FamilyTreeContributeGroupPage.tsx

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Baby,
  HeartHandshake,
  Milestone,
  UserRound,
  Users,
} from "lucide-react";

import { ContributeGroupHeader } from "../components/ContributeGroupHeader";
import { ContributePersonCard } from "../components/ContributePersonCard";
import { ContributeEmptyState } from "../components/ContributeEmptyState";

type GroupKey =
  | "parents"
  | "siblings"
  | "partner"
  | "children"
  | "grandparents";

type MatchStatus = "matched" | "missing" | "uncertain";
type ComparisonStatus =
  | "up_to_date"
  | "needs_completion"
  | "has_differences"
  | "not_started";

type GroupPersonItem = {
  personKey: string;
  roleLabel: string;
  displayName: string;
  matchStatus: MatchStatus;
  comparisonStatus: ComparisonStatus;
  isLiving?: boolean | null;
  isMinor?: boolean | null;
  invitationPossible?: boolean;
};

type GroupMeta = {
  title: string;
  subtitle: string;
  progressLabel?: string;
  icon:
    | typeof UserRound
    | typeof Users
    | typeof HeartHandshake
    | typeof Baby
    | typeof Milestone;
  items: GroupPersonItem[];
};

function getMockGroupMeta(groupKey: GroupKey): GroupMeta {
  switch (groupKey) {
    case "parents":
      return {
        title: "Tes parents",
        subtitle: "Choisis ton père ou ta mère pour comparer tes informations avec l’arbre.",
        progressLabel: "0 sur 2 relus",
        icon: UserRound,
        items: [
          {
            personKey: "father",
            roleLabel: "Ton père",
            displayName: "Jean DUPONT",
            matchStatus: "matched",
            comparisonStatus: "needs_completion",
            isLiving: true,
            isMinor: false,
            invitationPossible: true,
          },
          {
            personKey: "mother",
            roleLabel: "Ta mère",
            displayName: "Marie MARTIN",
            matchStatus: "missing",
            comparisonStatus: "not_started",
            isLiving: true,
            isMinor: false,
            invitationPossible: true,
          },
        ],
      };

    case "siblings":
      return {
        title: "Tes frères et sœurs",
        subtitle: "Passe en revue chaque personne pour voir si la fiche existe déjà.",
        progressLabel: "1 sur 3 relu",
        icon: Users,
        items: [
          {
            personKey: "sibling-1",
            roleLabel: "Frère / sœur 1",
            displayName: "Laura DUPONT",
            matchStatus: "matched",
            comparisonStatus: "up_to_date",
            isLiving: true,
            isMinor: false,
            invitationPossible: true,
          },
          {
            personKey: "sibling-2",
            roleLabel: "Frère / sœur 2",
            displayName: "Kévin DUPONT",
            matchStatus: "uncertain",
            comparisonStatus: "has_differences",
            isLiving: true,
            isMinor: false,
            invitationPossible: true,
          },
          {
            personKey: "sibling-3",
            roleLabel: "Frère / sœur 3",
            displayName: "Mélina DUPONT",
            matchStatus: "missing",
            comparisonStatus: "not_started",
            isLiving: true,
            isMinor: false,
            invitationPossible: true,
          },
        ],
      };

    case "partner":
      return {
        title: "Ton conjoint",
        subtitle: "Vérifie si la fiche existante est correcte ou à compléter.",
        progressLabel: "1 sur 1 relu",
        icon: HeartHandshake,
        items: [
          {
            personKey: "partner",
            roleLabel: "Conjoint / conjointe",
            displayName: "Amina RAHIM",
            matchStatus: "matched",
            comparisonStatus: "up_to_date",
            isLiving: true,
            isMinor: false,
            invitationPossible: true,
          },
        ],
      };

    case "children":
      return {
        title: "Tes enfants",
        subtitle: "Précise pour chacun s’il doit apparaître dans l’arbre et s’il faut l’inviter.",
        progressLabel: "0 sur 3 relu",
        icon: Baby,
        items: [
          {
            personKey: "child-1",
            roleLabel: "Enfant 1",
            displayName: "Sarah DUPONT",
            matchStatus: "missing",
            comparisonStatus: "not_started",
            isLiving: true,
            isMinor: false,
            invitationPossible: true,
          },
          {
            personKey: "child-2",
            roleLabel: "Enfant 2",
            displayName: "Yanis DUPONT",
            matchStatus: "missing",
            comparisonStatus: "not_started",
            isLiving: true,
            isMinor: false,
            invitationPossible: true,
          },
          {
            personKey: "child-3",
            roleLabel: "Enfant 3",
            displayName: "Lina DUPONT",
            matchStatus: "missing",
            comparisonStatus: "not_started",
            isLiving: true,
            isMinor: true,
            invitationPossible: false,
          },
        ],
      };

    case "grandparents":
      return {
        title: "Tes grands-parents",
        subtitle: "Compare les fiches des quatre grands-parents avec l’arbre existant.",
        progressLabel: "1 sur 4 relu",
        icon: Milestone,
        items: [
          {
            personKey: "paternal-grandfather",
            roleLabel: "Grand-père paternel",
            displayName: "André DUPONT",
            matchStatus: "matched",
            comparisonStatus: "up_to_date",
            isLiving: false,
            isMinor: false,
            invitationPossible: false,
          },
          {
            personKey: "paternal-grandmother",
            roleLabel: "Grand-mère paternelle",
            displayName: "Lucie DUPONT",
            matchStatus: "matched",
            comparisonStatus: "needs_completion",
            isLiving: false,
            isMinor: false,
            invitationPossible: false,
          },
          {
            personKey: "maternal-grandfather",
            roleLabel: "Grand-père maternel",
            displayName: "Joseph MARTIN",
            matchStatus: "matched",
            comparisonStatus: "has_differences",
            isLiving: false,
            isMinor: false,
            invitationPossible: false,
          },
          {
            personKey: "maternal-grandmother",
            roleLabel: "Grand-mère maternelle",
            displayName: "Élise MARTIN",
            matchStatus: "missing",
            comparisonStatus: "not_started",
            isLiving: false,
            isMinor: false,
            invitationPossible: false,
          },
        ],
      };

    default:
      return {
        title: "Groupe",
        subtitle: "Aucune donnée disponible.",
        icon: Users,
        items: [],
      };
  }
}

export function FamilyTreeContributeGroupPage() {
  const navigate = useNavigate();
  const { eventSlug, groupKey } = useParams<{
    eventSlug: string;
    groupKey: GroupKey;
  }>();

  const slug = eventSlug ?? "demo";
  const safeGroupKey = (groupKey ?? "parents") as GroupKey;

  const group = useMemo(
    () => getMockGroupMeta(safeGroupKey),
    [safeGroupKey],
  );

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-3">
        <ContributeGroupHeader
          title={group.title}
          subtitle={group.subtitle}
          icon={group.icon}
          progressLabel={group.progressLabel}
          onBack={() => navigate(`/e/${slug}/tree/contribute`)}
        />

        <section className="mt-4 grid gap-3">
          {group.items.length === 0 ? (
            <ContributeEmptyState text="Aucune personne n’est disponible dans ce groupe pour le moment." />
          ) : (
            group.items.map((person) => (
              <ContributePersonCard
                key={person.personKey}
                roleLabel={person.roleLabel}
                displayName={person.displayName}
                matchStatus={person.matchStatus}
                comparisonStatus={person.comparisonStatus}
                isLiving={person.isLiving}
                isMinor={person.isMinor}
                invitationPossible={person.invitationPossible}
                onClick={() =>
                  navigate(
                    `/e/${slug}/tree/contribute/${safeGroupKey}/${person.personKey}`,
                  )
                }
              />
            ))
          )}
        </section>
      </main>
    </div>
  );
}