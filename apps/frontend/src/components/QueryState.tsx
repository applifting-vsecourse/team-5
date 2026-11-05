import type { ReactNode } from "react"
import { AlertCircle } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { StatusChip } from "@/components/StatusChip"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type QueryStateProps = {
  isLoading?: boolean
  error?: Error | null
  isEmpty?: boolean
  onRetry?: () => void
  loadingLabel?: string
  errorTitle?: string
  errorDescription?: string
  empty: ReactNode
  children: ReactNode
  skeleton?: ReactNode
  className?: string
}

/** Loading / empty / error for every list (DESIGN.md). */
export function QueryState({
  isLoading = false,
  error = null,
  isEmpty = false,
  onRetry,
  loadingLabel = "Načítám",
  errorTitle = "Nepodařilo se načíst data",
  errorDescription = "Zkontroluj připojení a zkus to znovu.",
  empty,
  children,
  skeleton,
  className,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div
        className={cn("flex flex-col gap-3", className)}
        aria-busy="true"
        aria-label={loadingLabel}
      >
        <StatusChip tone="muted">Načítání</StatusChip>
        {skeleton ?? <ListSkeleton rows={3} />}
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className={cn("flex flex-col gap-3", className)}
      >
        <StatusChip tone="danger">Chyba</StatusChip>
        <EmptyState
          icon={AlertCircle}
          chip="BEZ PŘIPOJENÍ"
          iconTone="danger"
          title={errorTitle}
          description={error.message || errorDescription}
          action={
            onRetry ? (
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={onRetry}
              >
                Zkusit znovu
              </Button>
            ) : undefined
          }
        />
      </div>
    )
  }

  if (isEmpty) {
    return <div className={className}>{empty}</div>
  }

  return <div className={className}>{children}</div>
}

type ListSkeletonProps = {
  rows?: number
  className?: string
}

/** Neutral skeleton rows shaped like StripCard list items. */
export function ListSkeleton({ rows = 3, className }: ListSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex overflow-hidden rounded-item border border-border bg-card"
        >
          <Skeleton className="w-1.5 shrink-0 self-stretch rounded-none bg-chart-track" />
          <div className="flex flex-1 flex-col gap-2.5 p-4">
            <Skeleton className="h-3.5 w-40 bg-muted" />
            <Skeleton className="h-2.5 w-28 bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
