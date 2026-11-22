import { useCallback } from "react"
import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { useSession } from "@/features/auth/hooks/useSession"
import { EditGoalPage } from "@/features/dog/components/GoalEditorPage"

type GoalSearch = {
  // Set by "Uložit a naplánovat": open the day picker once the page loads (#71).
  naplanovat?: true
  novyTrenink?: true
  session?: string
  // Set when opened from a training record (#68) to return there after editing.
  zaznam?: string
}

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId/goals/$goalId")({
  validateSearch: (search: Record<string, unknown>): GoalSearch => ({
    ...(search.novyTrenink === true ? { novyTrenink: true as const } : {}),
    ...(search.naplanovat === true ? { naplanovat: true as const } : {}),
    ...(typeof search.session === "string" && search.session ? { session: search.session } : {}),
    ...(typeof search.zaznam === "string" && search.zaznam ? { zaznam: search.zaznam } : {}),
  }),
  component: EditGoalRoute,
})

function EditGoalRoute() {
  const { dogId, goalId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { user } = useSession()

  // Drop the flag once handled, so a reload does not open the picker again.
  const clearScheduleRequest = useCallback(() => {
    void navigate({
      search: (previous) => ({ session: previous.session, zaznam: previous.zaznam }),
      replace: true,
    })
  }, [navigate])

  return (
    <>
      <Seo title="Tvorba tréninku" />
      <EditGoalPage
        dogId={dogId}
        goalId={goalId}
        returnToActivityId={search.zaznam}
        currentUserId={user?.id}
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
            // Omit `session` entirely when clearing — `session: undefined` can leave
            // the in-memory search stuck while the URL already dropped the param.
            search: (previous) => {
              const rest = Object.fromEntries(
                Object.entries(previous).filter(
                  ([key]) => key !== "session" && key !== "novyTrenink",
                ),
              ) as typeof previous
              return session ? { ...rest, session } : rest
            },
            replace: true,
          })
        }
        isScheduleRequested={search.naplanovat === true}
        onScheduleRequestHandled={clearScheduleRequest}
      />
    </>
  )
}
