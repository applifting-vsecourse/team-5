import { PERFORMANCE_LEGEND_ITEMS, performanceBandClass } from "@/lib/performanceBands"
import { cn } from "@/lib/utils"

type PerformanceLegendProps = {
  className?: string
  /** Accessible name for the legend list. */
  label?: string
}

/** Colour key for success-rate bands (DESIGN.md grafové prvky). */
export function PerformanceLegend({
  className,
  label = "Legenda úspěšnosti",
}: PerformanceLegendProps) {
  return (
    <ul
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-3", className)}
    >
      {PERFORMANCE_LEGEND_ITEMS.map((item) => (
        <li
          key={item.band}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
        >
          <span
            aria-hidden
            className={cn("size-3 shrink-0 rounded-sm", performanceBandClass(item.band))}
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
