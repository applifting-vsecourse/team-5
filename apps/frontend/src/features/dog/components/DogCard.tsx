import { useQuery } from "@tanstack/react-query"

import { DogPlayerCard } from "@/components/DogPlayerCard"
import { Button } from "@/components/ui/button"
import { formatDayLong, todayCalendarDate } from "@/lib/calendarDate"
import type { DogMetrics } from "@/lib/dogMetrics"
import { cn } from "@/lib/utils"

import type { Dog, PlannedTraining } from "@/features/dog/api/dogSchemas"
import {
  dogGoalsQueryOptions,
  dogMetricsQueryOptions,
  dogPlannedTrainingsQueryOptions,
} from "@/features/dog/api/dogsQueryOptions"

export type DogCardExtras = {
  metrics?: DogMetrics | null
  completedGoalCount?: number | null
  goalCount?: number | null
  nextLabel?: string | null
  isOverdue?: boolean
}

type DogCardProps = {
  dog: Dog
  className?: string
  /** When set, the card does not fetch. Dnes already has these values. */
  extras?: DogCardExtras
}

export function nextTrainingLabel(
  items: PlannedTraining[],
  today: string,
): { label: string; isOverdue: boolean } | null {
  const upcoming = [...items].sort((left, right) => left.date.localeCompare(right.date))
  const future = upcoming.find((item) => item.date >= today)
  if (future) {
    return {
      label: future.date === today ? "Dnes" : formatDayLong(future.date),
      isOverdue: false,
    }
  }
  const missed = upcoming[0]
  if (!missed) return null
  return { label: formatDayLong(missed.date), isOverdue: true }
}

export function DogCard({ dog, className, extras }: DogCardProps) {
  const shouldLoad = extras == null
  const metricsQuery = useQuery({ ...dogMetricsQueryOptions(dog.id), enabled: shouldLoad })
  const goalsQuery = useQuery({ ...dogGoalsQueryOptions(dog.id), enabled: shouldLoad })
  const plannedQuery = useQuery({
    ...dogPlannedTrainingsQueryOptions(dog.id),
    enabled: shouldLoad,
  })

  const metrics = extras ? extras.metrics : metricsQuery.data
  const completedGoalCount = extras
    ? extras.completedGoalCount
    : goalsQuery.isSuccess
      ? goalsQuery.data.filter((goal) => goal.status === "COMPLETED").length
      : null
  const goalCount = extras ? extras.goalCount : goalsQuery.isSuccess ? goalsQuery.data.length : null
  const next = extras
    ? { label: extras.nextLabel ?? null, isOverdue: extras.isOverdue ?? false }
    : plannedQuery.isSuccess
      ? nextTrainingLabel(plannedQuery.data, todayCalendarDate())
      : plannedQuery.isError
        ? { label: "Termín nedostupný", isOverdue: false }
        : undefined
  const nextLabel = next === undefined ? undefined : (next?.label ?? null)

  return (
    <div className={cn(className)}>
      <DogPlayerCard
        dog={dog}
        metrics={metrics}
        completedGoalCount={completedGoalCount}
        goalCount={goalCount}
        nextLabel={nextLabel}
        isOverdue={next?.isOverdue}
      />
      {!extras && (metricsQuery.isError || goalsQuery.isError || plannedQuery.isError) && (
        <div
          role="alert"
          className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-destructive"
        >
          <p>Část údajů psa se nepodařilo načíst.</p>
          <Button
            variant="outline"
            onClick={() => {
              void metricsQuery.refetch()
              void goalsQuery.refetch()
              void plannedQuery.refetch()
            }}
          >
            Zkusit znovu
          </Button>
        </div>
      )}
    </div>
  )
}
