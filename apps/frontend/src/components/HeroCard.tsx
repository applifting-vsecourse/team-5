import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type HeroCardProps = {
  children: ReactNode
  className?: string
  /** Optional eyebrow above the main content (e.g. "DALŠÍ TRÉNINK"). */
  eyebrow?: string
}

/**
 * Dark summary surface for the next training or one highlighted metric.
 * Callers: Dnes redesign (#161), docs/ui-components.md, HeroCard tests.
 * No existing hero component (grep empty). Instruction: redesign issue from sprint backlog.
 */
export function HeroCard({ children, className, eyebrow }: HeroCardProps) {
  return (
    <section
      data-slot="hero-card"
      className={cn("flex flex-col gap-4 rounded-hero bg-hero p-5 text-hero-foreground", className)}
    >
      {eyebrow ? (
        <p className="text-[11px] font-extrabold tracking-wide text-hero-muted uppercase">
          {eyebrow}
        </p>
      ) : null}
      {children}
    </section>
  )
}

type HeroChipProps = {
  children: ReactNode
  className?: string
}

/** Quiet inset chip on the hero surface. */
export function HeroChip({ children, className }: HeroChipProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full bg-hero-accent px-3 py-1 text-xs font-bold text-hero-foreground",
        className,
      )}
    >
      {children}
    </span>
  )
}
