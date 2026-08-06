import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type TimelineStep = {
  icon: LucideIcon
  title: string
  description?: string
  date: string | Date | null // 👈 on ajoute la date ici
  color?: string // ex: 'text-blue-500'
}

type Props = {
  steps: TimelineStep[]
}

export function HorizontalTimeline({ steps }: Props) {
  return (
    <div className="relative w-full overflow-x-auto py-6">
      {/* Ligne */}
      <div className="absolute top-[91px] left-0 right-0 h-0.5 bg-border z-0" />

      <div className="flex items-center justify-center gap-50 relative z-10">
        {steps.map((step, index) => {
            const Icon = step.icon

            function formatDateLong(dateInput: string | Date | null): string {
                if (!dateInput) return ""
                const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
                if (isNaN(date.getTime())) return ""

                const jour = date.toLocaleDateString("fr-FR", { weekday: "long" })
                const dateLongue = date.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                })
                return `${jour}<br/>${dateLongue}`
            }

            let ecartJours: number | null = null;

            if (index > 0) {
            const prevStep = steps[index - 1];
            const prevDateRaw = prevStep?.date ?? null;
            const currentDateRaw = step.date ?? null;

            const prevDate =
                typeof prevDateRaw === "string" || prevDateRaw instanceof Date
                ? new Date(prevDateRaw)
                : null;
            const currentDate =
                typeof currentDateRaw === "string" || currentDateRaw instanceof Date
                ? new Date(currentDateRaw)
                : null;

            if (
                prevDate &&
                currentDate &&
                !isNaN(prevDate.getTime()) &&
                !isNaN(currentDate.getTime())
            ) {
                const diffMs = currentDate.getTime() - prevDate.getTime();
                ecartJours = Math.round(diffMs / (1000 * 60 * 60 * 24));
            }
            }

          

          return (
            <div
                key={index}
                className="flex flex-col items-center min-w-[120px] relative"
                style={{ minHeight: 200 }}
                >
                <div className="flex flex-col items-center justify-start" style={{ minHeight: 140 }}>
                    {/* Date */}
                    {step.date && (
                    <p
                        className="mb-3 text-xs text-muted-foreground text-center leading-snug"
                        dangerouslySetInnerHTML={{ __html: formatDateLong(step.date) }}
                    />
                    )}

                    {/* Icône */}
                    <div
                    className={cn(
                        "w-12 h-12 rounded-full border-4 bg-background flex items-center justify-center text-xl font-bold shadow-sm z-10",
                        step.color || "text-primary border-primary"
                    )}
                    >
                    <Icon className={cn("w-6 h-6", step.color)} />
                    </div>

                    {/* Titre */}
                    <p className="mt-3 text-sm font-semibold uppercase text-foreground text-center">
                    {step.title}
                    </p>
                </div>

                {ecartJours !== null && (
                    <p className="text-xs text-muted-foreground mb-2 text-center italic">
                    ⏳ {ecartJours} jour{ecartJours > 1 ? "s" : ""} plus tard
                    </p>
                )}
                {/* Description en-dessous, sans casser l’alignement */}
                {step.description && (
                    <div className="mt-2">
                    <p className="text-xs text-muted-foreground text-center max-w-[250px]">
                        {step.description}
                    </p>
                    </div>
                )}
                </div>
          )
        })}
      </div>
    </div>
  )
}
