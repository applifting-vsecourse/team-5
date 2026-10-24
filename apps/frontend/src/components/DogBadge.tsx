import { dogColorClass } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

export type DogBadgeProps = {
  name: string
  color: number
  breed?: string | null
  size?: "sm" | "md"
  className?: string
}

export function DogBadge({ name, color, breed, size = "md", className }: DogBadgeProps) {
  const isSmall = size === "sm"

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card font-medium text-foreground select-none",
        isSmall ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      {/* Dog Color Tag Indicator */}
      <span
        aria-hidden="true"
        className={cn(
          "shrink-0 rounded-full shadow-2xs ring-1 ring-background",
          isSmall ? "size-2" : "size-2.5",
          dogColorClass(color),
        )}
      />
      <span className="font-semibold tracking-tight">{name}</span>
      {breed && <span className="font-normal text-muted-foreground">· {breed}</span>}
    </span>
  )
}
