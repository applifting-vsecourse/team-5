import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { AlertCircle, ChevronLeft } from "lucide-react"

import { Seo } from "@/components/Seo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { trainingDetailQueryOptions } from "@/features/training/api/trainingsQueryOptions"
import { TrainingWalkthrough } from "@/features/training/components/TrainingWalkthrough"

export const Route = createFileRoute("/_ProtectedPages/trainings/$trainingId/")({
  component: TrainingWalkthroughPage,
})

function TrainingWalkthroughPage() {
  const { trainingId } = Route.useParams()
  const trainingQuery = useQuery(trainingDetailQueryOptions(trainingId))

  if (trainingQuery.isLoading) {
    return (
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-2xl flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="h-6 w-32" />
        </header>
        <div className="flex flex-1 flex-col gap-6 px-4 py-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-1 w-full" />
          </div>
          <Skeleton className="h-8 w-48" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  if (trainingQuery.error || !trainingQuery.data) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-8">
        <Link
          to="/week"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          <span>Zpět na týden</span>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Trénink nebyl nalezen</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Tento trénink neexistuje nebo k němu nemáte přístup.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void trainingQuery.refetch()}
            >
              Zkusit znovu
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const training = trainingQuery.data

  return (
    <>
      <Seo title={`Trénink · ${training.dog.name}`} />
      <TrainingWalkthrough training={training} />
    </>
  )
}
