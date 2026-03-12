export function getDeviceProfilesStorageKey(slug: string) {
  return `connect:${slug}:device-profiles`;
}

export function getLegacyParticipantStorageKey(slug: string) {
  return `connect:${slug}:participant`;
}