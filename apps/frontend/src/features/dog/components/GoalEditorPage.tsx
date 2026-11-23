import { useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { ChevronDown, ChevronRight, ChevronUp, Target } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDestructiveDialog } from "@/components/ConfirmDestructiveDialog"
import { EditorIcon } from "@/components/EditorIcon"
import { EmptyState } from "@/components/EmptyState"
import { QueryState } from "@/components/QueryState"
import { StatusChip } from "@/components/StatusChip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api-client"
import { dogKeys } from "@/lib/dogKeys"
import { weekKeys } from "@/lib/weekKeys"

import type { GoalFormValues } from "@/features/dog/api/dogSchemas"
import { dogDetailQueryOptions, goalQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { setDogDiscipline } from "@/features/dog/api/setDogDiscipline"
import { createSession, dogPlanQueryOptions } from "@/features/dog/api/trainingEditor"
import { useCreateGoal } from "@/features/dog/hooks/useCreateGoal"
import { useUpdateGoal } from "@/features/dog/hooks/useUpdateGoal"

import { EditorSheet } from "./EditorSheet"
import { GoalForm } from "./GoalForm"
import { ReturnToRecordBanner } from "./ReturnToRecordBanner"
import { SessionEditor } from "./SessionEditor"

/** Replace the editor with the record. history.back() lands on whatever was previous, not this record. */
function leavePlanForRecord(
  navigate: ReturnType<typeof useNavigate>,
  dogId: string,
  activityId: string,
) {
  void navigate({
    to: "/dogs/$dogId/activities/$activityId",
    params: { dogId, activityId },
    replace: true,
  })
}

function GoalShell({
  dogId,
  title,
  subtitle,
  children,
}: {
  dogId: string
  title: string
  subtitle?: string
  children: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-gutter py-6">
      <header className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-field"
          aria-label="Zpět na cíle psa"
          onClick={() => {
            void navigate({ to: "/dogs/$dogId/goals", params: { dogId } })
          }}
        >
          <EditorIcon name="ChevL" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-page font-extrabold tracking-tight break-words">{title}</h1>
          <p className="text-label text-muted-foreground">{subtitle}</p>
        </div>
      </header>
      {children}
    </div>
  )
}

export function NewGoalPage({
  dogId,
  currentUserId,
}: {
  dogId: string
  currentUserId?: string | null
}) {
  const client = useQueryClient()
  const dogQuery = useQuery(dogDetailQueryOptions(dogId))
  const create = useCreateGoal(dogId)
  const navigate = useNavigate()
  const isOwner = Boolean(currentUserId && dogQuery.data?.ownerId === currentUserId)
  const addDiscipline = async (name: string) => {
    await setDogDiscipline(dogId, { name, isArchived: false })
    await Promise.all([
      client.invalidateQueries({ queryKey: dogKeys.detail(dogId) }),
      client.invalidateQueries({ queryKey: dogKeys.all }),
    ])
    toast.success(`Disciplína „${name}“ byla přidána`)
  }
  return (
    <GoalShell
      dogId={dogId}
      title="Cíle psa"
      subtitle={dogQuery.data?.name}
    >
      <QueryState
        isLoading={dogQuery.isLoading}
        error={dogQuery.error}
        onRetry={() => void dogQuery.refetch()}
        empty={null}
      >
        <EditorSheet
          isOpen={Boolean(dogQuery.data)}
          onOpenChange={(isOpen) => {
            if (!isOpen && !create.isPending) {
              void navigate({ to: "/dogs/$dogId/goals", params: { dogId } })
            }
          }}
          title="Nový cíl"
          description={dogQuery.data?.name ?? ""}
        >
          <GoalForm
            disciplines={dogQuery.data?.disciplines ?? []}
            isPending={create.isPending}
            submitLabel="Vytvořit cíl"
            onAddDiscipline={isOwner ? addDiscipline : undefined}
            onSubmit={(values) =>
              create.mutate(values, {
                onSuccess: (goal) =>
                  void navigate({
                    to: "/dogs/$dogId/goals/$goalId",
                    params: { dogId, goalId: goal.id },
                    replace: true,
                  }),
              })
            }
          />
        </EditorSheet>
      </QueryState>
    </GoalShell>
  )
}

export function EditGoalPage({
  dogId,
  goalId,
  returnToActivityId,
  currentUserId,
  isNewTrainingRequested,
  onNewTrainingRequestHandled,
  selectedSessionId,
  onSessionChange,
  isScheduleRequested,
  onScheduleRequestHandled,
}: {
  dogId: string
  goalId: string
  returnToActivityId?: string
  currentUserId?: string | null
  isNewTrainingRequested?: boolean
  onNewTrainingRequestHandled?: () => void
  selectedSessionId?: string
  onSessionChange?: (id: string | undefined) => void
  isScheduleRequested?: boolean
  onScheduleRequestHandled?: () => void
}) {
  const dogQuery = useQuery(dogDetailQueryOptions(dogId))
  const goalQuery = useQuery(goalQueryOptions(goalId))
  const planQuery = useQuery(dogPlanQueryOptions(dogId))
  const client = useQueryClient()
  const navigate = useNavigate()
  const isOwner = Boolean(currentUserId && dogQuery.data?.ownerId === currentUserId)
  const addDiscipline = async (name: string) => {
    await setDogDiscipline(dogId, { name, isArchived: false })
    await Promise.all([
      client.invalidateQueries({ queryKey: dogKeys.detail(dogId) }),
      client.invalidateQueries({ queryKey: dogKeys.all }),
    ])
    toast.success(`Disciplína „${name}“ byla přidána`)
  }
  const [isEditing, setEditing] = useState(false)
  const [isNewTrainingOpen, setNewTraining] = useState(false)
  const [hasSavedChanges, setHasSavedChanges] = useState(false)
  const [title, setTitle] = useState("")
  const [titleError, setTitleError] = useState("")
  const [localSessionId, setLocalSessionId] = useState<string | null>(null)
  // URL-driven mode must not fall back to local state — otherwise "Zpět na cíl"
  // clears `?session=` while the editor stays open on a stale local id.
  const sessionId = onSessionChange ? selectedSessionId : (selectedSessionId ?? localSessionId)
  const setSessionId = (id: string | null) => {
    if (onSessionChange) onSessionChange(id ?? undefined)
    else setLocalSessionId(id)
  }
  const updateGoal = useUpdateGoal(dogId, goalId)
  const goal = goalQuery.data?.dogId === dogId ? goalQuery.data : undefined
  const membership = planQuery.data?.find((d) => d.goals.some((g) => g.id === goalId))
  const sessions = membership?.goals.find((g) => g.id === goalId)?.sessions ?? []
  const selected = sessions.find((s) => s.id === sessionId)
  const isReadOnly =
    goal?.status === "ARCHIVED" || goal?.status === "COMPLETED" || membership?.isArchived === true
  const refresh = () => client.invalidateQueries({ queryKey: dogKeys.all })
  const returnToRecord = () => {
    if (!returnToActivityId) return
    leavePlanForRecord(navigate, dogId, returnToActivityId)
  }
  const markPlanSaved = (shouldShowToast = false) => {
    setHasSavedChanges(true)
    if (!returnToActivityId) return
    void client.invalidateQueries({ queryKey: ["training-conversation", returnToActivityId] })
    if (shouldShowToast) {
      toast.success("Změny v plánu jsou uložené", {
        action: { label: "Zpět na záznam", onClick: returnToRecord },
      })
    }
  }
  const create = useMutation({
    mutationFn: () => createSession(goalId, title.trim()),
    onSuccess: async (session) => {
      await refresh()
      markPlanSaved(true)
      setNewTraining(false)
      onNewTrainingRequestHandled?.()
      setTitle("")
      setSessionId(session.id)
    },
    onError: () => toast.error("Trénink se nepodařilo vytvořit. Zkus to znovu."),
  })
  const reorder = useMutation({
    mutationFn: (ids: string[]) => api.put(`goals/${goalId}/sessions/order`, { json: { ids } }),
    onSuccess: async () => {
      await refresh()
      markPlanSaved(true)
    },
    onError: () => toast.error("Pořadí se nepodařilo uložit."),
  })
  const archiveSession = useMutation({
    mutationFn: (sessionId: string) =>
      api.patch(`goal-trainings/${sessionId}`, { json: { isArchived: true } }),
    onSuccess: async () => {
      await refresh()
      markPlanSaved(false)
      toast.success("Trénink byl odstraněn z cíle")
    },
    onError: () => toast.error("Trénink se nepodařilo odstranit."),
  })
  const status = useMutation({
    mutationFn: (value: string) => api.patch(`goals/${goalId}`, { json: { status: value } }),
    onSuccess: async () => {
      await refresh()
      await client.invalidateQueries({ queryKey: weekKeys.all })
      markPlanSaved(true)
    },
    onError: () => toast.error("Stav cíle se nepodařilo změnit."),
  })
  const isGoalClosed = goal?.status === "ARCHIVED" || goal?.status === "COMPLETED"
  const schedulableSession = sessions.find((session) => !session.isArchived)
  const save = async (values: GoalFormValues, shouldSchedule = false) => {
    try {
      await updateGoal.mutateAsync(values)
      await refresh()
      markPlanSaved(false)
      setEditing(false)
      if (shouldSchedule && schedulableSession) {
        await navigate({
          to: "/dogs/$dogId/goals/$goalId",
          params: { dogId, goalId },
          search: {
            session: schedulableSession.id,
            naplanovat: true,
            ...(returnToActivityId ? { zaznam: returnToActivityId } : {}),
          },
          replace: true,
        })
      }
    } catch {
      /* Hook reports failure; keep values. */
    }
  }
  const failure =
    dogQuery.error ??
    goalQuery.error ??
    planQuery.error ??
    (selectedSessionId && planQuery.isSuccess && !selected
      ? new Error("Tento trénink neexistuje nebo nepatří k tomuto cíli.")
      : !goalQuery.isLoading && !goal
        ? new Error("Tento cíl neexistuje nebo k němu nemáš přístup.")
        : null)
  if (selected && goal && dogQuery.data) {
    return (
      <SessionEditor
        key={selected.id}
        session={selected}
        sessions={sessions}
        dog={dogQuery.data}
        goal={goal}
        isReadOnly={isReadOnly || selected.isArchived}
        canSchedule={!isReadOnly && !selected.isArchived}
        onBack={() => setSessionId(null)}
        isScheduleRequested={isScheduleRequested}
        onScheduleRequestHandled={onScheduleRequestHandled}
        hasSavedPlanChanges={hasSavedChanges}
        onPlanSaved={() => markPlanSaved(true)}
        onReturnToRecord={returnToActivityId ? returnToRecord : undefined}
      />
    )
  }
  return (
    <GoalShell
      dogId={dogId}
      title={goal?.title ?? "Cíl"}
      subtitle={goal ? `${dogQuery.data?.name ?? ""} · ${goal.discipline ?? "Obecné"}` : undefined}
    >
      <QueryState
        className="space-y-6"
        isLoading={dogQuery.isLoading || goalQuery.isLoading || planQuery.isLoading}
        error={failure}
        onRetry={() => {
          void dogQuery.refetch()
          void goalQuery.refetch()
          void planQuery.refetch()
        }}
        empty={null}
      >
        {goal && (
          <>
            {returnToActivityId && (
              <ReturnToRecordBanner
                hasSavedChanges={hasSavedChanges}
                onReturn={returnToRecord}
              />
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusChip tone={isReadOnly ? "muted" : "accent"}>
                {goal.status === "COMPLETED"
                  ? "Splněný cíl"
                  : goal.status === "ARCHIVED"
                    ? "Archiv"
                    : "Aktivní cíl"}
              </StatusChip>
              {!isReadOnly && (
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  <EditorIcon name="Edit" />
                  Upravit cíl
                </Button>
              )}
            </div>
            <section className="space-y-1.5 rounded-card bg-accent p-4">
              <h2 className="text-label font-bold text-muted-foreground">Princip cíle</h2>
              <p className="leading-relaxed whitespace-pre-wrap">
                {goal.principle?.trim() ? goal.principle : "Princip zatím není doplněný."}
              </p>
            </section>
            {goal.criterion && (
              <div className="flex items-start gap-2.5 rounded-field bg-secondary p-4">
                <span className="mt-0.5 shrink-0">
                  <EditorIcon name="Target" />
                </span>
                <p className="text-sm whitespace-pre-wrap">Hotovo, když: {goal.criterion}</p>
              </div>
            )}
            {goal.deadline && (
              <p className="text-sm text-muted-foreground">
                Termín: {new Date(`${goal.deadline}T12:00:00`).toLocaleDateString("cs-CZ")}
              </p>
            )}
            <section className="space-y-3">
              <h2 className="text-section font-extrabold">Tréninky · {sessions.length}</h2>
              {!sessions.length ? (
                <EmptyState
                  icon={Target}
                  title="Přidej první trénink"
                  description="Každý trénink má vlastní kroky a dá se naplánovat na konkrétní dny."
                />
              ) : (
                <ol className="space-y-3">
                  {sessions.map((s, index) => {
                    const planned = (s.scheduledTrainings ?? []).filter(
                      (item) => item.status === "PLANNED",
                    )
                    const completedCount =
                      (s.scheduledTrainings ?? []).filter((item) => item.status === "COMPLETED")
                        .length + (s.workoutLogs?.length ?? 0)
                    const plannedDates = planned.slice(0, 2).map((item) =>
                      item.date.toLocaleDateString("cs-CZ", {
                        weekday: "short",
                        day: "numeric",
                        month: "numeric",
                      }),
                    )
                    const extraPlanned = planned.length - plannedDates.length
                    return (
                      <li
                        key={s.id}
                        className="rounded-card border border-border bg-card p-3"
                      >
                        <button
                          type="button"
                          className="flex min-h-touch w-full items-center gap-3 text-left"
                          onClick={() => setSessionId(s.id)}
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary font-extrabold">
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1 space-y-0.5">
                            <span className="block font-bold break-words">{s.title}</span>
                            <span className="block text-label text-muted-foreground">
                              {s.steps.length} kroků ·{" "}
                              {s.steps.reduce((n, step) => n + (step.durationMinutes ?? 0), 0)} min
                              {completedCount > 0 ? ` · Odcvičeno ${completedCount}×` : ""}
                              {s.isArchived ? " · Archiv" : ""}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {plannedDates.length > 0
                                ? `Naplánováno: ${plannedDates.join(", ")}${extraPlanned > 0 ? ` + ${extraPlanned} další` : ""}`
                                : "Nenaplánováno"}
                            </span>
                          </span>
                          <ChevronRight className="size-5 shrink-0" />
                        </button>
                        {!isReadOnly && !s.isArchived && (
                          <div className="mt-2 flex flex-wrap items-center justify-end gap-1">
                            {sessions.filter((item) => !item.isArchived).length > 1 &&
                              ([-1, 1] as const).map((direction) => (
                                <Button
                                  key={direction}
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Posunout trénink ${s.title} ${direction === -1 ? "nahoru" : "dolů"}`}
                                  disabled={
                                    reorder.isPending ||
                                    index + direction < 0 ||
                                    index + direction >= sessions.length
                                  }
                                  onClick={() => {
                                    const ids = sessions.map((t) => t.id)
                                    const target = ids[index + direction]
                                    const source = ids[index]
                                    if (!target || !source) return
                                    ids[index] = target
                                    ids[index + direction] = source
                                    reorder.mutate(ids)
                                  }}
                                >
                                  {direction === -1 ? <ChevronUp /> : <ChevronDown />}
                                </Button>
                              ))}
                            <ConfirmDestructiveDialog
                              title={`Odstranit trénink „${s.title}“?`}
                              description="Trénink se přesune do archivu u tohoto cíle. Naplánované dny a historie zůstanou, ale už ho nepůjde upravovat."
                              confirmLabel="Odstranit trénink"
                              onConfirm={() => archiveSession.mutate(s.id)}
                              trigger={
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={archiveSession.isPending}
                                  className="font-semibold"
                                  aria-label={`Odstranit trénink ${s.title}`}
                                >
                                  Odstranit
                                </Button>
                              }
                            />
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ol>
              )}
              {!isReadOnly && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => setNewTraining(true)}
                >
                  <EditorIcon name="Plus" />
                  Přidat trénink
                </Button>
              )}
            </section>
            {!isReadOnly && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={status.isPending}
                  onClick={() => status.mutate("COMPLETED")}
                >
                  Označit cíl jako splněný
                </Button>
                <Button
                  variant="ghost"
                  disabled={status.isPending}
                  onClick={() => status.mutate("ARCHIVED")}
                >
                  Archivovat cíl
                </Button>
              </div>
            )}
            {isReadOnly && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Tento cíl je uzavřený. Tréninky a záznamy zůstávají dostupné ke čtení.
                </p>
                {isGoalClosed && (
                  <Button
                    variant="outline"
                    disabled={status.isPending}
                    onClick={() => status.mutate("ACTIVE")}
                  >
                    Vrátit mezi aktivní
                  </Button>
                )}
              </div>
            )}
            <EditorSheet
              isOpen={isEditing}
              onOpenChange={(isOpen) => {
                if (!updateGoal.isPending) setEditing(isOpen)
              }}
              title="Upravit cíl"
              description={`${dogQuery.data?.name} · ${goal.discipline ?? "Obecné"}`}
            >
              <GoalForm
                key={goal.updatedAt.toISOString()}
                disciplines={dogQuery.data?.disciplines ?? []}
                onAddDiscipline={isOwner ? addDiscipline : undefined}
                defaultValues={{
                  title: goal.title,
                  discipline: goal.discipline ?? "",
                  principle: goal.principle ?? "",
                  criterion: goal.criterion ?? "",
                  deadline: goal.deadline ?? "",
                }}
                isPending={updateGoal.isPending}
                onSubmit={(values) => save(values)}
                onSubmitAndSchedule={
                  schedulableSession ? (values) => save(values, true) : undefined
                }
                submitLabel="Uložit změny"
              />
            </EditorSheet>
            <EditorSheet
              isOpen={isNewTrainingOpen || isNewTrainingRequested === true}
              onOpenChange={(isOpen) => {
                if (!create.isPending) {
                  setNewTraining(isOpen)
                  if (!isOpen) onNewTrainingRequestHandled?.()
                }
              }}
              title="Nový trénink"
              description={goal.title}
            >
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!title.trim() || title.trim().length > 100) {
                    setTitleError("Zadej název o 1 až 100 znacích.")
                    return
                  }
                  setTitleError("")
                  create.mutate()
                }}
              >
                <Label htmlFor="session-title">Název tréninku</Label>
                <Input
                  id="session-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="min-h-field rounded-field"
                  aria-describedby={titleError ? "session-title-error" : undefined}
                />
                {titleError && (
                  <p
                    id="session-title-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {titleError}
                  </p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={create.isPending}
                >
                  {create.isPending ? "Vytvářím…" : "Vytvořit trénink"}
                </Button>
              </form>
            </EditorSheet>
          </>
        )}
      </QueryState>
    </GoalShell>
  )
}
