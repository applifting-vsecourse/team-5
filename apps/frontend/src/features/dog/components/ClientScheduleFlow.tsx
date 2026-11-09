import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"

import { QueryState } from "@/components/QueryState"
import { Button } from "@/components/ui/button"

import { dogPlanQueryOptions } from "@/features/dog/api/trainingEditor"
import { EditorSheet } from "@/features/dog/components/EditorSheet"
import { SessionScheduleSheet } from "@/features/dog/components/SessionScheduleSheet"

// Mount a fresh flow for each request so a previous client's choices cannot leak.
export function ClientScheduleFlow({
  client,
  onClose,
}: {
  client: { name: string; dogs: { id: string; name: string }[] }
  onClose: () => void
}) {
  const [dogId, setDogId] = useState(client.dogs.length === 1 ? (client.dogs[0]?.id ?? "") : "")
  const [isCalendarOpen, setCalendarOpen] = useState(false)
  const [goalId, setGoalId] = useState("")
  const [sessionId, setSessionId] = useState("")
  const dog = client.dogs.find((item) => item.id === dogId)
  const plan = useQuery(dogPlanQueryOptions(dogId))
  const goals = (plan.data ?? [])
    .filter((item) => !item.isArchived)
    .flatMap((item) => item.goals)
    .filter((item) => item.status === "ACTIVE")
  const goal =
    goals.find((item) => item.id === goalId) ?? (goals.length === 1 ? goals[0] : undefined)
  const sessions = goal?.sessions.filter((item) => !item.isArchived) ?? []
  const session =
    sessions.find((item) => item.id === sessionId) ??
    (sessions.length === 1 ? sessions[0] : undefined)

  if (dog && goal && session && isCalendarOpen) {
    return (
      <SessionScheduleSheet
        sessionId={session.id}
        goalId={goal.id}
        dogId={dog.id}
        description={`${dog.name} · ${goal.title} · ${session.title}`}
        onBack={() => setCalendarOpen(false)}
        isOpen
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose()
        }}
      />
    )
  }

  return (
    <EditorSheet
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
      title={!dog ? "Pro kterého psa?" : !goal ? "Ke kterému cíli?" : "Který trénink?"}
      description={[client.name, dog?.name, goal?.title].filter(Boolean).join(" · ")}
    >
      <div className="space-y-3">
        {!dog ? (
          client.dogs.map((item) => (
            <Button
              key={item.id}
              variant="outline"
              className="w-full justify-start bg-card"
              onClick={() => {
                setDogId(item.id)
                setGoalId("")
                setSessionId("")
              }}
            >
              {item.name}
            </Button>
          ))
        ) : (
          <QueryState
            isLoading={plan.isLoading}
            error={plan.error}
            onRetry={() => void plan.refetch()}
            empty={null}
          >
            {plan.isSuccess &&
              (goals.length === 0 ? (
                <div className="space-y-3">
                  <p>
                    Nejdřív u psa založ aktivní cíl. Potom k němu přidej trénink a naplánuj jeho
                    dny.
                  </p>
                  <Button
                    asChild
                    className="w-full"
                  >
                    <Link
                      to="/dogs/$dogId/goals/new"
                      params={{ dogId: dog.id }}
                    >
                      Vytvořit nový cíl
                    </Link>
                  </Button>
                </div>
              ) : !goal ? (
                goals.map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    className="w-full justify-start bg-card"
                    onClick={() => {
                      setGoalId(item.id)
                      setSessionId("")
                    }}
                  >
                    {item.title}
                  </Button>
                ))
              ) : (
                <div className="space-y-3">
                  {goal.criterion && (
                    <p className="text-sm text-muted-foreground">Hotovo, když: {goal.criterion}</p>
                  )}
                  {session && (
                    <div className="space-y-2 rounded-field bg-secondary p-3">
                      <p className="font-bold">{session.title}</p>
                      <p className="text-sm">
                        {session.steps.length} kroků ·{" "}
                        {session.steps.reduce((sum, step) => sum + (step.durationMinutes ?? 0), 0)}{" "}
                        min
                      </p>
                      {session.steps.map((step) => (
                        <p
                          key={step.id}
                          className="text-sm"
                        >
                          {step.title}
                        </p>
                      ))}
                      <Button
                        className="w-full"
                        onClick={() => setCalendarOpen(true)}
                      >
                        Vybrat termíny
                      </Button>
                    </div>
                  )}
                  {sessions.length === 0 && <p>K tomuto cíli zatím není vytvořený trénink.</p>}
                  {sessions.length > 1 &&
                    sessions.map((item) => (
                      <Button
                        key={item.id}
                        variant="outline"
                        className="w-full justify-start bg-card"
                        onClick={() => setSessionId(item.id)}
                      >
                        {item.title}
                      </Button>
                    ))}
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                  >
                    <Link
                      to="/dogs/$dogId/goals/$goalId"
                      params={{ dogId: dog.id, goalId: goal.id }}
                      search={{ novyTrenink: true }}
                    >
                      Vytvořit nový trénink
                    </Link>
                  </Button>
                </div>
              ))}
          </QueryState>
        )}
        {dog && plan.isSuccess && goals.length > 0 && (
          <Button
            asChild
            variant="outline"
            className="w-full"
          >
            <Link
              to="/dogs/$dogId/goals/new"
              params={{ dogId: dog.id }}
            >
              Vytvořit nový cíl
            </Link>
          </Button>
        )}
        {dog && client.dogs.length > 1 && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setDogId("")
              setGoalId("")
              setSessionId("")
            }}
          >
            Vybrat jiného psa
          </Button>
        )}
        {goal && goals.length > 1 && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setGoalId("")
              setSessionId("")
            }}
          >
            Vybrat jiný cíl
          </Button>
        )}
      </div>
    </EditorSheet>
  )
}
