import { getParticipantByRecoveryToken } from "./getParticipantByRecoveryToken";
import {
  getStoredParticipantProfiles,
} from "../../../lib/participant-session/getStoredParticipantProfiles";

export type ParticipantAccessResolution =
  | {
      kind: "go-to-confirm-token";
      eventSlug: string;
      recoveryToken: string;
    }
  | {
      kind: "go-to-confirm-device";
      eventSlug: string;
      participantId: string;
    }
  | {
      kind: "go-to-access-options";
      eventSlug: string;
      reason: "multiple-profiles";
    }
  | {
      kind: "go-to-recover";
      eventSlug: string;
      reason: "no-local-profile" | "invalid-token" | "birth-year-mismatch";
      emailPrefill?: string;
    };

export type ResolveParticipantAccessInput = {
  eventSlug: string;
  recoveryToken?: string | null;
};

export async function resolveParticipantAccess({
  eventSlug,
  recoveryToken,
}: ResolveParticipantAccessInput): Promise<ParticipantAccessResolution> {
  const slug = eventSlug.trim();
  const token = recoveryToken?.trim() ?? "";

  if (token) {
    const participant = await getParticipantByRecoveryToken(token);

    if (participant) {
      return {
        kind: "go-to-confirm-token",
        eventSlug: participant.eventSlug || slug,
        recoveryToken: token,
      };
    }

    return {
      kind: "go-to-recover",
      eventSlug: slug,
      reason: "invalid-token",
    };
  }

  const state = getStoredParticipantProfiles(slug);

  if (state.profiles.length === 0) {
    return {
      kind: "go-to-recover",
      eventSlug: slug,
      reason: "no-local-profile",
    };
  }

  if (state.profiles.length === 1) {
    return {
      kind: "go-to-confirm-device",
      eventSlug: slug,
      participantId: state.profiles[0].participantId,
    };
  }

  return {
    kind: "go-to-access-options",
    eventSlug: slug,
    reason: "multiple-profiles",
  };
}