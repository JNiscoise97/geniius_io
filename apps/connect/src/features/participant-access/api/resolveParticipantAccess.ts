import { getParticipantByRecoveryToken } from "./getParticipantByRecoveryToken";
import { addStoredParticipantProfile } from "../../../lib/participant-session/addStoredParticipantProfile";
import {
  getStoredParticipantProfiles,
  type StoredParticipantProfile,
} from "../../../lib/participant-session/getStoredParticipantProfiles";
import { setActiveParticipant } from "../../../lib/participant-session/setActiveParticipant";

export type ParticipantAccessResolution =
  | {
      kind: "go-to-welcome";
      eventSlug: string;
    }
  | {
      kind: "go-to-intro";
      eventSlug: string;
    }
  | {
      kind: "go-to-access-options";
      eventSlug: string;
      reason: "single-unremembered" | "multiple-profiles";
      participantId?: string;
    };

export type ResolveParticipantAccessInput = {
  eventSlug: string;
  recoveryToken?: string | null;
};

function syncLegacyParticipantStorage(
  slug: string,
  profile: Pick<
    StoredParticipantProfile,
    "participantId" | "firstName" | "lastName" | "birthYear" | "recoveryToken"
  > | null,
) {
  if (!profile) return;

  localStorage.setItem(
    `connect:${slug}:participant`,
    JSON.stringify({
      participantId: profile.participantId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      birthYear: profile.birthYear,
      recoveryToken: profile.recoveryToken,
    }),
  );
}

export async function resolveParticipantAccess({
  eventSlug,
  recoveryToken,
}: ResolveParticipantAccessInput): Promise<ParticipantAccessResolution> {
  const slug = eventSlug.trim();
  const token = recoveryToken?.trim() ?? "";

  if (token) {
    const participant = await getParticipantByRecoveryToken(token);

    if (participant) {
      const resolvedSlug = participant.eventSlug || slug;

      addStoredParticipantProfile(resolvedSlug, {
        participantId: participant.participantId,
        firstName: participant.firstName,
        lastName: participant.lastName,
        recoveryToken: token,
        remembered: false,
        setAsActive: true,
      });

      syncLegacyParticipantStorage(resolvedSlug, {
        participantId: participant.participantId,
        firstName: participant.firstName,
        lastName: participant.lastName,
        recoveryToken: token,
      });

      return {
        kind: "go-to-welcome",
        eventSlug: resolvedSlug,
      };
    }
  }

  const state = getStoredParticipantProfiles(slug);

  if (state.profiles.length === 0) {
    return {
      kind: "go-to-intro",
      eventSlug: slug,
    };
  }

  if (state.profiles.length === 1) {
    const profile = state.profiles[0];

    if (profile.remembered) {
      const ok = setActiveParticipant(slug, profile.participantId);

      if (ok) {
        syncLegacyParticipantStorage(slug, profile);

        return {
          kind: "go-to-welcome",
          eventSlug: slug,
        };
      }
    }

    return {
      kind: "go-to-access-options",
      eventSlug: slug,
      reason: "single-unremembered",
      participantId: profile.participantId,
    };
  }

  return {
    kind: "go-to-access-options",
    eventSlug: slug,
    reason: "multiple-profiles",
  };
}