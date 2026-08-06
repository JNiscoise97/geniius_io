import { statutConfig } from "@/features/actes/transcription/constants/statutConfig"
import { cn } from "@/lib/utils"

interface StatusPillProps {
  statut: string
}

export function StatusPill({ statut }: StatusPillProps) {
  const legend = statutConfig.find((s) => s.key === statut)

  if (!legend) {
    return (
      <span className="inline-block h-6 px-2 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
        {statut}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-block h-6 px-2 rounded-full text-xs font-medium text-center leading-6",
        legend.bg,
        legend.text
      )}
    >
      {legend.label}
    </span>
  )
}
