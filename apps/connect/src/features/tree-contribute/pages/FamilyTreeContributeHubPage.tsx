// pages/tree-contribute/FamilyTreeContributeHubPage.tsx

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Baby,
  HeartHandshake,
  Milestone,
  UserRound,
  Users,
} from "lucide-react";

import { ContributeIntroCard } from "../components/ContributeIntroCard";
import { ContributeProgressBanner } from "../components/ContributeProgressBanner";
import { ContributeGroupHubCard } from "../components/ContributeGroupHubCard";

type GroupKey =
  | "parents"
  | "siblings"
  | "partner"
  | "children"
  | "grandparents";

type GroupSummary = {
  key: GroupKey;
  title: string;
  subtitle: string;
  totalPersons: number;
  matchedCount: number;
  missingCount: number;
  needsReviewCount: number;
  completed: boolean;
  icon:
    | typeof UserRound
    | typeof Users
    | typeof HeartHandshake
    | typeof Baby
    | typeof Milestone;
};

function getMockGroupSummaries(): GroupSummary[] {
  return [
    {
      key: "parents",
      title: "Tes parents",
      subtitle: "Comparer les informations sur ton père et ta mère.",
      totalPersons: 2,
      matchedCount: 1,
      missingCount: 1,
      needsReviewCount: 1,
      completed: false,
      icon: UserRound,
    },
    {
      key: "siblings",
      title: "Tes frères et sœurs",
      subtitle: "Retrouver les fiches existantes et repérer celles à créer.",
      totalPersons: 3,
      matchedCount: 2,
      missingCount: 1,
      needsReviewCount: 1,
      completed: false,
      icon: Users,
    },
    {
      key: "partner",
      title: "Ton conjoint",
      subtitle: "Comparer la fiche existante ou créer la personne manquante.",
      totalPersons: 1,
      matchedCount: 1,
      missingCount: 0,
      needsReviewCount: 0,
      completed: true,
      icon: HeartHandshake,
    },
    {
      key: "children",
      title: "Tes enfants",
      subtitle: "Préciser qui doit apparaître dans l’arbre et qui inviter.",
      totalPersons: 3,
      matchedCount: 0,
      missingCount: 3,
      needsReviewCount: 3,
      completed: false,
      icon: Baby,
    },
    {
      key: "grandparents",
      title: "Tes grands-parents",
      subtitle: "Comparer les quatre grands-parents avec l’arbre familial.",
      totalPersons: 4,
      matchedCount: 3,
      missingCount: 1,
      needsReviewCount: 2,
      completed: false,
      icon: Milestone,
    },
  ];
}

export function FamilyTreeContributeHubPage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const groups = useMemo(() => getMockGroupSummaries(), []);
  const completedGroups = groups.filter((group) => group.completed).length;
  const totalPersons = groups.reduce((sum, group) => sum + group.totalPersons, 0);
  const reviewedPersons = groups
    .filter((group) => group.completed)
    .reduce((sum, group) => sum + group.totalPersons, 0);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-3">
        <ContributeIntroCard
          ctaLabel="Commencer"
          onClick={() => navigate(`/e/${slug}/tree/contribute/parents`)}
        />

        <div className="mt-4">
          <ContributeProgressBanner
            totalGroups={groups.length}
            completedGroups={completedGroups}
            reviewedPersons={reviewedPersons}
            totalPersons={totalPersons}
          />
        </div>

        <section className="mt-4 grid gap-3">
          {groups.map((group) => (
            <ContributeGroupHubCard
              key={group.key}
              title={group.title}
              subtitle={group.subtitle}
              icon={group.icon}
              totalPersons={group.totalPersons}
              matchedCount={group.matchedCount}
              missingCount={group.missingCount}
              needsReviewCount={group.needsReviewCount}
              completed={group.completed}
              onClick={() =>
                navigate(`/e/${slug}/tree/contribute/${group.key}`)
              }
            />
          ))}
        </section>
      </main>
    </div>
  );
}