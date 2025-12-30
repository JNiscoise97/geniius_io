// src/features/transcription/constants/statutConfig.ts
import { CheckCircle, Circle } from 'lucide-react';
export const statutConfig = [
    {
      key: "TO_TRANSCRIBE",
      label: "À transcrire",
      color: "border-gray-300",
      bg: "bg-gray-100",
      text: "text-gray-700",
    },
    {
      key: "DRAFT",
      label: "Brouillon",
      color: "border-gray-300",
      bg: "bg-gray-100",
      text: "text-gray-700",
    },
    {
      key: "IN_PROGRESS",
      label: "En cours de transcription",
      color: "border-orange-500",
      bg: "bg-orange-100",
      text: "text-orange-800",
    },
    {
      key: "TRANSCRIBED",
      label: "Transcrit par un utilisateur",
      color: "border-blue-500",
      bg: "bg-blue-100",
      text: "text-blue-800",
    },
    {
      key: "IN_REVIEW",
      label: "En relecture",
      color: "border-yellow-400",
      bg: "bg-yellow-100",
      text: "text-yellow-800",
    },
    {
      key: "VALIDATED",
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
    statut === 'TO_TRANSCRIBE' ||
    statut === 'DRAFT' ||
    statut === 'IN_PROGRESS';

  const IconComponent = isEnCours ? Circle : CheckCircle;

  return <IconComponent className={`w-4 h-4 ${iconColor}`} />;
}

export function getIconForStatutFromStats(actes_estimes: number, actes_transcrits: number) {
  let statut: Statut = 'DRAFT';

  if (actes_estimes > 0 && actes_estimes === actes_transcrits) {
    statut = 'TRANSCRIBED';
  } else if (actes_transcrits > 1) {
    statut = 'IN_PROGRESS';
  }

  return getIconForStatut(statut);
}