import { statutConfig } from "@/features/actes/transcription/constants/statutConfig"
import { cn } from "@/lib/utils"

interface StatusPillProps {
  statut: string
}

export function StatusPill({ statut }: StatusPillProps) {
  const legend = statutConfig.find((s) => s.key === statut)

  if (!legend) {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-center text-gray-700 bg-gray-100">
        {statut}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded-full text-xs font-medium text-center",
        legend.bg,
        legend.text
      )}
    >
      {legend.label}
    </span>
  )
}
