import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { AlertCircle, ChevronLeft } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import type { GoalFormValues } from "@/features/dog/api/dogSchemas"
import { dogDetailQueryOptions, goalQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { useCreateGoal } from "@/features/dog/hooks/useCreateGoal"
import { useUpdateGoal } from "@/features/dog/hooks/useUpdateGoal"

import { GoalForm } from "./GoalForm"

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

  const handleSubmit = async (values: GoalFormValues) => {
    try {
      const goal = await createGoal.mutateAsync(values)
      // The plan's exercises are added to this goal next, so stay on its page.
      await navigate({
        to: "/dogs/$dogId/goals/$goalId",
        params: { dogId, goalId: goal.id },
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
          message="Tento pes neexistuje nebo k němu nemáte přístup."
          onRetry={() => void dogQuery.refetch()}
        />
      ) : (
        <GoalForm
          disciplines={dog.disciplines}
          isPending={createGoal.isPending}
          onSubmit={handleSubmit}
        />
      )}
    </GoalPageShell>
  )
}

export function EditGoalPage({ dogId, goalId }: { dogId: string; goalId: string }) {
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
          message="Tento cíl neexistuje nebo k němu nemáte přístup."
          onRetry={() => {
            void dogQuery.refetch()
            void goalQuery.refetch()
          }}
        />
      ) : (
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
      )}
    </GoalPageShell>
  )
}
