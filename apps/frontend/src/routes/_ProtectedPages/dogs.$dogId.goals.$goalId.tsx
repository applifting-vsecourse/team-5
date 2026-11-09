import { useCallback } from "react"
import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { EditGoalPage } from "@/features/dog/components/GoalEditorPage"

type GoalSearch = {
  // Set by "Uložit a naplánovat": open the day picker once the page loads (#71).
  naplanovat?: true
  novyTrenink?: true
  session?: string
}

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId/goals/$goalId")({
  validateSearch: (search: Record<string, unknown>): GoalSearch => ({
    ...(search.novyTrenink === true ? { novyTrenink: true as const } : {}),
    ...(search.naplanovat === true ? { naplanovat: true as const } : {}),
    ...(typeof search.session === "string" && search.session ? { session: search.session } : {}),
  }),
  component: EditGoalRoute,
})

function EditGoalRoute() {
  const { dogId, goalId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  // Drop the flag once handled, so a reload does not open the picker again.
  const clearScheduleRequest = useCallback(() => {
    void navigate({ search: (previous) => ({ session: previous.session }), replace: true })
  }, [navigate])

  return (
    <>
      <Seo title="Tvorba tréninku" />
      <EditGoalPage
        dogId={dogId}
        goalId={goalId}
        isNewTrainingRequested={search.novyTrenink === true}
        onNewTrainingRequestHandled={() =>
          void navigate({
            search: (previous) => ({ ...previous, novyTrenink: undefined }),
            replace: true,
          })
        }
        selectedSessionId={search.session}
        onSessionChange={(session) =>
          void navigate({
            search: (previous) => ({ ...previous, session, novyTrenink: undefined }),
          })
        }
        isScheduleRequested={search.naplanovat === true}
        onScheduleRequestHandled={clearScheduleRequest}
      />
    </>
  )
}
