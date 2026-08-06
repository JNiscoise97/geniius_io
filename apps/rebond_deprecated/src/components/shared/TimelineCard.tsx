import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

type TimelineCardProps = {
  icon: ReactNode
  title: string
  titleClassName?: string
  date?: string | Date | null
  subtitle?: string
  notes?: string
  className?: string
}

export function TimelineCard({
  icon,
  title,
  titleClassName,
  date,
  subtitle,
  notes,
  className,
}: TimelineCardProps) {
  let formattedDate: string | null = null

  if (date) {
    const parsedDate = typeof date === "string" ? new Date(date) : date
    if (!isNaN(parsedDate.getTime())) {
      formattedDate = parsedDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  }

  return (
    <div
      className={cn(
        "relative bg-muted/50 border border-border rounded-2xl shadow-md p-5 min-w-[240px] max-w-[260px] flex flex-col gap-3",
        className
      )}
    >
      {/* Date en en-tête */}
      {formattedDate && (
        <p className="text-lg font-bold text-foreground text-center">
          {formattedDate}
        </p>
      )}

      {/* Icône + Titre comme sous-titre */}
      <div className="flex items-center gap-2 justify-center">
        <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
        <h3 className={cn("text-sm font-semibold text-muted-foreground", titleClassName)}>
          {title}
        </h3>
      </div>

      {/* Lieu ou info secondaire */}
      {subtitle && (
        <p className="text-sm text-muted-foreground text-center">{subtitle}</p>
      )}

      {/* Notes éventuelles */}
      {notes && (
        <p className="text-sm italic text-muted-foreground mt-2 text-center">{notes}</p>
      )}
    </div>
  )
}
