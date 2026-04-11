export type ParticipantEventMemoryMood =
  | "joyeux"
  | "emouvant"
  | "drole"
  | "surprenant"
  | "nostalgique"
  | "fier";

export const PARTICIPANT_EVENT_MEMORY_MOODS: Array<{
  value: ParticipantEventMemoryMood;
  label: string;
}> = [
  { value: "joyeux", label: "Joyeux" },
  { value: "emouvant", label: "Émouvant" },
  { value: "drole", label: "Drôle" },
  { value: "surprenant", label: "Surprenant" },
  { value: "nostalgique", label: "Nostalgique" },
  { value: "fier", label: "Fier" },
];