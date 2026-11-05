import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ChevronRight, Plus, Target } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { QueryState } from "@/components/QueryState"
import { StripCard } from "@/components/StripCard"
import { Button } from "@/components/ui/button"

import { dogGoalsQueryOptions } from "@/features/dog/api/dogsQueryOptions"

type DogGoalsSectionProps = {
  dogId: string
  dogName: string
}

export function DogGoalsSection({ dogId, dogName }: DogGoalsSectionProps) {
  const goalsQuery = useQuery(dogGoalsQueryOptions(dogId))
  const goals = goalsQuery.data ?? []

  return (
    <section
      className="space-y-3"
      aria-labelledby="goals-heading"
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="goals-heading"
          className="text-section font-extrabold text-foreground"
        >
          Aktivní cíle
        </h2>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="min-h-11 min-w-11 gap-2"
        >
          <Link
            to="/dogs/$dogId/goals/new"
            params={{ dogId }}
          >
            <Plus className="size-4" />
            <span>Nový cíl</span>
          </Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Čeho chcete dosáhnout. Každý cíl má vlastní princip, cviky a více tréninků v kalendáři.
      </p>
      <QueryState
        isLoading={goalsQuery.isLoading}
        error={
          goalsQuery.isError
            ? (goalsQuery.error ?? new Error("Cíle se nepodařilo načíst."))
            : null
        }
        isEmpty={!goalsQuery.isLoading && !goalsQuery.isError && goals.length === 0}
        onRetry={() => void goalsQuery.refetch()}
        loadingLabel="Načítání cílů"
        errorTitle="Cíle se nepodařilo načíst"
        errorDescription="Zkontroluj připojení a zkus to znovu."
        empty={
          <EmptyState
            icon={Target}
            chip="BEZ CÍLŮ"
            titleAs="p"
            title={`${dogName} zatím nemá žádný cíl`}
            description="Založte první cíl a popište, čeho chcete docílit."
            action={
              <Button
                asChild
                size="lg"
                className="w-full"
              >
                <Link
                  to="/dogs/$dogId/goals/new"
                  params={{ dogId }}
                >
                  <Plus className="size-4" />
                  Nový cíl
                </Link>
              </Button>
            }
          />
        }
      >
        <ul className="flex flex-col gap-2">
          {goals.map((goal) => (
            <li key={goal.id}>
              <StripCard>
                <Link
                  to="/dogs/$dogId/goals/$goalId"
                  params={{ dogId, goalId: goal.id }}
                  className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 outline-hidden transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-foreground">{goal.title}</p>
                    {goal.discipline ? (
                      <p className="truncate text-sm text-muted-foreground">{goal.discipline}</p>
                    ) : null}
                  </div>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted-foreground"
                  />
                </Link>
              </StripCard>
            </li>
          ))}
        </ul>
      </QueryState>
    </section>
  )
}
