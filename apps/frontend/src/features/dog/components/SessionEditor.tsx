import { useRef, useState, type CSSProperties } from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, Target } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { ConfirmDestructiveDialog } from "@/components/ConfirmDestructiveDialog"
import { EditorIcon } from "@/components/EditorIcon"
import { EmptyState } from "@/components/EmptyState"
import { StatusChip } from "@/components/StatusChip"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api-client"
import { dogColorClass } from "@/lib/dogColors"
import { dogKeys } from "@/lib/dogKeys"
import { cn } from "@/lib/utils"
import { weekKeys } from "@/lib/weekKeys"

import {
  exerciseFormSchema,
  type Dog,
  type DogGoal,
  type ExerciseFormValues,
  type PlanBlock,
} from "@/features/dog/api/dogSchemas"
import { deletePlanBlock, updatePlanBlock } from "@/features/dog/api/savePlanBlock"
import { stepTemplates, type TrainingSession } from "@/features/dog/api/trainingEditor"
import { walkOrder } from "@/features/dog/lib/stepOrder"

import { EditorSheet } from "./EditorSheet"
import { ReturnToRecordBanner } from "./ReturnToRecordBanner"
import { SessionScheduleSheet } from "./SessionScheduleSheet"
import { StepLibraryScreen } from "./StepLibraryScreen"
import { TrainingPreview } from "./TrainingPreview"

type StepRowProps = {
  step: PlanBlock
  index: number
  isReadOnly: boolean
  isBusy: boolean
  onEdit: () => void
}

// Sub-steps stay outside SortableContext; only roots register with dnd-kit (#67).
function StepRow(props: StepRowProps) {
  if (props.step.parentId) return <StaticStepRow {...props} />
  return <SortableStepRow {...props} />
}

function SortableStepRow(props: StepRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.step.id,
    disabled: props.isReadOnly || props.isBusy,
  })
  return (
    <StepRowView
      {...props}
      setNodeRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      isDragging={isDragging}
      dragHandle={{ attributes, listeners }}
    />
  )
}

function StaticStepRow(props: StepRowProps) {
  return <StepRowView {...props} />
}

function StepRowView({
  step,
  index,
  isReadOnly,
  isBusy,
  onEdit,
  setNodeRef,
  style,
  isDragging,
  dragHandle,
}: StepRowProps & {
  setNodeRef?: (node: HTMLElement | null) => void
  style?: CSSProperties
  isDragging?: boolean
  dragHandle?: {
    attributes: ReturnType<typeof useSortable>["attributes"]
    listeners: ReturnType<typeof useSortable>["listeners"]
  }
}) {
  const isSubStep = Boolean(step.parentId)
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-3 rounded-card border border-border bg-card px-3 py-3",
        isSubStep && "ml-6 border-dashed",
        isDragging && "z-10 opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        {!isReadOnly && dragHandle && (
          <button
            type="button"
            {...dragHandle.attributes}
            {...dragHandle.listeners}
            aria-label={`Přetáhnout krok ${step.title}`}
            className="flex min-h-touch min-w-touch touch-none items-center justify-center rounded-field"
            disabled={isBusy}
          >
            <EditorIcon name="Grip" />
          </button>
        )}
        {isSubStep ? (
          <span
            className="mt-1 flex size-7 shrink-0 items-center justify-center text-muted-foreground"
            aria-hidden
          >
            →
          </span>
        ) : (
          <span
            className={cn(
              "mt-1 flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-extrabold text-dog-foreground",
              dogColorClass((index % 6) + 1),
            )}
          >
            {index + 1}
          </span>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="min-h-touch min-w-0 flex-1 space-y-2 rounded-field text-left"
          aria-label={`${isReadOnly ? "Zobrazit" : "Upravit"} krok ${step.title}`}
        >
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold break-words">{step.title}</span>
            <span className="ml-auto flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
              <EditorIcon name="Clock" />
              {step.durationMinutes ?? 0} min
            </span>
          </span>
          {step.criterion && (
            <span className="flex items-start gap-1 text-label text-muted-foreground">
              <EditorIcon name="Target" />
              Kritérium: {step.criterion}
            </span>
          )}
        </button>
      </div>
    </li>
  )
}

function StepForm({
  initial,
  isPending,
  onSave,
  isReadOnly,
}: {
  initial?: PlanBlock
  isPending: boolean
  onSave: (values: ExerciseFormValues) => void
  isReadOnly: boolean
}) {
  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      title: initial?.title ?? "",
      instruction: initial?.instruction ?? "",
      criterion: initial?.criterion ?? "",
      durationMinutes: initial?.durationMinutes ?? 5,
    },
  })
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSave)}
        className="space-y-4"
        noValidate
      >
        <fieldset
          disabled={isReadOnly || isPending}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Název kroku</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="min-h-field rounded-field"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="instruction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instrukce</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-24 rounded-field"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="criterion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hotovo, když…</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-20 rounded-field"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="durationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Délka (minuty)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))
                    }
                    type="number"
                    min={0}
                    max={480}
                    className="min-h-field rounded-field"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>
        {!isReadOnly && (
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? "Ukládám…" : initial ? "Uložit změny" : "Přidat krok"}
          </Button>
        )}
      </form>
    </Form>
  )
}

