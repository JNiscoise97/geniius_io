// lib/participant-session/syncLegacyParticipantStorage.ts
type LegacyProfile = {
  participantId: string;
  firstName?: string;
  lastName?: string;
  birthYear?: string;
  recoveryToken?: string;
  allowTest?: boolean;

};

export function syncLegacyParticipantStorage(
  slug: string,
  profile: LegacyProfile | null,
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
      allowTest: profile.allowTest,
    }),
  );
}