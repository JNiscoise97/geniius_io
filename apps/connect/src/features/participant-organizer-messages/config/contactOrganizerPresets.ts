import type { OrganizerMessageTopic } from "./contactOrganizerFormConfig";

export type ContactOrganizerPresetKey =
  | "find-me-identification"
  | "report-person-issue";

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

  "report-person-issue": {
    key: "report-person-issue",
    forcedTopic: "family",
    lockTopic: true,
    title: "Signaler une incohérence",
    subtitle: "Une information sur cette personne te semble erronée ou incertaine ?",
    introText:
  "Tu peux signaler à l’organisateur une erreur, une incohérence, un doute ou une information à vérifier concernant cette personne. Décris simplement ce qui te semble incorrect ou incertain, et ajoute si possible une précision, une correction ou un contexte utile.",
    messageTemplate: "",
  },
};

export function getContactOrganizerPreset(
  value: string | null | undefined,
): ContactOrganizerPreset | null {
  if (!value) return null;

  return (
    CONTACT_ORGANIZER_PRESETS[value as ContactOrganizerPresetKey] ?? null
  );
}