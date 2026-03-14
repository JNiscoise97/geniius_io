import { notifyParticipantSessionChanged } from "./sessionEvents";

export function clearEventSession(eventSlug: string) {
  const slug = eventSlug.trim();
  if (!slug) return;

  const prefix = `connect:${slug}:`;

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  });

  notifyParticipantSessionChanged();
}