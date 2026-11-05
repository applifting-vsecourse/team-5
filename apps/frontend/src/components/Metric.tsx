import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type MetricProps = {
  value: ReactNode
  label: string
  className?: string
  /** Dark hero surface uses hero text tokens. */
  isOnHero?: boolean
}

/** One number + short label (úspěšnost, série, počet tréninků). */
export function Metric({ value, label, className, isOnHero = false }: MetricProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <p
        className={cn(
          "text-2xl font-extrabold tracking-tight tabular-nums",
          isOnHero ? "text-hero-foreground" : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className={cn("text-label", isOnHero ? "text-hero-muted" : "text-muted-foreground")}>
        {label}
      </p>
    </div>
  )
}
