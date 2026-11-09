import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"

import { EditorIcon } from "@/components/EditorIcon"
import { QueryState } from "@/components/QueryState"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import { dogColorClass } from "@/lib/dogColors"

import { dogDetailQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { dogPlanQueryOptions } from "@/features/dog/api/trainingEditor"
import { DogGoalsSection } from "@/features/dog/components/DogGoalsSection"

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId/goals/")({
  validateSearch: (search: Record<string, unknown>): { disciplina?: string } => ({
    disciplina:
      typeof search.disciplina === "string" && search.disciplina.trim().length <= 60
        ? search.disciplina.trim() || undefined
        : undefined,
  }),
  component: DogGoalsPage,
})

function DogGoalsPage() {
  const { dogId } = Route.useParams()
  const { disciplina } = Route.useSearch()
  const dog = useQuery(dogDetailQueryOptions(dogId))
  const plan = useQuery(dogPlanQueryOptions(dogId))
  const groups = (plan.data ?? []).filter(
    (group) => group.goals.length && (!disciplina || group.discipline.name === disciplina),
  )
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-gutter py-6">
      <Seo title="Cíle psa" />
      <header className="flex items-center gap-3">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="rounded-field"
        >
          <Link
            to="/dogs/$dogId"
            params={{ dogId }}
            aria-label="Zpět na psa"
          >
            <EditorIcon name="ChevL" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-page font-extrabold tracking-tight">Cíle</h1>
          {dog.data && (
            <p className="flex items-center gap-1.5 text-label font-semibold text-muted-foreground">
              <span
                aria-hidden
                className={`size-2 shrink-0 rounded-sm ${dogColorClass(dog.data.color)}`}
              />
              {dog.data.name} · {groups.length} disciplín ·{" "}
              {
                groups.flatMap((group) => group.goals).filter((goal) => goal.status === "ACTIVE")
                  .length
              }{" "}
              aktivní cíle
            </p>
          )}
        </div>
        <Button
          asChild
          size="icon"
          className="shrink-0 rounded-field"
        >
          <Link
            to="/dogs/$dogId/goals/new"
            params={{ dogId }}
            aria-label="Nový cíl"
          >
            <EditorIcon name="Plus" />
          </Link>
        </Button>
      </header>
      {disciplina && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p>
            Disciplína: <strong>{disciplina}</strong>
          </p>
          <Link
            to="/dogs/$dogId/goals"
            params={{ dogId }}
            search={{}}
            className="inline-flex min-h-touch items-center font-bold text-primary"
          >
            Zobrazit všechny cíle
          </Link>
        </div>
      )}
      <QueryState
        isLoading={dog.isLoading}
        error={dog.error}
        onRetry={() => void dog.refetch()}
        empty={null}
      >
        {dog.data && (
          <DogGoalsSection
            dogId={dogId}
            dogName={dog.data.name}
            shouldHideTitle
            discipline={disciplina}
          />
        )}
      </QueryState>
    </div>
  )
}
