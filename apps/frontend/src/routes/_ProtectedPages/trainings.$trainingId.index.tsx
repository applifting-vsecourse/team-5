import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { AlertCircle, ChevronLeft } from "lucide-react"

import { Seo } from "@/components/Seo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ReadReplyReceipt } from "@/components/UnreadReplies"

import {
  isTrainingMissing,
  trainingDetailQueryOptions,
} from "@/features/training/api/trainingsQueryOptions"
import { TrainingWalkthrough } from "@/features/training/components/TrainingWalkthrough"
import {
  leaveTraining,
  parseTrainingReturnSearch,
  trainingHomeLabel,
  type TrainingReturnSearch,
} from "@/features/training/lib/trainingReturn"

export const Route = createFileRoute("/_ProtectedPages/trainings/$trainingId/")({
  validateSearch: (search: Record<string, unknown>): TrainingReturnSearch =>
    parseTrainingReturnSearch(search),
  component: TrainingWalkthroughPage,
})

function TrainingWalkthroughPage() {
  const { trainingId } = Route.useParams()
  const { zpet } = Route.useSearch()
  const navigate = useNavigate()
  const trainingQuery = useQuery(trainingDetailQueryOptions(trainingId))
  const homeLabel = trainingHomeLabel(zpet)
  const goHome = () => leaveTraining((opts) => navigate(opts), zpet)

  if (trainingQuery.isPending) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col bg-background">
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
        <button
          type="button"
          onClick={goHome}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          <span>{homeLabel}</span>
        </button>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>
            {isTrainingMissing(trainingQuery.error)
              ? "Trénink nebyl nalezen"
              : "Trénink se nepodařilo načíst"}
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {isTrainingMissing(trainingQuery.error)
                ? "Tento trénink neexistuje nebo k němu nemáte přístup."
                : "Spojení na chvíli vypadlo. Zkus to znovu."}
            </p>
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
      <ReadReplyReceipt ids={training.unreadReplyIds} />
      <TrainingWalkthrough
        training={training}
        zpet={zpet}
      />
    </>
  )
}
