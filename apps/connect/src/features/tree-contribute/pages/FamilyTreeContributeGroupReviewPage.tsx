// pages/FamilyTreeContributeGroupReviewPage.tsx

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Baby,
  HeartHandshake,
  Milestone,
  UserRound,
  Users,
} from "lucide-react";

import {
  GroupReviewItemCard,
  type GroupReviewDecisionType,
} from "../components/GroupReviewItemCard";
import { PendingGedcomActionsCard } from "../components/PendingGedcomActionsCard";
import { InvitationSummaryCard } from "../components/InvitationSummaryCard";
import { ContributeGroupHeader } from "../components/ContributeGroupHeader";
import { ContributeSubmitFooter } from "../components/ContributeSubmitFooter";

type GroupKey =
  | "parents"
  | "siblings"
  | "partner"
  | "children"
  | "grandparents";

type GroupReviewItem = {
  id: string;
  roleLabel: string;
  displayName: string;
  decision: GroupReviewDecisionType;
  summary: string;
  comment?: string | null;
  shouldAppearInTree?: boolean | null;
  displayChoiceLabel?: string | null;
  invitationLabel?: string | null;
};

type GroupReviewData = {
  title: string;
  subtitle: string;
  progressLabel?: string;
  icon:
    | typeof UserRound
    | typeof Users
    | typeof HeartHandshake
    | typeof Baby
    | typeof Milestone;
  items: GroupReviewItem[];
  gedcomCounts: {
    confirmCount?: number;
    completeCount?: number;
    correctCount?: number;
    createPersonCount?: number;
    createRelationCount?: number;
  };
  invitationCounts: {
    inviteAdultCount?: number;
    managedByRelativeCount?: number;
    noInvitationCount?: number;
    minorProtectedCount?: number;
  };
};

