import type { OrganizerMessageTopic } from "./contactOrganizerFormConfig";


export type ContactOrganizerPresetKey = "find-me-identification";

export type ContactOrganizerPreset = {
  key: ContactOrganizerPresetKey;
  forcedTopic: OrganizerMessageTopic;
  messageTemplate: string;
  title?: string;
  subtitle?: string;
  introText?: string;
  lockTopic?: boolean;
};

export const CONTACT_ORGANIZER_PRESETS: Record<
  ContactOrganizerPresetKey,
  ContactOrganizerPreset
> = {
  "find-me-identification": {
    key: "find-me-identification",
    forcedTopic: "family",
    lockTopic: true,
    title: "Demander à l’organisateur de m’identifier",
    subtitle: "Tu n’arrives pas à te retrouver dans l’arbre ?",
    introText:
      "Envoie une demande à l’organisateur. Il pourra rechercher ton profil dans l’arbre et te prévenir par mail lorsqu’il t’aura identifié.",
    messageTemplate: "",
  },
};

export function getContactOrganizerPreset(
  value: string | null | undefined,
): ContactOrganizerPreset | null {
  if (!value) return null;

  return CONTACT_ORGANIZER_PRESETS[
    value as ContactOrganizerPresetKey
  ] ?? null;
}