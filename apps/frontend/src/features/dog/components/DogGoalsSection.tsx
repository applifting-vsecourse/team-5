import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Check, ChevronRight, Folder, Plus, Target } from "lucide-react"

import { ConfirmDestructiveDialog } from "@/components/ConfirmDestructiveDialog"
import { EditorIcon } from "@/components/EditorIcon"
import { EmptyState } from "@/components/EmptyState"
import { QueryState } from "@/components/QueryState"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { dogPlanQueryOptions, type PlanGoal } from "@/features/dog/api/trainingEditor"
import { useSetDogDiscipline } from "@/features/dog/hooks/useSetDogDiscipline"

export function GoalProgressCard({ goal, dogId }: { goal: PlanGoal; dogId: string }) {
  const completed = goal.sessions.filter((s) =>
    s.scheduledTrainings?.some((t) => t.status === "COMPLETED"),
  ).length
  const count = goal.sessions.length
  const percent = count ? Math.round((completed / count) * 100) : 0
  const next = goal.sessions
    .filter((s) => !s.isArchived)
    .find((s) => !s.scheduledTrainings?.some((t) => t.status === "COMPLETED"))
  const planned = next?.scheduledTrainings?.find((t) => t.status === "PLANNED")
  return (
    <article className="space-y-3 rounded-card border border-border bg-card p-4">
      <Link
        to="/dogs/$dogId/goals/$goalId"
        params={{ dogId, goalId: goal.id }}
        className="flex min-h-touch items-center justify-between gap-3 rounded-field"
      >
        <span className="min-w-0">
          <span className="block text-sm font-extrabold break-words">{goal.title}</span>
          <span className="text-xs text-muted-foreground">
            {goal.deadline
              ? `do ${new Date(`${goal.deadline}T12:00:00`).toLocaleDateString("cs-CZ")}`
              : "Bez termínu"}
            {goal.status === "ARCHIVED" ? " · Archiv" : ""}
          </span>
        </span>
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-full p-1 text-xs font-extrabold"
          style={{
            background: `conic-gradient(var(--success-foreground) ${percent}%, var(--secondary) 0)`,
          }}
          role="img"
          aria-label={`${percent} % tréninků dokončeno`}
        >
          <span className="flex size-full items-center justify-center rounded-full bg-card">
            {percent}%
          </span>
        </span>
      </Link>
      {goal.criterion && (
        <p className="flex items-start gap-2 rounded-field bg-secondary p-3 text-xs leading-relaxed">
          <EditorIcon name="Target" />
          <span>Hotovo, když: {goal.criterion}</span>
        </p>
      )}
      <div className="flex items-center gap-3">
        <div
          className="flex min-w-0 flex-1 gap-1"
          aria-hidden="true"
        >
          {goal.sessions.map((s) => (
            <span
              key={s.id}
              className={cn(
                "h-3.5 min-w-0 flex-1 rounded-sm",
                s.scheduledTrainings?.some((t) => t.status === "COMPLETED")
                  ? "bg-success-foreground"
                  : "bg-secondary",
              )}
            />
          ))}
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">
          {completed} z {count} tréninků
        </p>
      </div>
      {next && goal.status !== "ARCHIVED" && goal.status !== "COMPLETED" && (
        <Link
          to="/dogs/$dogId/goals/$goalId"
          params={{ dogId, goalId: goal.id }}
          search={{ session: next.id }}
          className="flex min-h-touch items-center gap-3 rounded-field border border-border bg-background p-3"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-extrabold text-primary-foreground">
            {next.position + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted-foreground">
              DALŠÍ · TRÉNINK {next.position + 1}
              {planned
                ? ` · ${planned.date.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" })}`
                : ""}
            </span>
            <span className="block text-sm font-bold break-words">
              {next.title} · {next.steps.length} kroků
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      )}
    </article>
  )
}

export function DogGoalsSection({
  dogId,
  dogName,
  shouldHideTitle = false,
  discipline,
}: {
  dogId: string
  dogName: string
  shouldHideTitle?: boolean
  discipline?: string
}) {
  const query = useQuery(dogPlanQueryOptions(dogId))
  const setDisciplineMutation = useSetDogDiscipline(dogId)
  const groups = (query.data ?? []).filter(
    (d) => d.goals.length > 0 && (!discipline || d.discipline.name === discipline),
  )
  return (
    <section
      className="space-y-6"
      aria-labelledby="goals-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2
            id="goals-heading"
            className={shouldHideTitle ? "sr-only" : "text-section font-extrabold"}
          >
            Cíle
          </h2>
          <p className="text-xs text-muted-foreground">
            {dogName} · {groups.length} disciplín ·{" "}
            {groups.flatMap((d) => d.goals).filter((g) => g.status === "ACTIVE").length} aktivní
            cíle
          </p>
        </div>
        <Button
          asChild
          size="icon"
          className="rounded-field"
        >
          <Link
            to="/dogs/$dogId/goals/new"
            params={{ dogId }}
            aria-label="Nový cíl"
          >
            <Plus />
          </Link>
        </Button>
      </div>
      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={!groups.length}
        loadingLabel="Načítání cílů"
        errorTitle="Cíle se nepodařilo načíst"
        empty={
          <EmptyState
            icon={Target}
            titleAs="p"
            title={`${dogName} zatím nemá žádný cíl`}
            description="Vytvoř cíl v disciplíně a přidej první trénink."
          />
        }
      >
        <div className="space-y-6">
          {groups.map((group) => (
            <section
              key={group.id}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="flex items-center gap-2 text-xs font-extrabold tracking-wide uppercase">
                    <Folder className="size-4 text-primary" />
                    {group.discipline.name}
                    {group.isArchived ? " · Archiv" : ""}
                  </h3>
                  {group.isArchived ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDisciplineMutation.mutate({
                          name: group.discipline.name,
                          isArchived: false,
                        })
                      }
                      disabled={setDisciplineMutation.isPending}
                      className="h-7 px-2.5 text-xs font-semibold"
                    >
                      Obnovit disciplínu
                    </Button>
                  ) : (
                    <ConfirmDestructiveDialog
                      title={`Ukončit disciplínu ${group.discipline.name}?`}
                      description="Disciplína se přesune do archivu. Všechny její cíle, tréninky a historie zůstanou zachovány a můžete ji kdykoliv znovu obnovit."
                      confirmLabel="Ukončit disciplínu"
                      onConfirm={() =>
                        setDisciplineMutation.mutate({
                          name: group.discipline.name,
                          isArchived: true,
                        })
                      }
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={setDisciplineMutation.isPending}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                        >
                          Ukončit
                        </Button>
                      }
                    />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {group.goals.filter((g) => g.status === "ACTIVE").length} aktivní ·{" "}
                  {group.goals.filter((g) => g.status === "COMPLETED").length} splněné
                </span>
              </div>
              {group.goals.map((goal) =>
                goal.status === "COMPLETED" ? (
                  <Link
                    key={goal.id}
                    to="/dogs/$dogId/goals/$goalId"
                    params={{ dogId, goalId: goal.id }}
                    className="flex min-h-touch items-center gap-3 rounded-card bg-success p-3 text-success-foreground"
                  >
                    <Check className="size-8 shrink-0" />
                    <span>
                      <span className="block text-sm font-bold">{goal.title}</span>
                      <span className="text-xs">Splněný cíl · {goal.sessions.length} tréninků</span>
                    </span>
                  </Link>
                ) : (
                  <GoalProgressCard
                    key={goal.id}
                    dogId={dogId}
                    goal={goal}
                  />
                ),
              )}
            </section>
          ))}
        </div>
      </QueryState>
    </section>
  )
}
