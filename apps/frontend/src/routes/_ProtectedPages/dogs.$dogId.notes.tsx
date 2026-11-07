import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"

import { EditorIcon } from "@/components/EditorIcon"
import { QueryState } from "@/components/QueryState"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"

import { useSession } from "@/features/auth/hooks/useSession"
import { dogDetailQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { DogNotesSection } from "@/features/dog/components/DogNotesSection"

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId/notes")({
  component: DogNotesPage,
})

function DogNotesPage() {
  const { dogId } = Route.useParams()
  const dog = useQuery(dogDetailQueryOptions(dogId))
  const { user } = useSession()
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-gutter py-6">
      <Seo title="Poznámky" />
      <header className="flex items-center gap-3">
        <Button
          asChild
          variant="outline"
          size="icon"
        >
          <Link
            to="/dogs/$dogId"
            params={{ dogId }}
            aria-label="Zpět na psa"
          >
            <EditorIcon name="ChevL" />
          </Link>
        </Button>
        <h1 className="text-page font-extrabold">Poznámky</h1>
      </header>
      <QueryState
        isLoading={dog.isLoading}
        error={dog.error}
        onRetry={() => void dog.refetch()}
        empty={null}
      >
        {dog.data &&
          (dog.data.ownerId === user?.id ? (
            <DogNotesSection
              dogId={dogId}
              dogName={dog.data.name}
            />
          ) : (
            <p role="alert">Poznámky jsou soukromé. Má k nim přístup pouze majitel psa.</p>
          ))}
      </QueryState>
    </div>
  )
}
