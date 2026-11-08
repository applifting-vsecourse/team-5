import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { TrainingRecordPage } from "@/features/dog/components/TrainingRecordPage"

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId/activities/$activityId")({
  component: TrainingRecordRoute,
})

function TrainingRecordRoute() {
  const { dogId, activityId } = Route.useParams()
  return (
    <>
      <Seo title="Záznam tréninku" />
      <TrainingRecordPage
        dogId={dogId}
        activityId={activityId}
      />
    </>
  )
}