function getMockGroupReviewData(groupKey: GroupKey): GroupReviewData {
  switch (groupKey) {
    case "parents":
      return {
        title: "Récapitulatif · Tes parents",
        subtitle:
          "Vérifie les décisions prises pour ton père et ta mère avant de passer au groupe suivant.",
        progressLabel: "2 sur 2 relus",
        icon: UserRound,
        items: [
          {
            id: "father",
            roleLabel: "Ton père",
            displayName: "Jean DUPONT",
            decision: "complete_existing",
            summary:
              "La fiche existante peut être complétée avec l’année de naissance et la bonne orthographe du nom.",
            comment:
              "Le nom est écrit DUPOND dans l’arbre. Je confirme DUPONT.",
            shouldAppearInTree: true,
            displayChoiceLabel: "Visible dans l’arbre partagé",
            invitationLabel: "Invitation à envoyer",
          },
          {
            id: "mother",
            roleLabel: "Ta mère",
            displayName: "Marie MARTIN",
            decision: "create_person",
            summary:
              "Aucune fiche correspondante n’a été trouvée dans l’arbre. Une nouvelle fiche devra être créée.",
            comment:
              "Je souhaite créer cette personne à partir des informations déjà renseignées.",
            shouldAppearInTree: true,
            displayChoiceLabel: "Visible dans l’arbre partagé",
            invitationLabel: "Invitation à envoyer",
          },
        ],
        gedcomCounts: {
          completeCount: 1,
          createPersonCount: 1,
          createRelationCount: 1,
        },
        invitationCounts: {
          inviteAdultCount: 2,
        },
      };

    case "siblings":
      return {
        title: "Récapitulatif · Tes frères et sœurs",
        subtitle:
          "Vérifie les décisions prises pour la fratrie avant de continuer.",
        progressLabel: "3 sur 3 relus",
        icon: Users,
        items: [
          {
            id: "sibling-1",
            roleLabel: "Frère / sœur 1",
            displayName: "Laura DUPONT",
            decision: "confirm_existing",
            summary:
              "La fiche existante est cohérente avec les informations partagées.",
            shouldAppearInTree: true,
            displayChoiceLabel: "Visible dans l’arbre partagé",
            invitationLabel: "Invitation à envoyer",
          },
          {
            id: "sibling-2",
            roleLabel: "Frère / sœur 2",
            displayName: "Kévin DUPONT",
            decision: "correct_existing",
            summary:
              "Une différence a été signalée sur la fiche existante et devra être vérifiée.",
            comment: "Le prénom usuel ne correspond pas à celui affiché.",
            shouldAppearInTree: true,
            displayChoiceLabel: "Décision plus tard",
            invitationLabel: "Sans invitation immédiate",
          },
          {
            id: "sibling-3",
            roleLabel: "Frère / sœur 3",
            displayName: "Mélina DUPONT",
            decision: "create_person",
            summary:
              "Aucune fiche existante n’a été trouvée. Une création d’individu est nécessaire.",
            shouldAppearInTree: true,
            displayChoiceLabel: "Visible dans l’arbre partagé",
            invitationLabel: "Invitation à envoyer",
          },
        ],
        gedcomCounts: {
          confirmCount: 1,
          correctCount: 1,
          createPersonCount: 1,
          createRelationCount: 1,
        },
        invitationCounts: {
          inviteAdultCount: 2,
          noInvitationCount: 1,
        },
      };

    case "partner":
      return {
        title: "Récapitulatif · Ton conjoint",
        subtitle:
          "Vérifie la décision retenue pour le conjoint avant de continuer.",
        progressLabel: "1 sur 1 relu",
        icon: HeartHandshake,
        items: [
          {
            id: "partner",
            roleLabel: "Conjoint / conjointe",
            displayName: "Amina RAHIM",
            decision: "confirm_existing",
            summary:
              "La fiche existante a été confirmée sans modification particulière.",
            shouldAppearInTree: true,
            displayChoiceLabel: "Visible dans l’arbre partagé",
            invitationLabel: "Invitation à envoyer",
          },
        ],
        gedcomCounts: {
          confirmCount: 1,
        },
        invitationCounts: {
          inviteAdultCount: 1,
        },
      };

    case "children":
      return {
        title: "Récapitulatif · Tes enfants",
        subtitle:
          "Vérifie pour chaque enfant la création de fiche, la visibilité et l’éventuelle invitation.",
        progressLabel: "3 sur 3 relus",
        icon: Baby,
        items: [
          {
            id: "child-1",
            roleLabel: "Enfant 1",
            displayName: "Sarah DUPONT",
            decision: "create_person",
            summary:
              "Une nouvelle fiche devra être créée et une invitation sera envoyée.",
            shouldAppearInTree: true,
            displayChoiceLabel: "Visible dans l’arbre partagé",
            invitationLabel: "Invitation à envoyer",
          },
          {
            id: "child-2",
            roleLabel: "Enfant 2",
            displayName: "Yanis DUPONT",
            decision: "create_person",
            summary:
              "Une nouvelle fiche devra être créée et une invitation sera envoyée.",
            shouldAppearInTree: true,
            displayChoiceLabel: "Visible dans l’arbre partagé",
            invitationLabel: "Invitation à envoyer",
          },
          {
            id: "child-3",
            roleLabel: "Enfant 3",
            displayName: "Lina DUPONT",
            decision: "create_person",
            summary:
              "Une nouvelle fiche devra être créée avec visibilité limitée, sans invitation directe.",
            comment:
              "Cette personne est mineure. La fiche sera gérée par un proche.",
            shouldAppearInTree: true,
            displayChoiceLabel: "Non visible pour le moment",
            invitationLabel: "Fiche gérée par un proche",
          },
        ],
        gedcomCounts: {
          createPersonCount: 3,
          createRelationCount: 3,
        },
        invitationCounts: {
          inviteAdultCount: 2,
          managedByRelativeCount: 1,
          minorProtectedCount: 1,
        },
      };

    case "grandparents":
      return {
        title: "Récapitulatif · Tes grands-parents",
        subtitle:
          "Vérifie les créations, compléments et différences avant de poursuivre.",
        progressLabel: "4 sur 4 relus",
        icon: Milestone,
        items: [
          {
            id: "paternal-grandfather",
            roleLabel: "Grand-père paternel",
            displayName: "André DUPONT",
            decision: "confirm_existing",
            summary:
              "La fiche a été confirmée telle quelle dans l’arbre.",
            shouldAppearInTree: true,
            displayChoiceLabel: "Visible dans l’arbre partagé",
          },
          {
            id: "paternal-grandmother",
            roleLabel: "Grand-mère paternelle",
            displayName: "Lucie DUPONT",
            decision: "complete_existing",
            summary:
              "La fiche existante peut être complétée avec des informations supplémentaires.",
            shouldAppearInTree: true,
            displayChoiceLabel: "Visible dans l’arbre partagé",
          },
          {
            id: "maternal-grandfather",
            roleLabel: "Grand-père maternel",
            displayName: "Joseph MARTIN",
            decision: "correct_existing",
            summary:
              "Une différence a été signalée sur la fiche existante.",
            comment: "La date affichée semble incorrecte.",
            shouldAppearInTree: true,
            displayChoiceLabel: "Visible dans l’arbre partagé",
          },
          {
            id: "maternal-grandmother",
            roleLabel: "Grand-mère maternelle",
            displayName: "Élise MARTIN",
            decision: "create_person",
            summary:
              "Cette personne devra être créée dans l’arbre.",
            shouldAppearInTree: true,
            displayChoiceLabel: "Visible dans l’arbre partagé",
          },
        ],
        gedcomCounts: {
          confirmCount: 1,
          completeCount: 1,
          correctCount: 1,
          createPersonCount: 1,
          createRelationCount: 1,
        },
        invitationCounts: {},
      };

    default:
      return {
        title: "Récapitulatif du groupe",
        subtitle: "Aucune donnée disponible.",
        icon: Users,
        items: [],
        gedcomCounts: {},
        invitationCounts: {},
      };
  }
}

