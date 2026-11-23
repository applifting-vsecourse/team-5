import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AlertCircle, ChevronLeft } from "lucide-react"

import { Seo } from "@/components/Seo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import {
  isTrainingMissing,
  trainingDetailQueryOptions,
} from "@/features/training/api/trainingsQueryOptions"
import { FinishTrainingForm } from "@/features/training/components/FinishTrainingForm"
import {
  leaveTraining,
  parseTrainingReturnSearch,
  toTrainingReturnSearch,
  trainingHomeLabel,
  type TrainingReturnSearch,
} from "@/features/training/lib/trainingReturn"

export const Route = createFileRoute("/_ProtectedPages/trainings/$trainingId/finish")({
  validateSearch: (search: Record<string, unknown>): TrainingReturnSearch =>
    parseTrainingReturnSearch(search),
  component: TrainingFinishPage,
})

function TrainingFinishPage() {
  const { trainingId } = Route.useParams()
  const { zpet } = Route.useSearch()
  const navigate = useNavigate()
  const trainingQuery = useQuery(trainingDetailQueryOptions(trainingId))
  const homeLabel = trainingHomeLabel(zpet)
  const returnSearch = toTrainingReturnSearch(zpet)
  const goHome = () => leaveTraining((opts) => navigate(opts), zpet)

  // A paused fetch stays pending and would hide the failure message.
  if (trainingQuery.isPending && !trainingQuery.isPaused) {
    return (
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-2xl flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="h-6 w-32" />
        </header>
        <div className="flex flex-1 flex-col gap-6 px-4 py-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
          <Skeleton className="h-4 w-72" />
          <div className="flex-1" />
          <Skeleton className="h-11 w-full rounded-md" />
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

  if (training.canTrain === false || training.status !== "PLANNED") {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-gutter py-6">
        <h1 className="text-page font-extrabold">
          {training.canTrain === false ? "Náhled tréninku" : "Trénink je uzavřený"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Záznam může uložit pouze psovod u naplánovaného tréninku.
        </p>
        <Button
          asChild
          variant="outline"
        >
          <Link
            to="/trainings/$trainingId"
            params={{ trainingId: training.id }}
            search={returnSearch}
          >
            Zpět k tréninku
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Seo title={`Záznam po tréninku · ${training.dog.name}`} />
      <FinishTrainingForm
        trainingId={training.id}
        dog={training.dog}
        goal={training.training ?? training.goal}
        stepCount={training.exercises.length}
        zpet={zpet}
        plannedDurationMinutes={
          training.exercises.every((step) => step.durationMinutes !== undefined)
            ? training.exercises.reduce((sum, step) => sum + (step.durationMinutes ?? 0), 0)
            : undefined
        }
      />
    </>
  )
}
