import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"

import { EditorIcon } from "@/components/EditorIcon"
import { QueryState } from "@/components/QueryState"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"

import { dogDetailQueryOptions } from "@/features/dog/api/dogsQueryOptions"
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
        <h1 className="text-page font-extrabold tracking-tight">Cíle</h1>
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
