export function getParticipantHomePath(eventSlug: string) {
  return `/e/${eventSlug}/home`;
}

export function getParticipantAccessOptionsPath(eventSlug: string) {
  return `/e/${eventSlug}/access/options`;
}

export function getParticipantAccessIntroPath(eventSlug: string) {
  return `/e/${eventSlug}/access/intro`;
}

export function getParticipantAccessCreatePath(eventSlug: string) {
  return `/e/${eventSlug}/access/create`;
}

export function getParticipantAccessContinuePath(eventSlug: string) {
  return `/e/${eventSlug}/access/continue`;
}

export function getParticipantAccessRecoverPath(eventSlug: string) {
  return `/e/${eventSlug}/access/recover`;
}

export function getParticipantAccessRecoverConfirmPath(eventSlug: string) {
  return `/e/${eventSlug}/access/recover-confirm`;
}

export function getParticipantAccessConfirmTokenPath(eventSlug: string) {
  return `/e/${eventSlug}/access/confirm-token`;
}

export function getParticipantAccessConfirmDevicePath(eventSlug: string) {
  return `/e/${eventSlug}/access/confirm-device`;
}