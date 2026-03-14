export type StoredParticipantProfile = {
  participantId: string;
  firstName?: string;
  lastName?: string;
  birthYear?: string;
  label?: string;
  recoveryToken?: string;
  managedByParticipantId?: string;
  remembered?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type StoredParticipantProfilesState = {
  activeParticipantId: string | null;
  profiles: StoredParticipantProfile[];
};

function getStorageKey(slug: string): string {
  return `connect:${slug}:device-profiles`;
}

function isValidStoredParticipantProfile(
  value: unknown,
): value is StoredParticipantProfile {
  if (!value || typeof value !== "object") return false;

  const v = value as Record<string, unknown>;

  return typeof v.participantId === "string" && v.participantId.trim().length > 0;
}

function normalizeProfile(
  profile: StoredParticipantProfile,
): StoredParticipantProfile {
  return {
    participantId: profile.participantId,
    firstName: profile.firstName?.trim() || undefined,
    lastName: profile.lastName?.trim() || undefined,
    birthYear: profile.birthYear?.trim() || undefined,
    label: profile.label?.trim() || undefined,
    recoveryToken: profile.recoveryToken?.trim() || undefined,
    managedByParticipantId: profile.managedByParticipantId?.trim() || undefined,
    remembered: profile.remembered === true,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function normalizeState(
  value: unknown,
): StoredParticipantProfilesState {
  if (!value || typeof value !== "object") {
    return {
      activeParticipantId: null,
      profiles: [],
    };
  }

  const raw = value as Record<string, unknown>;

  const rawProfiles = Array.isArray(raw.profiles) ? raw.profiles : [];
  const profiles = rawProfiles
    .filter(isValidStoredParticipantProfile)
    .map((item) => normalizeProfile(item));

  const activeParticipantId =
    typeof raw.activeParticipantId === "string" &&
    profiles.some((p) => p.participantId === raw.activeParticipantId)
      ? raw.activeParticipantId
      : profiles[0]?.participantId ?? null;

  return {
    activeParticipantId,
    profiles,
  };
}

export function getStoredParticipantProfiles(
  slug: string,
): StoredParticipantProfilesState {
  const storageKey = getStorageKey(slug);
  const raw = localStorage.getItem(storageKey);

  if (!raw) {
    return {
      activeParticipantId: null,
      profiles: [],
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch {
    return {
      activeParticipantId: null,
      profiles: [],
    };
  }
}