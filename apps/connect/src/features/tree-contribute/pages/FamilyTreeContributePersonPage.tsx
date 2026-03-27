// pages/FamilyTreeContributePersonPage.tsx

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Baby,
  HeartHandshake,
  Milestone,
  UserRound,
  Users,
} from "lucide-react";

import { ContributePersonHero } from "../components/ContributePersonHero";
import { ComparisonSummaryCard } from "../components/ComparisonSummaryCard";
import {
  ComparisonFieldList,
} from "../components/ComparisonFieldList";
import type {
  ComparisonFieldRowData,
} from "../components/ComparisonFieldRow";
import {
  MergeDecisionCard,
} from "../components/MergeDecisionCard";
import type {
  MergeDecisionValue,
} from "../components/MergeDecisionField";
import {
  VisibilityInvitationCard,
} from "../components/VisibilityInvitationCard";
import type {
  VisibilityInvitationMode,
} from "../components/VisibilityInvitationCard";
import type {
  PersonDisplayChoiceValue,
} from "../components/PersonDisplayChoiceField";
import { ContributeSubmitFooter } from "../components/ContributeSubmitFooter";

type GroupKey =
  | "parents"
  | "siblings"
  | "partner"
  | "children"
  | "grandparents";

type PersonPageData = {
  roleLabel: string;
  displayName: string;
  subtitle: string;
  isLiving: boolean | null;
  isMinor: boolean | null;
  invitationPossible: boolean;
  matched: boolean;
  matchedPersonLabel?: string;
  icon:
    | typeof UserRound
    | typeof Users
    | typeof HeartHandshake
    | typeof Baby
    | typeof Milestone;
  fields: ComparisonFieldRowData[];
};

function getMockPersonData(
  groupKey: GroupKey,
  personKey: string,
): PersonPageData {
  if (groupKey === "parents" && personKey === "father") {
    return {
      roleLabel: "Ton père",
      displayName: "Jean DUPONT",
      subtitle:
        "Compare les informations que tu as déjà partagées avec la fiche trouvée dans l’arbre.",
      isLiving: true,
      isMinor: false,
      invitationPossible: true,
      matched: true,
      matchedPersonLabel: "Jean DUPOND (fiche existante)",
      icon: UserRound,
      fields: [
        {
          fieldKey: "firstName",
          label: "Prénom",
          familyKnowledgeValue: "Jean",
          treeValue: "Jean",
          status: "same",
        },
        {
          fieldKey: "lastName",
          label: "Nom",
          familyKnowledgeValue: "DUPONT",
          treeValue: "DUPOND",
          status: "different",
        },
        {
          fieldKey: "birthYear",
          label: "Année de naissance",
          familyKnowledgeValue: "1962",
          treeValue: "",
          status: "missing_in_tree",
        },
        {
          fieldKey: "nickname",
          label: "Surnom",
          familyKnowledgeValue: "",
          treeValue: "",
          status: "not_provided",
        },
      ],
    };
  }

  if (groupKey === "parents" && personKey === "mother") {
    return {
      roleLabel: "Ta mère",
      displayName: "Marie MARTIN",
      subtitle:
        "Aucune fiche correspondante n’a été trouvée dans l’arbre pour le moment.",
      isLiving: true,
      isMinor: false,
      invitationPossible: true,
      matched: false,
      icon: UserRound,
      fields: [
        {
          fieldKey: "firstName",
          label: "Prénom",
          familyKnowledgeValue: "Marie",
          treeValue: "",
          status: "missing_in_tree",
        },
        {
          fieldKey: "lastName",
          label: "Nom",
          familyKnowledgeValue: "MARTIN",
          treeValue: "",
          status: "missing_in_tree",
        },
        {
          fieldKey: "birthYear",
          label: "Année de naissance",
          familyKnowledgeValue: "1965",
          treeValue: "",
          status: "missing_in_tree",
        },
      ],
    };
  }

  if (groupKey === "children" && personKey === "child-1") {
    return {
      roleLabel: "Enfant 1",
      displayName: "Sarah DUPONT",
      subtitle:
        "Cette personne n’existe pas encore dans l’arbre. Tes informations peuvent servir à créer la fiche.",
      isLiving: true,
      isMinor: false,
      invitationPossible: true,
      matched: false,
      icon: Baby,
      fields: [
        {
          fieldKey: "firstName",
          label: "Prénom",
          familyKnowledgeValue: "Sarah",
          treeValue: "",
          status: "missing_in_tree",
        },
        {
          fieldKey: "lastName",
          label: "Nom",
          familyKnowledgeValue: "DUPONT",
          treeValue: "",
          status: "missing_in_tree",
        },
        {
          fieldKey: "birthYear",
          label: "Année de naissance",
          familyKnowledgeValue: "2001",
          treeValue: "",
          status: "missing_in_tree",
        },
      ],
    };
  }

  if (groupKey === "children" && personKey === "child-3") {
    return {
      roleLabel: "Enfant 3",
      displayName: "Lina DUPONT",
      subtitle:
        "Cette personne est mineure. Les informations pourront être ajoutées avec une visibilité limitée.",
      isLiving: true,
      isMinor: true,
      invitationPossible: false,
      matched: false,
      icon: Baby,
      fields: [
        {
          fieldKey: "firstName",
          label: "Prénom",
          familyKnowledgeValue: "Lina",
          treeValue: "",
          status: "missing_in_tree",
        },
        {
          fieldKey: "lastName",
          label: "Nom",
          familyKnowledgeValue: "DUPONT",
          treeValue: "",
          status: "missing_in_tree",
        },
      ],
    };
  }

  return {
    roleLabel: "Personne",
    displayName: "Fiche à comparer",
    subtitle: "Exemple de comparaison entre tes informations et l’arbre.",
    isLiving: true,
    isMinor: false,
    invitationPossible: true,
    matched: true,
    matchedPersonLabel: "Fiche trouvée",
    icon: Users,
    fields: [
      {
        fieldKey: "firstName",
        label: "Prénom",
        familyKnowledgeValue: "Exemple",
        treeValue: "Exemple",
        status: "same",
      },
    ],
  };
}

