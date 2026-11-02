import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDayLong } from "@/lib/calendarDate"

import { dogPlannedTrainingsQueryOptions } from "@/features/dog/api/dogsQueryOptions"

type PlannedTrainingsListProps = {
  dogId: string
  dogName: string
}

// Days the dog's trainings are planned for (#74), next to its Activities, so
// a trainer sees right away when the owner moves a training to another day.
export function PlannedTrainingsList({ dogId, dogName }: PlannedTrainingsListProps) {
  const plannedQuery = useQuery(dogPlannedTrainingsQueryOptions(dogId))

  return (
    <section
      className="space-y-4"
      aria-labelledby="planned-trainings-heading"
    >
      <div>
        <h2
          id="planned-trainings-heading"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Naplánováno
        </h2>
        <p className="text-xs text-muted-foreground">Tréninky, které psa čekají</p>
      </div>

      {plannedQuery.isLoading ? (
        <Skeleton className="h-12 w-full rounded-lg" />
      ) : plannedQuery.error ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Naplánované tréninky se nepodařilo načíst.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => void plannedQuery.refetch()}
          >
            Zkusit znovu
          </Button>
        </div>
      ) : (plannedQuery.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {dogName} teď nemá naplánovaný žádný trénink.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {plannedQuery.data?.map((training) => (
            <li
              key={training.id}
              className="flex items-baseline justify-between gap-3 px-4 py-3"
            >
              <span className="text-base text-foreground">{training.goal.title}</span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {formatDayLong(training.date)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