export function SessionEditor({
  session,
  sessions,
  dog,
  goal,
  isReadOnly,
  canSchedule = !isReadOnly,
  onBack,
  isScheduleRequested,
  onScheduleRequestHandled,
  hasSavedPlanChanges = false,
  onPlanSaved,
  onReturnToRecord,
}: {
  session: TrainingSession
  sessions: TrainingSession[]
  dog: Dog
  goal: DogGoal
  isReadOnly: boolean
  canSchedule?: boolean
  onBack: () => void
  isScheduleRequested?: boolean
  onScheduleRequestHandled?: () => void
  hasSavedPlanChanges?: boolean
  onPlanSaved?: () => void
  onReturnToRecord?: () => void
}) {
  const client = useQueryClient()
  const [step, setStep] = useState<PlanBlock | "new" | null>(null)
  const [parentForNew, setParentForNew] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<PlanBlock | null>(null)
  const [isLibraryOpen, setLibrary] = useState(false)
  const [isPreviewOpen, setPreview] = useState(false)
  const [isScheduleOpen, setSchedule] = useState(false)
  const [isRenaming, setRenaming] = useState(false)
  const [title, setTitle] = useState(session.title)
  const [selected, setSelected] = useState<string[]>([])
  const [isLibraryBusy, setLibraryBusy] = useState(false)
  const libraryLock = useRef(false)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: dogKeys.all }),
      client.invalidateQueries({ queryKey: weekKeys.all }),
    ])
  }
  const save = useMutation({
    mutationFn: async (values: ExerciseFormValues) => {
      if (step && step !== "new") await updatePlanBlock(step.id, values)
      else {
        await api.post(`goal-trainings/${session.id}/steps`, {
          json: { ...values, ...(parentForNew ? { parentId: parentForNew } : {}) },
        })
      }
    },
    onSuccess: async () => {
      await refresh()
      setStep(null)
<<<<<<< HEAD
      onPlanSaved?.()
=======
      setParentForNew(null)
>>>>>>> e7e70c5 (feat(plan): nested sub-steps with parts-then-whole walk (Refs #67))
    },
    onError: () => toast.error("Krok se nepodařilo uložit. Změny zůstaly ve formuláři."),
  })
  const reorder = useMutation({
    mutationFn: (ids: string[]) =>
      api.put(`goal-trainings/${session.id}/steps/order`, { json: { ids } }),
    onSuccess: async () => {
      await refresh()
      onPlanSaved?.()
    },
    onError: () => toast.error("Pořadí se nepodařilo uložit."),
  })
  const remove = useMutation({
    mutationFn: (id: string) => deletePlanBlock(id),
    onSuccess: async () => {
      await refresh()
      setDeleting(null)
      onPlanSaved?.()
    },
    onError: () => toast.error("Krok se nepodařilo odebrat."),
  })
  const rename = useMutation({
    mutationFn: () => api.patch(`goal-trainings/${session.id}`, { json: { title: title.trim() } }),
    onSuccess: async () => {
      await refresh()
      setRenaming(false)
      onPlanSaved?.()
    },
    onError: () => toast.error("Název se nepodařilo uložit."),
  })
  const pause = useMutation({
    mutationFn: () =>
      api.post(`goal-trainings/${session.id}/steps`, {
        json: {
          title: "Pauza",
          instruction: "Nech psa odpočinout a nabídni mu vodu.",
          criterion: "Pes je připravený pokračovat.",
          durationMinutes: 2,
        },
      }),
    onSuccess: async () => {
      await refresh()
      onPlanSaved?.()
    },
    onError: () => toast.error("Pauzu se nepodařilo přidat."),
  })
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const blocks = session.steps
  const roots = blocks.filter((block) => !block.parentId)
  const isBusy =
    save.isPending || remove.isPending || reorder.isPending || pause.isPending || isLibraryBusy
  const siblingsOf = (block: PlanBlock) =>
    blocks.filter((item) => (item.parentId ?? null) === (block.parentId ?? null))
  const moveSibling = (block: PlanBlock, delta: number) => {
    if (isReadOnly || isBusy) return
    const siblings = siblingsOf(block)
    const from = siblings.findIndex((item) => item.id === block.id)
    const to = from + delta
    if (from < 0 || to < 0 || to >= siblings.length) return
    reorder.mutate(arrayMove(siblings, from, to).map((item) => item.id))
  }
  const drag = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = roots.findIndex((s) => s.id === active.id)
    const to = roots.findIndex((s) => s.id === over.id)
    if (from < 0 || to < 0) return
    reorder.mutate(arrayMove(roots, from, to).map((s) => s.id))
  }
  const openNew = (parentId: string | null = null) => {
    setParentForNew(parentId)
    setStep("new")
  }
  const rootIndex = (block: PlanBlock) =>
    roots.findIndex((root) => root.id === (block.parentId ?? block.id))
  const insertTemplates = async () => {
    if (libraryLock.current || !selected.length) return
    libraryLock.current = true
    setLibraryBusy(true)
    setLibraryError(null)
    const inserted = new Set<string>()
    try {
      for (const id of selected) {
        const template = stepTemplates.find((t) => t.id === id)!
        await api.post(`goal-trainings/${session.id}/steps`, {
          json: {
            title: template.title,
            instruction: template.instruction,
            criterion: template.criterion,
            durationMinutes: template.durationMinutes,
          },
        })
        inserted.add(id)
      }
      setLibrary(false)
    } catch {
      setLibraryError(
        "Některé kroky se nepodařilo vložit. Úspěšně vložené jsou v tréninku; zkus zbývající znovu.",
      )
    } finally {
      setSelected((current) => current.filter((id) => !inserted.has(id)))
      await refresh()
      if (inserted.size > 0) onPlanSaved?.()
      setLibraryBusy(false)
      libraryLock.current = false
    }
  }
  if (isLibraryOpen) {
    return (
      <StepLibraryScreen
        selected={selected}
        onSelectedChange={setSelected}
        isPending={isLibraryBusy}
        error={libraryError}
        onInsert={() => void insertTemplates()}
        onBack={() => setLibrary(false)}
        onCreate={() => {
          setLibrary(false)
          openNew()
        }}
      />
    )
  }
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-gutter py-6">
      <header className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 rounded-field"
          aria-label="Zpět na cíl"
          onClick={onBack}
        >
          <EditorIcon name="ChevL" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold tracking-tight break-words">{session.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Trénink {sessions.findIndex((s) => s.id === session.id) + 1} z {sessions.length} ·{" "}
            {dog.name} · {goal.discipline}
          </p>
        </div>
      </header>
<<<<<<< HEAD
      {onReturnToRecord && (
        <ReturnToRecordBanner
          hasSavedChanges={hasSavedPlanChanges}
          onReturn={onReturnToRecord}
        />
      )}
=======
      <section className="space-y-2 rounded-card bg-accent p-4">
        <h2 className="text-label font-bold text-muted-foreground">Princip tréninku</h2>
        <p className="leading-relaxed whitespace-pre-wrap">
          {goal.principle?.trim() ? goal.principle : "Princip zatím není doplněný."}
        </p>
      </section>
>>>>>>> e7e70c5 (feat(plan): nested sub-steps with parts-then-whole walk (Refs #67))
      {isReadOnly && <StatusChip tone="muted">Pouze ke čtení</StatusChip>}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-section font-extrabold">
            Kroky · {blocks.length} · {blocks.reduce((n, b) => n + (b.durationMinutes ?? 0), 0)} min
          </h2>
          {!isReadOnly && <p className="text-xs text-muted-foreground">Podrž a přetáhni</p>}
        </div>
        {blocks.length ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={drag}
          >
            <SortableContext
              items={roots.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="space-y-3">
                {blocks.map((b) => (
                  <StepRow
                    key={b.id}
                    step={b}
                    index={Math.max(0, rootIndex(b))}
                    isReadOnly={isReadOnly}
                    isBusy={isBusy}
                    onEdit={() => setStep(b)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        ) : (
          <EmptyState
            icon={Target}
            title="Trénink zatím nemá kroky"
            description="Přidej vlastní krok nebo použij vzor z knihovny."
          />
        )}
        {!isReadOnly && (
          <div className="space-y-3 rounded-card border border-dashed border-border p-4">
            <h3 className="flex items-center gap-3 font-bold">
              <Button
                type="button"
                size="icon"
                className="rounded-field"
                aria-label="Přidat vlastní krok"
                disabled={isBusy}
                onClick={() => openNew()}
              >
                <EditorIcon name="Plus" />
              </Button>
              Přidat krok
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-1.5 rounded-full bg-card px-2.5 text-xs"
                disabled={isBusy}
                onClick={() => setLibrary(true)}
              >
                <EditorIcon name="Book" />Z knihovny
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 rounded-full bg-card px-2.5 text-xs"
                disabled={isBusy}
                onClick={() => openNew()}
              >
                <EditorIcon name="Edit" />
                Nový krok
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 rounded-full bg-card px-2.5 text-xs"
                disabled={isBusy}
                onClick={() => pause.mutate()}
              >
                <EditorIcon name="Pause" />
                Pauza
              </Button>
            </div>
          </div>
        )}
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            setPreview(true)
          }}
        >
          <EditorIcon name="Eye1" />
          Náhled
        </Button>
        <Button
          size="lg"
          disabled={!canSchedule || !blocks.length || isBusy}
          onClick={() => setSchedule(true)}
        >
          <EditorIcon name="Cal" />
          Naplánovat
        </Button>
      </div>
      {!isReadOnly && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setRenaming(true)}
        >
          Upravit název tréninku
        </Button>
      )}
      <EditorSheet
        isOpen={step !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen && !save.isPending) {
            setStep(null)
            setParentForNew(null)
          }
        }}
        title={
          step === "new"
            ? parentForNew
              ? "Dílčí krok"
              : "Nový krok"
            : isReadOnly
              ? "Krok tréninku"
              : "Upravit krok"
        }
        description={
          step === "new" && parentForNew
            ? `Pod „${blocks.find((b) => b.id === parentForNew)?.title ?? "krokem"}“`
            : session.title
        }
      >
        {step !== null && (
          <StepForm
            key={step === "new" ? `new-${parentForNew ?? "root"}` : step.id}
            initial={step === "new" ? undefined : step}
            isPending={save.isPending}
            onSave={(values) => save.mutate(values)}
            isReadOnly={isReadOnly}
          />
        )}
        {step && step !== "new" && !isReadOnly && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              disabled={
                isBusy ||
                (() => {
                  const siblings = siblingsOf(step)
                  return siblings.findIndex((b) => b.id === step.id) <= 0
                })()
              }
              onClick={() => moveSibling(step, -1)}
            >
              <ChevronUp />
              Posunout nahoru
            </Button>
            <Button
              variant="outline"
              disabled={
                isBusy ||
                (() => {
                  const siblings = siblingsOf(step)
                  return siblings.findIndex((b) => b.id === step.id) >= siblings.length - 1
                })()
              }
              onClick={() => moveSibling(step, 1)}
            >
              <ChevronDown />
              Posunout dolů
            </Button>
            {!step.parentId && (
              <Button
                variant="outline"
                disabled={isBusy}
                onClick={() => {
                  const parentId = step.id
                  setStep(null)
                  openNew(parentId)
                }}
              >
                Rozdělit na dílčí kroky
              </Button>
            )}
            <Button
              variant="ghost"
              className="text-destructive"
              disabled={isBusy}
              onClick={() => {
                setDeleting(step)
                setStep(null)
              }}
            >
              Odebrat krok…
            </Button>
          </div>
        )}
      </EditorSheet>
      <ConfirmDestructiveDialog
        title="Odebrat krok?"
        description={
          deleting && blocks.some((block) => block.parentId === deleting.id)
            ? `Krok „${deleting.title}“ i jeho dílčí kroky zmizí z tohoto tréninku. Tuto akci nelze vrátit.`
            : `Krok „${deleting?.title ?? ""}“ zmizí z tohoto tréninku. Tuto akci nelze vrátit.`
        }
        confirmLabel="Odebrat krok"
        trigger={<span />}
        isOpen={deleting !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeleting(null)
        }}
        onConfirm={() => {
          if (deleting && !remove.isPending) remove.mutate(deleting.id)
        }}
      />
      {isPreviewOpen && (
        <TrainingPreview
          dog={dog}
          title={session.title}
          steps={walkOrder(
            blocks.map((block) => ({
              ...block,
              parentId: block.parentId ?? null,
            })),
          )}
          isOpen
          onOpenChange={setPreview}
        />
      )}
      <EditorSheet
        isOpen={isRenaming}
        onOpenChange={setRenaming}
        title="Název tréninku"
        description={goal.title}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            rename.mutate()
          }}
        >
          <Label htmlFor="rename-training">Název</Label>
          <Input
            id="rename-training"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            className="min-h-field rounded-field"
          />
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={rename.isPending}
          >
            {rename.isPending ? "Ukládám…" : "Uložit změny"}
          </Button>
        </form>
      </EditorSheet>
      <SessionScheduleSheet
        sessionId={session.id}
        goalId={goal.id}
        dogId={dog.id}
        description={`${dog.name} · ${goal.title} · trénink ${session.position + 1}`}
        isOpen={canSchedule && (isScheduleOpen || Boolean(isScheduleRequested))}
        onOpenChange={(isOpen) => {
          setSchedule(isOpen)
          if (!isOpen) onScheduleRequestHandled?.()
        }}
        onScheduled={() => onPlanSaved?.()}
      />
    </div>
  )
}
