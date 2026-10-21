import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { NewGoalPage } from "@/features/dog/components/GoalEditorPage"

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId/goals/new")({
  component: NewGoalRoute,
})

function NewGoalRoute() {
  const { dogId } = Route.useParams()

  return (
    <>
      <Seo title="Nový cíl" />
      <NewGoalPage dogId={dogId} />
    </>
  )
}
