import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { dogColorClass } from "@/lib/dogColors"
import { dogMetricsQueryOptions } from "@/lib/dogMetrics"
import { dogHistoryFirstPageQueryOptions } from "@/lib/history"
import { cn } from "@/lib/utils"

import { clientDogGoalsQueryOptions } from "@/features/client/api/clientDogGoals"
import { clientDogPlanProgressQueryOptions } from "@/features/client/api/clientDogPlanProgress"

type DogRef = { id: string; name: string; color: number }

type TrainerDogPanelProps = {
  dog: DogRef
  dogs?: DogRef[]
  clientName: string
  onClose: () => void
  onSelectDog?: (dogId: string) => void
  onSchedule?: () => void
}

/** Right context panel after selecting a heatmap row (Figma 128:1560). */
export function TrainerDogPanel({
  dog,
  dogs = [],
  clientName,
  onClose,
  onSelectDog,
  onSchedule,
}: TrainerDogPanelProps) {
  const metrics = useQuery(dogMetricsQueryOptions(dog.id))
  const history = useQuery(dogHistoryFirstPageQueryOptions(dog.id))
  const goals = useQuery(clientDogGoalsQueryOptions(dog.id))
  // Progress bars as on the dog profile (Figma 128:1560).
  const progressByGoal = useQuery(clientDogPlanProgressQueryOptions(dog.id)).data
  const activeGoals = (goals.data ?? []).filter((goal) => goal.status === "ACTIVE").slice(0, 2)
  const lastRecord = (history.data?.items ?? []).find((item) => item.status === "COMPLETED")
  const weeks = (metrics.data?.weeks ?? []).slice(-8)
  const rate = metrics.data?.successRate
  const siblings = dogs.length > 1 ? dogs : []

  return (
    <aside
      aria-label={`Panel psa ${dog.name}`}
      className="flex w-full min-w-0 flex-col gap-4 lg:w-context lg:shrink-0"
    >
      <article
        className={cn(
          "flex flex-col gap-4 overflow-hidden rounded-card text-dog-foreground",
          dogColorClass(dog.color),
        )}
      >
        <header className="flex items-start gap-3 p-4 pb-0">
          <div className="min-w-0 flex-1 space-y-0.5">
            <h2 className="text-xl font-extrabold tracking-tight">{dog.name}</h2>
            <p className="text-sm font-medium opacity-90">{clientName}</p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-touch shrink-0 text-dog-foreground hover:bg-dog-foreground/15 hover:text-dog-foreground"
            onClick={onClose}
            aria-label="Zavřít panel psa"
          >
            <X className="size-5" />
          </Button>
        </header>

        {siblings.length > 0 && onSelectDog ? (
          <div
            className="flex flex-wrap gap-2 px-4"
            role="group"
            aria-label="Psi klienta"
          >
            {siblings.map((sibling) => (
              <Button
                key={sibling.id}
                type="button"
                size="sm"
                variant={sibling.id === dog.id ? "secondary" : "ghost"}
                aria-pressed={sibling.id === dog.id}
                className={cn(
                  "min-h-9 font-bold text-dog-foreground",
                  sibling.id === dog.id
                    ? "bg-dog-foreground/20 hover:bg-dog-foreground/25"
                    : "hover:bg-dog-foreground/15",
                )}
                onClick={() => onSelectDog(sibling.id)}
              >
                {sibling.name}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-[auto_1fr] items-end gap-3 px-4">
          {metrics.isError ? (
            <div
              role="alert"
              className="col-span-2 space-y-2"
            >
              <p className="text-sm font-medium">Metriky se nepodařilo načíst.</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="bg-dog-foreground/15 text-dog-foreground hover:bg-dog-foreground/25"
                onClick={() => void metrics.refetch()}
              >
                Zkusit znovu
              </Button>
            </div>
          ) : (
            <>
              <p className="text-3xl font-extrabold tabular-nums">
                {metrics.isLoading || rate === null || rate === undefined
                  ? "—"
                  : `${Math.round(rate)} %`}
              </p>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold opacity-90">Úspěšnost 8 týdnů</p>
                <div
                  role="img"
                  aria-label={
                    weeks.length
                      ? `Úspěšnost: ${weeks
                          .map((week) =>
                            week.successRate === null
                              ? "bez hodnocení"
                              : `${Math.round(week.successRate)} %`,
                          )
                          .join(", ")}`
                      : "Bez týdenních dat"
                  }
                  className="flex h-8 items-end gap-0.5"
                >
                  {(weeks.length ? weeks : Array.from({ length: 8 }, () => null)).map(
                    (week, index) => (
                      <span
                        key={week?.from ?? index}
                        className="flex-1 rounded-sm bg-dog-foreground/35"
                        style={{
                          height: `${Math.max(20, week?.successRate ?? 20)}%`,
                        }}
                      />
                    ),
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-t-card bg-card p-4 text-card-foreground">
          <section
            aria-labelledby="panel-goals-heading"
            className="space-y-2"
          >
            <h3
              id="panel-goals-heading"
              className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase"
            >
              Cíle
            </h3>
            {goals.isError ? (
              <div
                role="alert"
                className="space-y-2"
              >
                <p className="text-sm text-destructive">Cíle se nepodařilo načíst.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void goals.refetch()}
                >
                  Zkusit znovu
                </Button>
              </div>
            ) : goals.isLoading ? (
              <p className="text-sm text-muted-foreground">Načítání cílů…</p>
            ) : activeGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Žádný aktivní cíl.</p>
            ) : (
              <ul className="space-y-2">
                {activeGoals.map((goal) => {
                  const progress = progressByGoal?.get(goal.id)
                  return (
                    <li key={goal.id}>
                      <Link
                        to="/dogs/$dogId/goals/$goalId"
                        params={{ dogId: dog.id, goalId: goal.id }}
                        className="block space-y-1.5 rounded-field border border-border px-3 py-2 outline-hidden hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block text-sm font-bold break-words">
                              {goal.title}
                            </span>
                            {goal.discipline && (
                              <span className="block text-xs text-muted-foreground">
                                {goal.discipline}
                              </span>
                            )}
                          </span>
                          {progress && (
                            <span className="shrink-0 text-sm font-extrabold tabular-nums">
                              {progress.percent} %
                            </span>
                          )}
                        </span>
                        {progress && (
                          <Progress
                            value={progress.percent}
                            aria-label={`${goal.title}: ${progress.completed} z ${progress.total} tréninků odcvičeno`}
                            className="h-1.5"
                          />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section
            aria-labelledby="panel-last-heading"
            className="space-y-2"
          >
            <h3
              id="panel-last-heading"
              className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase"
            >
              Poslední záznam
            </h3>
            {history.isError ? (
              <div
                role="alert"
                className="space-y-2"
              >
                <p className="text-sm text-destructive">Záznam se nepodařilo načíst.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void history.refetch()}
                >
                  Zkusit znovu
                </Button>
              </div>
            ) : history.isLoading ? (
              <p className="text-sm text-muted-foreground">Načítání záznamu…</p>
            ) : !lastRecord ? (
              <p className="text-sm text-muted-foreground">Zatím bez záznamu.</p>
            ) : (
              <div className="space-y-2 rounded-field border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm font-bold">{lastRecord.title}</p>
                  <span className="shrink-0 text-sm font-extrabold tabular-nums">
                    {lastRecord.successRate === null
                      ? "—"
                      : `${Math.round(lastRecord.successRate)} %`}
                  </span>
                </div>
                {lastRecord.note && (
                  <p className="text-sm text-muted-foreground italic">„{lastRecord.note}“</p>
                )}
              </div>
            )}
          </section>

          <div className="flex flex-wrap gap-2">
            {lastRecord ? (
              <Button
                asChild
                variant="outline"
                className="flex-1 bg-card font-bold"
              >
                <Link
                  to="/dogs/$dogId/activities/$activityId"
                  params={{ dogId: dog.id, activityId: lastRecord.id }}
                >
                  Odpovědět
                </Link>
              </Button>
            ) : null}
            <Button
              type="button"
              className="flex-1 font-bold"
              onClick={onSchedule}
              disabled={!onSchedule}
            >
              Naplánovat
            </Button>
          </div>
        </div>
      </article>
    </aside>
  )
}
