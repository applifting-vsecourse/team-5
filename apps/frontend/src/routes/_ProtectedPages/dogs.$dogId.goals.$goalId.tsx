import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { EditGoalPage } from "@/features/dog/components/GoalEditorPage"

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId/goals/$goalId")({
  component: EditGoalRoute,
})

function EditGoalRoute() {
  const { dogId, goalId } = Route.useParams()

  return (
    <>
      <Seo title="Tvorba tréninku" />
      <EditGoalPage
        dogId={dogId}
        goalId={goalId}
      />
    </>
  )
}
