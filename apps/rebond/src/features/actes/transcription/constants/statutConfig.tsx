// src/features/transcription/constants/statutConfig.ts
import { CheckCircle, Circle } from 'lucide-react';
export const statutConfig = [
    {
      key: "à transcrire",
      label: "À transcrire",
      color: "border-gray-300",
      bg: "bg-gray-100",
      text: "text-gray-700",
    },
    {
      key: "brouillon",
      label: "Brouillon",
      color: "border-gray-300",
      bg: "bg-gray-100",
      text: "text-gray-700",
    },
    {
      key: "en cours de transcription",
      label: "En cours de transcription",
      color: "border-orange-500",
      bg: "bg-orange-100",
      text: "text-orange-800",
    },
    {
      key: "transcrit",
      label: "Transcrit par un utilisateur",
      color: "border-blue-500",
      bg: "bg-blue-100",
      text: "text-blue-800",
    },
    {
      key: "en relecture",
      label: "En relecture",
      color: "border-yellow-400",
      bg: "bg-yellow-100",
      text: "text-yellow-800",
    },
    {
      key: "transcription validée",
      label: "Transcription validée",
      color: "border-green-500",
      bg: "bg-green-100",
      text: "text-green-800",
    },
]
export type Statut = typeof statutConfig[number]["key"]

export function getIconForStatut(statut: Statut | null | undefined) {
  const config = statutConfig.find((s) => s.key === statut);
  if (!config) return null;

  const iconColor = config.text;
  const isEnCours =
    statut === 'à transcrire' ||
    statut === 'brouillon' ||
    statut === 'en cours de transcription';

  const IconComponent = isEnCours ? Circle : CheckCircle;

  return <IconComponent className={`w-4 h-4 ${iconColor}`} />;
}

export function getIconForStatutFromStats(actes_estimes: number, actes_transcrits: number) {
  let statut: Statut = 'brouillon';

  if (actes_estimes > 0 && actes_estimes === actes_transcrits) {
    statut = 'transcrit';
  } else if (actes_transcrits > 1) {
    statut = 'en cours de transcription';
  }

  return getIconForStatut(statut);
}