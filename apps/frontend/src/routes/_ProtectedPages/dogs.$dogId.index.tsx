import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { AlertCircle, ChevronLeft } from "lucide-react"

import { Seo } from "@/components/Seo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { useSession } from "@/features/auth/hooks/useSession"
import { dogDetailQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { DogDetailView } from "@/features/dog/components/DogDetailView"

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId/")({
  component: DogDetailPage,
})

function DogDetailPage() {
  const { dogId } = Route.useParams()
  const dogQuery = useQuery(dogDetailQueryOptions(dogId))
  const { user } = useSession()

  if (dogQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
        <Skeleton className="h-6 w-24" />
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  if (dogQuery.error || !dogQuery.data) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-8">
        <Link
          to="/dogs"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          <span>Zpět na seznam psů</span>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Pes nebyl nalezen</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Tento pes neexistuje nebo k němu nemáte přístup.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void dogQuery.refetch()}
            >
              Zkusit znovu
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const dog = dogQuery.data
  const isOwner = user ? user.id === dog.ownerId : false

  return (
    <>
      <Seo title={`${dog.name} · Detail`} />
      <DogDetailView
        dog={dog}
        isOwner={isOwner}
      />
    </>
  )
}
