import type { ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const statusChipVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-extrabold tracking-wide uppercase",
  {
    variants: {
      tone: {
        muted: "bg-secondary text-foreground",
        accent: "bg-accent text-accent-foreground",
        success: "bg-success text-success-foreground",
        warning: "bg-warning text-warning-foreground",
        info: "bg-info text-info-foreground",
        danger: "bg-danger-surface text-danger-foreground",
        hero: "bg-hero-accent text-hero-foreground",
      },
    },
    defaultVariants: {
      tone: "muted",
    },
  },
)

type StatusChipProps = ComponentProps<"span"> & VariantProps<typeof statusChipVariants>

/**
 * Compact uppercase label (BEZ CÍLE, nový, CHYBA). Visual only —
 * clickable chips need a touch-sized wrapper.
 */
export function StatusChip({ className, tone, ...props }: StatusChipProps) {
  return (
    <span
      data-slot="status-chip"
      className={cn(statusChipVariants({ tone }), className)}
      {...props}
    />
  )
}

export { statusChipVariants }
