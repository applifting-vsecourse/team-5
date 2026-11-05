import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon: LucideIcon
  chip?: string
  title: string
  description: string
  action?: ReactNode
  secondaryAction?: ReactNode
  className?: string
  /** Soft tint behind the icon circle — keep to semantic surfaces. */
  iconTone?: "primary" | "dog" | "danger"
  /** Use `p` when nested under an existing section heading. */
  titleAs?: "h2" | "p"
}

/**
 * Empty list / empty screen invitation to act (Figma empty states).
 * One sentence why it is empty, one primary action.
 * Used by DogList, ClientList and QueryState; screen tickets reuse it.
 */
export function EmptyState({
  icon: Icon,
  chip,
  title,
  description,
  action,
  secondaryAction,
  className,
  iconTone = "primary",
  titleAs = "h2",
}: EmptyStateProps) {
  const TitleTag = titleAs
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3.5 rounded-card border border-border bg-card px-6 py-6 text-center",
        className,
      )}
    >
      {chip ? (
        <span className="inline-flex rounded-full bg-secondary px-3 py-1.5 text-[11px] font-extrabold tracking-wide text-foreground uppercase">
          {chip}
        </span>
      ) : null}

      <div
        className={cn(
          "flex size-24 items-center justify-center rounded-full",
          iconTone === "primary" && "bg-accent",
          iconTone === "dog" && "bg-info",
          iconTone === "danger" && "bg-danger-surface",
        )}
      >
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-full",
            iconTone === "primary" && "bg-primary text-primary-foreground",
            iconTone === "dog" && "bg-dog-1 text-dog-foreground",
            iconTone === "danger" && "bg-destructive text-destructive-foreground",
          )}
        >
          <Icon
            className="size-7"
            aria-hidden
          />
        </div>
      </div>

      <TitleTag className="text-2xl font-extrabold tracking-tight text-foreground">
        {title}
      </TitleTag>
      <p className="max-w-sm text-sm font-medium text-muted-foreground">{description}</p>

      {action || secondaryAction ? (
        <div className="mt-1 flex w-full max-w-sm flex-col gap-2.5">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  )
}
