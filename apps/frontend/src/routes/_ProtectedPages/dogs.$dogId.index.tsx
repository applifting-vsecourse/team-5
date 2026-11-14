import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { HTTPError } from "ky"
import { ChevronLeft } from "lucide-react"

import { QueryState } from "@/components/QueryState"
import { Seo } from "@/components/Seo"
import { Skeleton } from "@/components/ui/skeleton"

import { useSession } from "@/features/auth/hooks/useSession"
import { dogDetailQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { DogDetailView } from "@/features/dog/components/DogDetailView"

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId/")({
  component: DogDetailPage,
})

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 md:py-8">
      <Skeleton className="h-6 w-24" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <Skeleton className="h-28 w-full rounded-hero" />
      <Skeleton className="h-40 w-full rounded-item" />
    </div>
  )
}

function DogDetailPage() {
  const { dogId } = Route.useParams()
  const dogQuery = useQuery(dogDetailQueryOptions(dogId))
  const { user } = useSession()

  const isNotFound = dogQuery.error instanceof HTTPError && dogQuery.error.response.status === 404
  const isAccessLost = user?.role === "trainer" && isNotFound
  const notFoundMessage = isAccessLost
    ? "K tomuto psovi už nemáte přístup"
    : "Tento pes neexistuje nebo k němu nemáte přístup."
  const error = dogQuery.isError
    ? isNotFound
      ? new Error(notFoundMessage)
      : (dogQuery.error ?? new Error(notFoundMessage))
    : !dogQuery.isLoading && !dogQuery.data
      ? new Error(notFoundMessage)
      : null

  if (error) {
    return (
      <>
        <Seo title="Detail psa" />
        <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-8">
          <nav aria-label="Navigace zpět">
            <Link
              to={user?.role === "trainer" ? "/clients" : "/dogs"}
              className="group mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground outline-hidden transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={
                user?.role === "trainer" ? "Zpět na seznam klientů" : "Zpět na seznam psů"
              }
            >
              <ChevronLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
              <span>{user?.role === "trainer" ? "Klienti" : "Psi"}</span>
            </Link>
          </nav>
          <QueryState
            isLoading={false}
            error={error}
            isEmpty={false}
            empty={null}
            onRetry={isNotFound ? undefined : () => void dogQuery.refetch()}
            errorTitle={isAccessLost ? "Přístup byl ukončen" : "Pes nebyl nalezen"}
            errorDescription={notFoundMessage}
          >
            {null}
          </QueryState>
        </div>
      </>
    )
  }

  const dog = dogQuery.data

  return (
    <>
      <Seo title={dog ? `${dog.name} · Detail` : "Detail psa"} />
      <QueryState
        isLoading={dogQuery.isLoading}
        error={null}
        isEmpty={false}
        empty={null}
        onRetry={() => void dogQuery.refetch()}
        loadingLabel="Načítání profilu psa"
        skeleton={<ProfileSkeleton />}
      >
        {dog ? (
          <DogDetailView
            dog={dog}
            isOwner={user ? user.id === dog.ownerId : false}
          />
        ) : null}
      </QueryState>
    </>
  )
}
