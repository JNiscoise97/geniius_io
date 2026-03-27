// pages/FamilyTreeContributeReviewPage.tsx

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ContributeGlobalReviewSection,
  type GlobalReviewGroup,
} from "../components/ContributeGlobalReviewSection";
import { PendingGedcomActionsCard } from "../components/PendingGedcomActionsCard";
import { InvitationSummaryCard } from "../components/InvitationSummaryCard";
import { ContributeSubmitFooter } from "../components/ContributeSubmitFooter";
import { ContributeGroupHeader } from "../components/ContributeGroupHeader";
import { ListChecks } from "lucide-react";

function getMockGlobalReviewGroups(
  slug: string,
  navigate: ReturnType<typeof useNavigate>,
): GlobalReviewGroup[] {
  return [
    {
      groupKey: "parents",
      title: "Tes parents",
      subtitle: "2 décisions prises",
      completedCount: 2,
      totalCount: 2,
      items: [
        {
          id: "father",
          roleLabel: "Ton père",
          displayName: "Jean DUPONT",
          decision: "complete_existing",
          summary:
            "Compléter la fiche existante avec l’année de naissance et corriger le nom.",
          comment: "Le nom affiché dans l’arbre est erroné.",
          shouldAppearInTree: true,
          displayChoiceLabel: "Visible dans l’arbre partagé",
          invitationLabel: "Invitation à envoyer",
          onClick: () =>
            navigate(`/e/${slug}/tree/contribute/parents/father`),
        },
        {
          id: "mother",
          roleLabel: "Ta mère",
          displayName: "Marie MARTIN",
          decision: "create_person",
          summary:
            "Créer une nouvelle fiche à partir des informations partagées.",
          shouldAppearInTree: true,
          displayChoiceLabel: "Visible dans l’arbre partagé",
          invitationLabel: "Invitation à envoyer",
          onClick: () =>
            navigate(`/e/${slug}/tree/contribute/parents/mother`),
        },
      ],
    },
    {
      groupKey: "partner",
      title: "Ton conjoint",
      subtitle: "1 décision prise",
      completedCount: 1,
      totalCount: 1,
      items: [
        {
          id: "partner",
          roleLabel: "Conjoint / conjointe",
          displayName: "Amina RAHIM",
          decision: "confirm_existing",
          summary: "La fiche existante a été confirmée.",
          shouldAppearInTree: true,
          displayChoiceLabel: "Visible dans l’arbre partagé",
          invitationLabel: "Invitation à envoyer",
          onClick: () =>
            navigate(`/e/${slug}/tree/contribute/partner/partner`),
        },
      ],
    },
    {
      groupKey: "children",
      title: "Tes enfants",
      subtitle: "3 décisions prises",
      completedCount: 3,
      totalCount: 3,
      items: [
        {
          id: "child-1",
          roleLabel: "Enfant 1",
          displayName: "Sarah DUPONT",
          decision: "create_person",
          summary:
            "Créer la fiche et envoyer une invitation à cette personne majeure.",
          shouldAppearInTree: true,
          displayChoiceLabel: "Visible dans l’arbre partagé",
          invitationLabel: "Invitation à envoyer",
          onClick: () =>
            navigate(`/e/${slug}/tree/contribute/children/child-1`),
        },
        {
          id: "child-2",
          roleLabel: "Enfant 2",
          displayName: "Yanis DUPONT",
          decision: "create_person",
          summary:
            "Créer la fiche et envoyer une invitation à cette personne majeure.",
          shouldAppearInTree: true,
          displayChoiceLabel: "Visible dans l’arbre partagé",
          invitationLabel: "Invitation à envoyer",
          onClick: () =>
            navigate(`/e/${slug}/tree/contribute/children/child-2`),
        },
        {
          id: "child-3",
          roleLabel: "Enfant 3",
          displayName: "Lina DUPONT",
          decision: "create_person",
          summary:
            "Créer la fiche avec visibilité limitée, sans invitation directe.",
          comment: "Personne mineure gérée par un proche.",
          shouldAppearInTree: true,
          displayChoiceLabel: "Non visible pour le moment",
          invitationLabel: "Fiche gérée par un proche",
          onClick: () =>
            navigate(`/e/${slug}/tree/contribute/children/child-3`),
        },
      ],
    },
  ];
}

export function FamilyTreeContributeReviewPage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [loading, setLoading] = useState(false);

  const groups = useMemo(
    () => getMockGlobalReviewGroups(slug, navigate),
    [slug, navigate],
  );

  const gedcomCounts = useMemo(() => {
    return {
      confirmCount: 1,
      completeCount: 1,
      correctCount: 0,
      createPersonCount: 4,
      createRelationCount: 4,
    };
  }, []);

  const invitationCounts = useMemo(() => {
    return {
      inviteAdultCount: 4,
      managedByRelativeCount: 1,
      noInvitationCount: 0,
      minorProtectedCount: 1,
    };
  }, []);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-32 pt-3">
        <ContributeGroupHeader
          title="Récapitulatif global"
          subtitle="Vérifie l’ensemble de tes propositions avant l’envoi final à l’organisation."
          icon={ListChecks}
          progressLabel="Prêt pour l’envoi"
          onBack={() => navigate(`/e/${slug}/tree/contribute/grandparents/review`)}
        />

        <div className="mt-4">
          <ContributeGlobalReviewSection groups={groups} />
        </div>

        <div className="mt-4">
          <PendingGedcomActionsCard counts={gedcomCounts} />
        </div>

        <div className="mt-4">
          <InvitationSummaryCard counts={invitationCounts} />
        </div>
      </main>

      <ContributeSubmitFooter
        loading={loading}
        secondaryLabel="Relire encore"
        onSecondaryAction={() => navigate(`/e/${slug}/tree/contribute`)}
        submitLabel="Envoyer mes propositions"
        loadingLabel="Envoi en cours…"
        onSubmit={async () => {
          try {
            setLoading(true);

            console.log("TODO submit global tree contribution review", {
              eventSlug: slug,
            });

            navigate(`/e/${slug}/tree/contribute`);
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
}