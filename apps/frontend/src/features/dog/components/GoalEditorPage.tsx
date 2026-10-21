import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { HTTPError } from "ky"
import { AlertCircle, ChevronLeft } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import type { GoalFormValues } from "@/features/dog/api/dogSchemas"
import { dogDetailQueryOptions, goalQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { useCreateGoal } from "@/features/dog/hooks/useCreateGoal"
import { useUpdateGoal } from "@/features/dog/hooks/useUpdateGoal"

import { GoalForm } from "./GoalForm"
import { PlanBlocksSection } from "./PlanBlocksSection"
import { TrainingScheduleSection } from "./TrainingScheduleSection"

type GoalPageShellProps = {
  dogId: string
  dogName?: string
  title: string
  subtitle?: string
  children: React.ReactNode
}

// "Tvorba tréninku": the goal header now (#62), the plan's blocks below it later (#63).
function GoalPageShell({ dogId, dogName, title, subtitle, children }: GoalPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-8">
      <header className="mb-8 flex items-center gap-2">
        <Link
          to="/dogs/$dogId"
          params={{ dogId }}
          aria-label={dogName ? `Zpět na psa ${dogName}` : "Zpět na psa"}
          className="-ml-3 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </header>
      {children}
    </div>
  )
}

function GoalPageLoading() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
    >
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

// "Does not exist or no access" only for a real 404; a network error, a 500 or
// an unexpected response is worth retrying, so it says so.
const loadFailureMessage = (errors: (Error | null)[], notFoundMessage: string): string =>
  errors.some((error) => error && !(error instanceof HTTPError && error.response.status === 404))
    ? "Nepodařilo se načíst. Zkontrolujte připojení a zkuste to znovu."
    : notFoundMessage

function GoalPageError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>Nepodařilo se načíst</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{message}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
        >
          Zkusit znovu
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export function NewGoalPage({ dogId }: { dogId: string }) {
  const navigate = useNavigate()
  const dogQuery = useQuery(dogDetailQueryOptions(dogId))
  const createGoal = useCreateGoal(dogId)

  const dog = dogQuery.data

  const saveGoal = async (values: GoalFormValues, shouldSchedule: boolean) => {
    try {
      const goal = await createGoal.mutateAsync(values)
      // The plan's exercises are added to this goal next, so stay on its page;
      // "Uložit a naplánovat" also opens the day picker there (#71).
      await navigate({
        to: "/dogs/$dogId/goals/$goalId",
        params: { dogId, goalId: goal.id },
        search: shouldSchedule ? { naplanovat: true } : {},
        replace: true,
      })
    } catch {
      // useCreateGoal already told the user; keep the form as it is.
    }
  }

  return (
    <GoalPageShell
      dogId={dogId}
      dogName={dog?.name}
      title="Nový cíl"
      subtitle={dog ? `Pro psa ${dog.name}` : undefined}
    >
      {dogQuery.isLoading ? (
        <GoalPageLoading />
      ) : dogQuery.error || !dog ? (
        <GoalPageError
          message={loadFailureMessage(
            [dogQuery.error],
            "Tento pes neexistuje nebo k němu nemáte přístup.",
          )}
          onRetry={() => void dogQuery.refetch()}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <GoalForm
            disciplines={dog.disciplines}
            isPending={createGoal.isPending}
            onSubmit={(values) => saveGoal(values, false)}
            onSubmitAndSchedule={(values) => saveGoal(values, true)}
          />
          <p className="text-sm text-muted-foreground">
            Cviky k cíli přidáte hned po jeho uložení.
          </p>
        </div>
      )}
    </GoalPageShell>
  )
}

type EditGoalPageProps = {
  dogId: string
  goalId: string
  isScheduleRequested?: boolean
  onScheduleRequestHandled?: () => void
}

export function EditGoalPage({
  dogId,
  goalId,
  isScheduleRequested,
  onScheduleRequestHandled,
}: EditGoalPageProps) {
  const dogQuery = useQuery(dogDetailQueryOptions(dogId))
  const goalQuery = useQuery(goalQueryOptions(goalId))
  const updateGoal = useUpdateGoal(dogId, goalId)

  const dog = dogQuery.data
  // A goal opened under a different dog's URL is treated as not found.
  const goal = goalQuery.data?.dogId === dogId ? goalQuery.data : undefined

  const handleSubmit = async (values: GoalFormValues) => {
    try {
      await updateGoal.mutateAsync(values)
    } catch {
      // useUpdateGoal already told the user; keep the form as it is.
    }
  }

  const isLoading = dogQuery.isLoading || goalQuery.isLoading

  return (
    <GoalPageShell
      dogId={dogId}
      dogName={dog?.name}
      title={goal?.title ?? "Cíl"}
      subtitle={dog && goal ? `Pro psa ${dog.name} · Autor: ${goal.createdBy.name}` : undefined}
    >
      {isLoading ? (
        <GoalPageLoading />
      ) : !dog || !goal ? (
        <GoalPageError
          message={loadFailureMessage(
            [dogQuery.error, goalQuery.error],
            "Tento cíl neexistuje nebo k němu nemáte přístup.",
          )}
          onRetry={() => {
            void dogQuery.refetch()
            void goalQuery.refetch()
          }}
        />
      ) : (
        <div className="flex flex-col gap-12">
          <GoalForm
            key={goal.id}
            disciplines={dog.disciplines}
            defaultValues={{
              title: goal.title,
              discipline: goal.discipline ?? "",
              principle: goal.principle ?? "",
            }}
            isPending={updateGoal.isPending}
            onSubmit={handleSubmit}
          />
          <PlanBlocksSection goalId={goal.id} />
          <TrainingScheduleSection
            goalId={goal.id}
            dogName={dog.name}
            isScheduleRequested={isScheduleRequested}
            onScheduleRequestHandled={onScheduleRequestHandled}
          />
        </div>
      )}
    </GoalPageShell>
  )
}
