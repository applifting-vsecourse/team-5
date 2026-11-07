import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { TrainingSavedConfirmation } from "@/features/training/components/TrainingSavedConfirmation"

export const Route = createFileRoute("/_ProtectedPages/trainings/$trainingId/done")({
  component: TrainingDonePage,
})

function TrainingDonePage() {
  const { trainingId } = Route.useParams()

  return (
    <>
      <Seo title="Záznam uložen" />
      <TrainingSavedConfirmation trainingId={trainingId} />
    </>
  )
}
