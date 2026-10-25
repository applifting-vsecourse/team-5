import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ChevronRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { dogGoalsQueryOptions } from "@/features/dog/api/dogsQueryOptions"

type DogGoalsSectionProps = {
  dogId: string
  dogName: string
}

export function DogGoalsSection({ dogId, dogName }: DogGoalsSectionProps) {
  const goalsQuery = useQuery(dogGoalsQueryOptions(dogId))

  return (
    <section
      className="space-y-3"
      aria-labelledby="goals-heading"
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="goals-heading"
          className="text-lg font-semibold tracking-tight text-foreground"
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
      {goalsQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : goalsQuery.error ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Cíle se nepodařilo načíst.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => void goalsQuery.refetch()}
          >
            Zkusit znovu
          </Button>
        </div>
      ) : !goalsQuery.data?.length ? (
        <p className="text-sm text-muted-foreground">
          {dogName} zatím nemá žádný cíl. Založte první a popište, čeho chcete docílit.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {goalsQuery.data.map((goal) => (
            <li key={goal.id}>
              <Link
                to="/dogs/$dogId/goals/$goalId"
                params={{ dogId, goalId: goal.id }}
                className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-medium text-foreground">{goal.title}</p>
                  {goal.discipline ? (
                    <p className="truncate text-sm text-muted-foreground">{goal.discipline}</p>
                  ) : null}
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
