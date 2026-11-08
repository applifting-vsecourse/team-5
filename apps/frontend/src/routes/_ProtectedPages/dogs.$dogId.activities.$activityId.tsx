import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { useSession } from "@/features/auth/hooks/useSession"
import { TrainingRecordPage } from "@/features/dog/components/TrainingRecordPage"

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId/activities/$activityId")({
  component: TrainingRecordRoute,
})

function TrainingRecordRoute() {
  const { dogId, activityId } = Route.useParams()
  const { user } = useSession()
  return (
    <>
      <Seo title="Záznam tréninku" />
      <TrainingRecordPage
        dogId={dogId}
        activityId={activityId}
        currentUserId={user?.id}
      />
    </>
  )
}
