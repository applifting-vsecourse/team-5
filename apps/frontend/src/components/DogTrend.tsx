import type { DogMetrics } from "@/lib/dogMetrics"
import { cn } from "@/lib/utils"

export function DogTrend({
  weeks,
  isCompact = false,
}: {
  weeks: DogMetrics["weeks"]
  isCompact?: boolean
}) {
  const visible = weeks.slice(-8)
  return (
    <div
      className={cn("flex items-end gap-1.5", isCompact ? "h-8" : "h-10")}
      role="img"
      aria-label="Úspěšnost za posledních osm týdnů"
    >
      {visible.map((week, index) => (
        <span
          key={week.from}
          title={`${week.from}: ${week.successRate == null ? "bez hodnoceného tréninku" : `${Math.round(week.successRate)} %`}`}
          className={cn(
            "min-w-0 flex-1 rounded-full bg-dog-foreground",
            index < visible.length - 1 && "opacity-40",
          )}
          style={{ height: `${week.successRate == null ? 12 : Math.max(12, week.successRate)}%` }}
        />
      ))}
      {!visible.length && <span className="text-xs">Zatím bez tréninků</span>}
    </div>
  )
}
