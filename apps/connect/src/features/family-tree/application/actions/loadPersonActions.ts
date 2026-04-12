import type { FamilyTreeAction } from "../../types/actions";
import { getMyPersonIdentityClaim } from "../../data/identity/getMyPersonIdentityClaim";
import { getMyPersonVisibilityRequest } from "../../data/visibility/getMyPersonVisibilityRequest";
import { getPersonContributionStats } from "../../data/reactions/getPersonContributionStats";
import { getPersonContext } from "../../config/configGenealogy";
import type { PersonUiOverride } from "../../data/profiles/uiOverrides";
import type { PersonVisibilityPreferenceMap } from "../../types/visibility";
import type { FamilyTreePermissionSet } from "../../types/permissions";

export type LoadPersonActionsParams = {
  eventSlug: string;
  participantId: string | null;
  personId: string;
  visibilityPreferencesByPersonId?: PersonVisibilityPreferenceMap;
  sosaReferencePersonId?: string | null;
  overridesByPersonId?: Record<string, PersonUiOverride>;
  permissions?: FamilyTreePermissionSet;
};

export async function loadPersonActions({
  eventSlug,
  participantId,
  personId,
  visibilityPreferencesByPersonId,
  sosaReferencePersonId,
  overridesByPersonId,
  permissions
}: LoadPersonActionsParams): Promise<FamilyTreeAction[]> {
  const context = getPersonContext(
    personId,
    visibilityPreferencesByPersonId,
    sosaReferencePersonId,
    overridesByPersonId,
  );

  const [claim, visibilityRequest, stats] = await Promise.all([
    participantId
      ? getMyPersonIdentityClaim({
          eventSlug,
          participantId,
        }).catch(() => null)
      : Promise.resolve(null),
    participantId
      ? getMyPersonVisibilityRequest({
          eventSlug,
          participantId,
          personId,
        }).catch(() => null)
      : Promise.resolve(null),
    getPersonContributionStats({
      eventSlug,
      personId,
    }).catch(() => ({
      memoriesCount: 0,
      photosCount: 0,
      reactionsCount: 0,
      knownCount: 0,
      heardCount: 0,
    })),
  ]);

  const actions: FamilyTreeAction[] = [];
  const normalizedClaimPersonId = claim?.person_id?.trim() ?? "";

  const canAssistInPerson =
  permissions?.["family_tree.assist_in_person"] === true;

  const isApprovedClaimForCurrentPerson =
    claim?.claim_status === "approved" && normalizedClaimPersonId === personId;

  const hasPendingClaimForCurrentPerson =
    claim?.claim_status === "pending" && normalizedClaimPersonId === personId;

  const canDisplay = context.person.canDisplay;

  if (!isApprovedClaimForCurrentPerson) {
    actions.push({
      id: `person:${personId}:fix_identity`,
      type: "fix_identity",
      status: hasPendingClaimForCurrentPerson ? "pending" : "available",
      personId,
      title: hasPendingClaimForCurrentPerson
        ? "Vérification en cours"
        : "Je pense que cette fiche me correspond",
      description: hasPendingClaimForCurrentPerson
        ? "Ta demande a été transmise à l’organisation."
        : "Demande la vérification si cette personne, c’est toi.",
      ctaLabel: hasPendingClaimForCurrentPerson ? "En attente" : "Demander",
      priority: 100,
      source: "family-tree",
    });
  }

  if (!canDisplay) {
    actions.push({
      id: `person:${personId}:request_visibility`,
      type: "request_visibility",
      status:
        visibilityRequest?.request_status === "pending"
          ? "pending"
          : visibilityRequest?.request_status === "approved"
            ? "done"
            : "available",
      personId,
      title: "Demander l’affichage de cette fiche",
      description:
        "Si cette personne ne peut pas faire la démarche elle-même, tu peux demander une ouverture contrôlée.",
      ctaLabel:
        visibilityRequest?.request_status === "pending" ? "En attente" : "Demander",
      priority: 95,
      source: "family-tree",
    });
  }

  if (canDisplay) {
    actions.push({
      id: `person:${personId}:add_memory`,
      type: "add_memory",
      status: "available",
      personId,
      title: "Ajouter un souvenir",
      description:
        stats.memoriesCount > 0
          ? "Cette fiche contient déjà des souvenirs. Tu peux en ajouter un autre."
          : "Partage un souvenir ou une anecdote sur cette personne.",
      ctaLabel: "Ajouter",
      priority: 80,
      source: "family-tree",
    });

    actions.push({
      id: `person:${personId}:add_photo`,
      type: "add_photo",
      status: "available",
      personId,
      title: "Ajouter une photo",
      description:
        stats.photosCount > 0
          ? "Tu peux compléter cette fiche avec d’autres photos."
          : "Propose une photo pour enrichir cette fiche.",
      ctaLabel: "Ajouter",
      priority: 75,
      source: "family-tree",
    });
  }

  if (context.parents.length === 0) {
    actions.push({
      id: `person:${personId}:add_missing_parent`,
      type: "add_missing_parent",
      status: "suggested",
      personId,
      title: "Ajouter un parent manquant",
      description:
        "Aucun parent n’est actuellement identifié sur cette fiche.",
      ctaLabel: "Proposer",
      priority: 70,
      source: "tree-contribute",
      payload: {
        relationType: "parent",
      },
    });
  }

  if (context.spouses.length === 0) {
    actions.push({
      id: `person:${personId}:add_missing_spouse`,
      type: "add_missing_spouse",
      status: "suggested",
      personId,
      title: "Ajouter un conjoint manquant",
      description:
        "Tu peux signaler une union absente si tu sais qu’elle a existé.",
      ctaLabel: "Proposer",
      priority: 60,
      source: "tree-contribute",
      payload: {
        relationType: "spouse",
      },
    });
  }

  if (context.children.length === 0) {
    actions.push({
      id: `person:${personId}:add_missing_child`,
      type: "add_missing_child",
      status: "suggested",
      personId,
      title: "Ajouter un enfant manquant",
      description:
        "Tu peux proposer un enfant absent si cette fiche semble incomplète.",
      ctaLabel: "Proposer",
      priority: 55,
      source: "tree-contribute",
      payload: {
        relationType: "child",
      },
    });
  }

  actions.push({
    id: `person:${personId}:fix_name`,
    type: "fix_name",
    status: "available",
    personId,
    title: "Corriger le nom ou le prénom",
    description:
      "Signale une erreur sur l’identité de cette personne.",
    ctaLabel: "Signaler",
    priority: 50,
    source: "tree-contribute",
  });

  actions.push({
    id: `person:${personId}:fix_birth`,
    type: "fix_birth",
    status: "available",
    personId,
    title: "Corriger la naissance",
    description:
      "Propose une correction sur la date ou le lieu de naissance.",
    ctaLabel: "Signaler",
    priority: 45,
    source: "tree-contribute",
  });

  actions.push({
    id: `person:${personId}:fix_death`,
    type: "fix_death",
    status: "available",
    personId,
    title: "Corriger le décès",
    description:
      "Propose une correction sur la date ou le lieu de décès.",
    ctaLabel: "Signaler",
    priority: 40,
    source: "tree-contribute",
  });

  if (canAssistInPerson) {
  actions.push({
    id: `person:${personId}:assist_in_person`,
    type: "assist_in_person",
    status: "available",
    personId,
    title: "Je suis en face de cette personne",
    description:
      "Déclare sa présence, recueille ses choix de visibilité et aide-la à apparaître dans l’arbre.",
    ctaLabel: "Commencer",
    priority: 110,
    source: "family-tree",
  });
}

  return actions.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}