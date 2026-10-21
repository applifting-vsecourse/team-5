import { useCallback } from "react"
import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { EditGoalPage } from "@/features/dog/components/GoalEditorPage"

type GoalSearch = {
  // Set by "Uložit a naplánovat": open the day picker once the page loads (#71).
  naplanovat?: true
}

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId/goals/$goalId")({
  validateSearch: (search: Record<string, unknown>): GoalSearch =>
    search.naplanovat === true ? { naplanovat: true } : {},
  component: EditGoalRoute,
})

function EditGoalRoute() {
  const { dogId, goalId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  // Drop the flag once handled, so a reload does not open the picker again.
  const clearScheduleRequest = useCallback(() => {
    void navigate({ search: {}, replace: true })
  }, [navigate])

  return (
    <>
      <Seo title="Tvorba tréninku" />
      <EditGoalPage
        dogId={dogId}
        goalId={goalId}
        isScheduleRequested={search.naplanovat === true}
        onScheduleRequestHandled={clearScheduleRequest}
      />
    </>
  )
}
