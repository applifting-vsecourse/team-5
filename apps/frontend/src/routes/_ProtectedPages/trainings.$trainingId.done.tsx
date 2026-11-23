import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { TrainingSavedConfirmation } from "@/features/training/components/TrainingSavedConfirmation"
import {
  parseTrainingReturnSearch,
  type TrainingReturnSearch,
} from "@/features/training/lib/trainingReturn"

export const Route = createFileRoute("/_ProtectedPages/trainings/$trainingId/done")({
  validateSearch: (search: Record<string, unknown>): TrainingReturnSearch =>
    parseTrainingReturnSearch(search),
  component: TrainingDonePage,
})

function TrainingDonePage() {
  const { trainingId } = Route.useParams()
  const { zpet } = Route.useSearch()

  return (
    <>
      <Seo title="Záznam uložen" />
      <TrainingSavedConfirmation
        trainingId={trainingId}
        zpet={zpet}
      />
    </>
  )
}
