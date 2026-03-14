import {
  getStoredParticipantProfiles,
  type StoredParticipantProfile,
  type StoredParticipantProfilesState,
} from "./getStoredParticipantProfiles";
import { notifyParticipantSessionChanged } from "./sessionEvents";

function getStorageKey(slug: string): string {
  return `connect:${slug}:device-profiles`;
}

function saveState(slug: string, state: StoredParticipantProfilesState) {
  localStorage.setItem(getStorageKey(slug), JSON.stringify(state));
}

function buildProfileLabel(profile: StoredParticipantProfile): string | undefined {
  if (profile.label?.trim()) return profile.label.trim();

  const firstName = profile.firstName?.trim();
  const lastName = profile.lastName?.trim();

  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;

  return undefined;
}

export type AddStoredParticipantProfileInput = {
  participantId: string;
  firstName?: string;
  lastName?: string;
  birthYear?: string;
  label?: string;
  recoveryToken?: string;
  managedByParticipantId?: string;
  remembered?: boolean;
  setAsActive?: boolean;
};

export function addStoredParticipantProfile(
  slug: string,
  input: AddStoredParticipantProfileInput,
): StoredParticipantProfilesState {
  const participantId = input.participantId.trim();
  if (!participantId) {
    return getStoredParticipantProfiles(slug);
  }

  const now = new Date().toISOString();
  const state = getStoredParticipantProfiles(slug);

  const nextProfile: StoredParticipantProfile = {
    participantId,
    firstName: input.firstName?.trim() || undefined,
    lastName: input.lastName?.trim() || undefined,
    birthYear: input.birthYear?.trim() || undefined,
    label: input.label?.trim() || undefined,
    recoveryToken: input.recoveryToken?.trim() || undefined,
    managedByParticipantId: input.managedByParticipantId?.trim() || undefined,
    updatedAt: now,
  };

  if (typeof input.remembered === "boolean") {
    nextProfile.remembered = input.remembered;
  }

  nextProfile.label = buildProfileLabel(nextProfile);

  const existingIndex = state.profiles.findIndex(
    (profile) => profile.participantId === participantId,
  );

  let profiles: StoredParticipantProfile[];

  if (existingIndex >= 0) {
    const existing = state.profiles[existingIndex];

    const merged: StoredParticipantProfile = {
      ...existing,
      ...nextProfile,
      createdAt: existing.createdAt ?? now,
      updatedAt: now,
    };

    merged.label = buildProfileLabel(merged);

    profiles = [...state.profiles];
    profiles[existingIndex] = merged;
  } else {
    const created: StoredParticipantProfile = {
      ...nextProfile,
      createdAt: now,
      updatedAt: now,
    };

    created.label = buildProfileLabel(created);

    profiles = [created, ...state.profiles];
  }

  const nextState: StoredParticipantProfilesState = {
    activeParticipantId:
      input.setAsActive === false
        ? state.activeParticipantId ?? participantId
        : participantId,
    profiles,
  };

  saveState(slug, nextState);
  notifyParticipantSessionChanged();

  return nextState;
}