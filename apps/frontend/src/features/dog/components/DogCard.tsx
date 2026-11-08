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
}

type DogCardProps = {
  dog: Dog
  className?: string
  /** When set, the card does not fetch. Dnes already has these values. */
  extras?: DogCardExtras
}

function nextTrainingLabel(items: PlannedTraining[], today: string): string | null {
  const upcoming = [...items].sort((left, right) => left.date.localeCompare(right.date))
  const next = upcoming.find((item) => item.date >= today) ?? upcoming[0]
  if (!next) return null
  const when = next.date === today ? "Dnes" : formatDayLong(next.date)
  return when
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
  const nextLabel = extras
    ? extras.nextLabel
    : plannedQuery.isSuccess
      ? nextTrainingLabel(plannedQuery.data, todayCalendarDate())
      : plannedQuery.isError
        ? "Termín nedostupný"
        : undefined

  return (
    <div className={cn(className)}>
      <DogPlayerCard
        dog={dog}
        metrics={metrics}
        completedGoalCount={completedGoalCount}
        goalCount={goalCount}
        nextLabel={nextLabel}
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