export function FamilyTreeContributePersonPage() {
  const navigate = useNavigate();
  const { eventSlug, groupKey, personKey } = useParams<{
    eventSlug: string;
    groupKey: GroupKey;
    personKey: string;
  }>();

  const slug = eventSlug ?? "demo";
  const safeGroupKey = (groupKey ?? "parents") as GroupKey;
  const safePersonKey = personKey ?? "unknown";

  const person = useMemo(
    () => getMockPersonData(safeGroupKey, safePersonKey),
    [safeGroupKey, safePersonKey],
  );

  const [decision, setDecision] = useState<MergeDecisionValue>(
    person.matched ? "" : "create_person",
  );
  const [comment, setComment] = useState("");
  const [shouldAppearInTree, setShouldAppearInTree] = useState<boolean | null>(
    true,
  );
  const [invitationMode, setInvitationMode] =
    useState<VisibilityInvitationMode>(
      person.isMinor ? "managed_by_relative" : "none",
    );
  const [displayChoice, setDisplayChoice] =
    useState<PersonDisplayChoiceValue>(person.isMinor ? "no" : "yes");
  const [inviteEmail, setInviteEmail] = useState("");

  const sameCount = person.fields.filter((field) => field.status === "same").length;
  const missingInTreeCount = person.fields.filter(
    (field) => field.status === "missing_in_tree",
  ).length;
  const differentCount = person.fields.filter(
    (field) => field.status === "different",
  ).length;
  const missingInFamilyKnowledgeCount = person.fields.filter(
    (field) => field.status === "missing_in_family_knowledge",
  ).length;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-32 pt-3">
        <ContributePersonHero
          roleLabel={person.roleLabel}
          displayName={person.displayName}
          subtitle={person.subtitle}
          isLiving={person.isLiving}
          isMinor={person.isMinor}
          invitationPossible={person.invitationPossible}
          icon={person.icon}
        />

        <div className="mt-4">
          <ComparisonSummaryCard
            matched={person.matched}
            sameCount={sameCount}
            missingInTreeCount={missingInTreeCount}
            differentCount={differentCount}
            missingInFamilyKnowledgeCount={missingInFamilyKnowledgeCount}
            matchedPersonLabel={person.matchedPersonLabel}
          />
        </div>

        <div className="mt-4">
          <ComparisonFieldList fields={person.fields} />
        </div>

        <div className="mt-4">
          <MergeDecisionCard
            value={decision}
            onChange={setDecision}
            comment={comment}
            onChangeComment={setComment}
            matched={person.matched}
          />
        </div>

        <div className="mt-4">
          <VisibilityInvitationCard
            shouldAppearInTree={shouldAppearInTree}
            onChangeShouldAppearInTree={setShouldAppearInTree}
            invitationMode={invitationMode}
            onChangeInvitationMode={setInvitationMode}
            displayChoice={displayChoice}
            onChangeDisplayChoice={setDisplayChoice}
            inviteEmail={inviteEmail}
            onChangeInviteEmail={setInviteEmail}
            isLiving={person.isLiving}
            isMinor={person.isMinor}
          />
        </div>
      </main>

      <ContributeSubmitFooter
        secondaryLabel="Retour au groupe"
        onSecondaryAction={() =>
          navigate(`/e/${slug}/tree/contribute/${safeGroupKey}`)
        }
        onSubmit={() => {
          console.log("TODO save person contribution", {
            groupKey: safeGroupKey,
            personKey: safePersonKey,
            decision,
            comment,
            shouldAppearInTree,
            invitationMode,
            displayChoice,
            inviteEmail,
          });

          navigate(`/e/${slug}/tree/contribute/${safeGroupKey}`);
        }}
      />
    </div>
  );
}