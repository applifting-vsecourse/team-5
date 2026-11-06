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

import { EditorSheet } from "./EditorSheet"
import { SessionScheduleSheet } from "./SessionScheduleSheet"
import { StepLibraryScreen } from "./StepLibraryScreen"
import { TrainingPreview } from "./TrainingPreview"

function StepRow({
  step,
  index,
  isReadOnly,
  isBusy,
  onEdit,
}: {
  step: PlanBlock
  index: number
  isReadOnly: boolean
  isBusy: boolean
  onEdit: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
    disabled: isReadOnly || isBusy,
  })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-2 rounded-card border border-border bg-card px-3 py-3",
        isDragging && "z-10 opacity-60",
      )}
    >
      {!isReadOnly && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Přetáhnout krok ${step.title}`}
          className="flex min-h-touch min-w-touch touch-none items-center justify-center rounded-field"
          disabled={isBusy}
        >
          <EditorIcon name="Grip" />
        </button>
      )}
      <span
        className={cn(
          "mt-1 flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-extrabold text-dog-foreground",
          dogColorClass((index % 6) + 1),
        )}
      >
        {index + 1}
      </span>
      <button
        type="button"
        onClick={onEdit}
        className="min-h-touch min-w-0 flex-1 space-y-2 rounded-field text-left"
        aria-label={`${isReadOnly ? "Zobrazit" : "Upravit"} krok ${step.title}`}
      >
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-bold break-words">{step.title}</span>
          <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
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
}) {
  const client = useQueryClient()
  const [step, setStep] = useState<PlanBlock | "new" | null>(null)
  const [deleting, setDeleting] = useState<PlanBlock | null>(null)
  const [isLibraryOpen, setLibrary] = useState(false)
  const [isPreviewOpen, setPreview] = useState(false)
  const [isScheduleOpen, setSchedule] = useState(Boolean(isScheduleRequested))
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
      else await api.post(`goal-trainings/${session.id}/steps`, { json: values })
    },
    onSuccess: async () => {
      await refresh()
      setStep(null)
    },
    onError: () => toast.error("Krok se nepodařilo uložit. Změny zůstaly ve formuláři."),
  })
  const reorder = useMutation({
    mutationFn: (ids: string[]) =>
      api.put(`goal-trainings/${session.id}/steps/order`, { json: { ids } }),
    onSuccess: refresh,
    onError: () => toast.error("Pořadí se nepodařilo uložit."),
  })
  const remove = useMutation({
    mutationFn: (id: string) => deletePlanBlock(id),
    onSuccess: async () => {
      await refresh()
      setDeleting(null)
    },
    onError: () => toast.error("Krok se nepodařilo odebrat."),
  })
  const rename = useMutation({
    mutationFn: () => api.patch(`goal-trainings/${session.id}`, { json: { title: title.trim() } }),
    onSuccess: async () => {
      await refresh()
      setRenaming(false)
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
    onSuccess: refresh,
    onError: () => toast.error("Pauzu se nepodařilo přidat."),
  })
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const blocks = session.steps
  const isBusy =
    save.isPending || remove.isPending || reorder.isPending || pause.isPending || isLibraryBusy
  const move = (from: number, to: number) => {
    if (isReadOnly || isBusy || to < 0 || to >= blocks.length) return
    reorder.mutate(arrayMove(blocks, from, to).map((s) => s.id))
  }
  const drag = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      move(
        blocks.findIndex((s) => s.id === active.id),
        blocks.findIndex((s) => s.id === over.id),
      )
    }
  }
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
          setStep("new")
        }}
      />
    )
  }
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-gutter py-6">
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
      <section className="space-y-2 rounded-card bg-accent p-4">
        <h2 className="text-label font-bold text-muted-foreground">Princip tréninku</h2>
        <p className="leading-relaxed whitespace-pre-wrap">
          {goal.principle?.trim() ? goal.principle : "Princip zatím není doplněný."}
        </p>
      </section>
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
              items={blocks.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="space-y-3">
                {blocks.map((b, i) => (
                  <StepRow
                    key={b.id}
                    step={b}
                    index={i}
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
                onClick={() => setStep("new")}
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
                onClick={() => setStep("new")}
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
          if (!isOpen && !save.isPending) setStep(null)
        }}
        title={step === "new" ? "Nový krok" : isReadOnly ? "Krok tréninku" : "Upravit krok"}
        description={session.title}
      >
        {step !== null && (
          <StepForm
            key={step === "new" ? "new" : step.id}
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
              disabled={isBusy || blocks.findIndex((b) => b.id === step.id) === 0}
              onClick={() => {
                const index = blocks.findIndex((b) => b.id === step.id)
                move(index, index - 1)
              }}
            >
              <ChevronUp />
              Posunout nahoru
            </Button>
            <Button
              variant="outline"
              disabled={isBusy || blocks.findIndex((b) => b.id === step.id) === blocks.length - 1}
              onClick={() => {
                const index = blocks.findIndex((b) => b.id === step.id)
                move(index, index + 1)
              }}
            >
              <ChevronDown />
              Posunout dolů
            </Button>
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
        description={`Krok „${deleting?.title ?? ""}“ zmizí z tohoto tréninku. Tuto akci nelze vrátit.`}
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
          steps={blocks}
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
        isOpen={isScheduleOpen}
        onOpenChange={(isOpen) => {
          setSchedule(isOpen)
          if (!isOpen) onScheduleRequestHandled?.()
        }}
      />
    </main>
  )
}