const NEXT_GROUP_BY_KEY: Record<GroupKey, GroupKey | null> = {
  parents: "siblings",
  siblings: "partner",
  partner: "children",
  children: "grandparents",
  grandparents: null,
};

export function FamilyTreeContributeGroupReviewPage() {
  const navigate = useNavigate();
  const { eventSlug, groupKey } = useParams<{
    eventSlug: string;
    groupKey: GroupKey;
  }>();

  const slug = eventSlug ?? "demo";
  const safeGroupKey = (groupKey ?? "parents") as GroupKey;

  const group = useMemo(
    () => getMockGroupReviewData(safeGroupKey),
    [safeGroupKey],
  );

  const nextGroup = NEXT_GROUP_BY_KEY[safeGroupKey];

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-32 pt-3">
        <ContributeGroupHeader
          title={group.title}
          subtitle={group.subtitle}
          icon={group.icon}
          progressLabel={group.progressLabel}
          onBack={() => navigate(`/e/${slug}/tree/contribute/${safeGroupKey}`)}
        />

        <section className="mt-4 grid gap-3">
          {group.items.map((item) => (
            <GroupReviewItemCard
              key={item.id}
              roleLabel={item.roleLabel}
              displayName={item.displayName}
              decision={item.decision}
              summary={item.summary}
              comment={item.comment}
              shouldAppearInTree={item.shouldAppearInTree}
              displayChoiceLabel={item.displayChoiceLabel}
              invitationLabel={item.invitationLabel}
              onClick={() =>
                navigate(
                  `/e/${slug}/tree/contribute/${safeGroupKey}/${item.id}`,
                )
              }
            />
          ))}
        </section>

        <div className="mt-4">
          <PendingGedcomActionsCard counts={group.gedcomCounts} />
        </div>

        <div className="mt-4">
          <InvitationSummaryCard counts={group.invitationCounts} />
        </div>
      </main>

      <ContributeSubmitFooter
        secondaryLabel="Modifier ce groupe"
        onSecondaryAction={() =>
          navigate(`/e/${slug}/tree/contribute/${safeGroupKey}`)
        }
        submitLabel={
          nextGroup ? "Valider ce groupe" : "Voir le récapitulatif global"
        }
        onSubmit={() => {
          console.log("TODO submit group review", {
            groupKey: safeGroupKey,
          });

          if (nextGroup) {
            navigate(`/e/${slug}/tree/contribute/${nextGroup}`);
            return;
          }

          navigate(`/e/${slug}/tree/contribute/review`);
        }}
      />
    </div>
  );
}