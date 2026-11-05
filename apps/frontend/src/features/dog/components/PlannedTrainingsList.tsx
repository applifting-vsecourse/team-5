import { useQuery } from "@tanstack/react-query"
import { Calendar } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { QueryState } from "@/components/QueryState"
import { StripCard } from "@/components/StripCard"
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
  const planned = plannedQuery.data ?? []

  return (
    <section
      className="space-y-4"
      aria-labelledby="planned-trainings-heading"
    >
      <div>
        <h2
          id="planned-trainings-heading"
          className="text-section font-extrabold text-foreground"
        >
          Naplánováno
        </h2>
        <p className="text-xs text-muted-foreground">Tréninky, které psa čekají</p>
      </div>

      <QueryState
        isLoading={plannedQuery.isLoading}
        error={
          plannedQuery.isError
            ? (plannedQuery.error ?? new Error("Naplánované tréninky se nepodařilo načíst."))
            : null
        }
        isEmpty={!plannedQuery.isLoading && !plannedQuery.isError && planned.length === 0}
        onRetry={() => void plannedQuery.refetch()}
        loadingLabel="Načítání naplánovaných tréninků"
        errorTitle="Naplánované tréninky se nepodařilo načíst"
        errorDescription="Naplánované tréninky se nepodařilo načíst."
        empty={
          <EmptyState
            icon={Calendar}
            chip="BEZ TRÉNINKŮ"
            titleAs="p"
            title={`${dogName} teď nemá naplánovaný žádný trénink.`}
            description="Tréninky naplánuješ u cíle v kalendáři."
          />
        }
      >
        <ul className="flex flex-col gap-2">
          {planned.map((training) => (
            <StripCard
              key={training.id}
              as="li"
            >
              <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                <span className="text-base text-foreground">{training.goal.title}</span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {formatDayLong(training.date)}
                </span>
              </div>
            </StripCard>
          ))}
        </ul>
      </QueryState>
    </section>
  )
}
