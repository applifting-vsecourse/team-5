import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"

import { Seo } from "@/components/Seo"
import { Skeleton } from "@/components/ui/skeleton"

import { dogDetailQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { DogActivitiesSection } from "@/features/dog/components/DogActivitiesSection"

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId/activities")({
  component: DogActivitiesPage,
})

// The dog's whole training history; its page shows only the latest records.
function DogActivitiesPage() {
  const { dogId } = Route.useParams()
  const dogQuery = useQuery(dogDetailQueryOptions(dogId))
  const dogName = dogQuery.data?.name

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-8">
      <Seo title={dogName ? `${dogName} · Historie` : "Historie"} />
      <nav aria-label="Navigace zpět">
        <Link
          to="/dogs/$dogId"
          params={{ dogId }}
          className="group mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Zpět na detail psa"
        >
          <ChevronLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
          <span>{dogName ?? "Pes"}</span>
        </Link>
      </nav>

      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Historie tréninků</h1>

      {dogQuery.isLoading ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : (
        <DogActivitiesSection
          dogId={dogId}
          dogName={dogName ?? "Pes"}
        />
      )}
    </div>
  )
}
