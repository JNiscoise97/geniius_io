import type { FamilyTreeAction } from "../../types/actions";
import { getMyPersonIdentityClaim } from "../../data/identity/getMyPersonIdentityClaim";
import { getParticipantDefaultGedcomPersonId } from "../../data/profiles/getParticipantDefaultGedcomPersonId";

export type LoadFamilyTreeActionsParams = {
  eventSlug: string;
  participantId: string | null;
};

export async function loadFamilyTreeActions({
  eventSlug,
  participantId,
}: LoadFamilyTreeActionsParams): Promise<FamilyTreeAction[]> {
  if (!participantId) {
    return [
      {
        id: "family-tree:identify-self",
        type: "identify_self",
        status: "available",
        title: "Me retrouver dans l’arbre",
        description:
          "Associe ton profil à la bonne personne pour débloquer l’exploration personnalisée.",
        ctaLabel: "Commencer",
        priority: 100,
        source: "family-tree",
      },
    ];
  }

  const [claim, defaultGedcomPersonId] = await Promise.all([
    getMyPersonIdentityClaim({
      eventSlug,
      participantId,
    }).catch(() => null),
    getParticipantDefaultGedcomPersonId({
      eventSlug,
      participantId,
    }).catch(() => null),
  ]);

  const hasApprovedClaim =
    claim?.claim_status === "approved" && Boolean(claim.person_id?.trim());

  const hasSelectedBranch = Boolean(defaultGedcomPersonId?.trim());

  const actions: FamilyTreeAction[] = [];

  if (!hasApprovedClaim) {
    actions.push({
      id: "family-tree:identify-self",
      type: "identify_self",
      status: hasSelectedBranch ? "suggested" : "available",
      title: "Me retrouver dans l’arbre",
      description: hasSelectedBranch
        ? "Tu peux maintenant confirmer la fiche qui te correspond."
        : "Commence par donner plus d’éléments sur ta famille pour être rattaché à une branche.",
      ctaLabel: hasSelectedBranch ? "Me trouver" : "Renseigner ma famille",
      priority: 100,
      source: "family-tree",
    });
  }

  if (hasApprovedClaim) {
    actions.push({
      id: "family-tree:review-profile",
      type: "review_profile",
      status: "suggested",
      personId: claim?.person_id?.trim(),
      title: "Vérifier mon profil dans l’arbre",
      description:
        "Contrôle ce que les autres peuvent voir et complète ce qui manque.",
      ctaLabel: "Gérer mon profil",
      priority: 90,
      source: "family-tree",
    });

    actions.push({
      id: "family-tree:add-memory",
      type: "add_memory",
      status: "available",
      personId: claim?.person_id?.trim(),
      title: "Ajouter un souvenir",
      description:
        "Partage un souvenir ou une anecdote pour enrichir la mémoire familiale.",
      ctaLabel: "Ajouter",
      priority: 70,
      source: "family-tree",
    });

    actions.push({
      id: "family-tree:add-photo",
      type: "add_photo",
      status: "available",
      personId: claim?.person_id?.trim(),
      title: "Ajouter une photo",
      description:
        "Propose une photo à publier après validation.",
      ctaLabel: "Ajouter",
      priority: 60,
      source: "family-tree",
    });
  }

  return actions.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}