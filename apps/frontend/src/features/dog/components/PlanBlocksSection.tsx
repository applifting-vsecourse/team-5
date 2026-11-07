import { useState, type CSSProperties, type HTMLAttributes } from "react"
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
import { useQuery } from "@tanstack/react-query"
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  ListOrdered,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"

import { StatusChip } from "@/components/StatusChip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useMoveCurrentStep } from "@/lib/useMoveCurrentStep"
import { cn } from "@/lib/utils"

import type { PlanBlock } from "@/features/dog/api/dogSchemas"
import { goalBlocksQueryOptions, goalQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import type { NewExercise } from "@/features/dog/api/savePlanBlock"
import { useCreatePlanBlock } from "@/features/dog/hooks/useCreatePlanBlock"
import { useDeletePlanBlock } from "@/features/dog/hooks/useDeletePlanBlock"
import { useReorderPlanBlocks } from "@/features/dog/hooks/useReorderPlanBlocks"
import { useUpdatePlanBlock } from "@/features/dog/hooks/useUpdatePlanBlock"

import { ExerciseDialog, type ExerciseDialogMode } from "./ExerciseDialog"

type PlanBlockItemProps = {
  block: PlanBlock
  number: number
  isFirst: boolean
  isLast: boolean
  isCurrent: boolean
  isReordering: boolean
  isStepBusy: boolean
  onEdit: () => void
  onMove: (direction: -1 | 1) => void
  onDelete: () => void
  onAdvance: () => void
  onSkip: () => void
  onBack: () => void
  dragHandleProps?: HTMLAttributes<HTMLDivElement>
  isDragging?: boolean
  style?: CSSProperties
  setNodeRef?: (node: HTMLElement | null) => void
}

function PlanBlockItem({
  block,
  number,
  isFirst,
  isLast,
  isCurrent,
  isReordering,
  isStepBusy,
  onEdit,
  onMove,
  onDelete,
  onAdvance,
  onSkip,
  onBack,
  dragHandleProps,
  isDragging,
  style,
  setNodeRef,
}: PlanBlockItemProps) {
  const handleMoveWithHaptic = (direction: -1 | 1) => {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate(15)
    }
    onMove(direction)
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      aria-current={isCurrent ? "step" : undefined}
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border border-border bg-card p-3 transition-all duration-150 active:scale-[0.995]",
        isCurrent && "border-primary ring-2 ring-primary/30",
        isDragging && "z-20 opacity-60 shadow-lg ring-2 ring-primary/40",
      )}
    >
      <div className="flex gap-3">
        {/* Agility Track Station Marker & Drag Handle */}
        <div
          {...dragHandleProps}
          // At least 44 px wide, a touch target on a phone (#89).
          className="flex min-w-11 cursor-grab touch-none flex-col items-center select-none active:cursor-grabbing"
          title="Přetáhněte pro změnu pořadí"
          aria-label={`Přetáhnout cvik ${block.title}`}
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ring-2",
              isCurrent
                ? "bg-primary text-primary-foreground ring-primary/40"
                : "bg-secondary text-secondary-foreground ring-primary/25",
            )}
          >
            {number}
          </span>

          <GripVertical
            aria-hidden="true"
            className="mt-1 size-3.5 text-muted-foreground/45 transition-colors hover:text-foreground"
          />
        </div>

        {/* Clicking the block opens it for editing (#65). */}
        <button
          type="button"
          onClick={onEdit}
          className="flex min-w-0 flex-1 flex-col justify-start gap-1 rounded-md py-1 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
        >
          <span className="flex flex-wrap items-center gap-2">
            <span className="block text-base font-medium text-foreground">
              <span className="sr-only">Cvik {number}: </span>
              {block.title}
            </span>
            {isCurrent ? <StatusChip tone="accent">Aktuální</StatusChip> : null}
            {block.outcome === "MASTERED" ? (
              <StatusChip tone="success">Zvládnuto</StatusChip>
            ) : null}
            {block.outcome === "SKIPPED" ? <StatusChip tone="muted">Přeskočeno</StatusChip> : null}
          </span>
          {block.instruction ? (
            <span className="line-clamp-2 block text-sm text-muted-foreground">
              Instrukce: {block.instruction}
            </span>
          ) : null}
          {block.criterion ? (
            <span className="mt-1 block text-left">
              <span className="inline-block rounded-md border border-border/60 bg-secondary/80 px-2 py-0.5 font-mono text-xs font-semibold text-secondary-foreground">
                Kritérium: {block.criterion}
              </span>
            </span>
          ) : null}
        </button>

        <div className="grid shrink-0 grid-cols-2 content-start gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={`Posunout cvik ${block.title} nahoru`}
            disabled={isFirst || isReordering}
            onClick={() => handleMoveWithHaptic(-1)}
          >
            <ChevronUp className="size-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={`Upravit cvik ${block.title}`}
            onClick={onEdit}
          >
            <Pencil className="size-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={`Posunout cvik ${block.title} dolů`}
            disabled={isLast || isReordering}
            onClick={() => handleMoveWithHaptic(1)}
          >
            <ChevronDown className="size-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 text-destructive hover:text-destructive"
            aria-label={`Smazat cvik ${block.title}`}
            onClick={onDelete}
          >
            <Trash2 className="size-5" />
          </Button>
        </div>
      </div>

      {isCurrent ? (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1"
              disabled={isFirst || isStepBusy}
              onClick={onBack}
            >
              Zpět o krok
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1"
              disabled={isStepBusy}
              onClick={onSkip}
            >
              Přeskočit
            </Button>
          </div>
          <Button
            type="button"
            variant="default"
            className="min-h-11 w-full"
            disabled={isStepBusy}
            onClick={onAdvance}
          >
            Zvládnuto, další krok
          </Button>
        </div>
      ) : null}
    </li>
  )
}

function SortablePlanBlockItem(
  props: Omit<PlanBlockItemProps, "dragHandleProps" | "isDragging" | "style" | "setNodeRef">,
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.block.id,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <PlanBlockItem
      {...props}
      setNodeRef={setNodeRef}
      style={style}
      dragHandleProps={{ ...attributes, ...listeners }}
      isDragging={isDragging}
    />
  )
}

export function PlanBlocksSection({ goalId }: { goalId: string }) {
  const [dialogMode, setDialogMode] = useState<ExerciseDialogMode | null>(null)
  const [blockToDelete, setBlockToDelete] = useState<PlanBlock | null>(null)

  const goalQuery = useQuery(goalQueryOptions(goalId))
  const blocksQuery = useQuery(goalBlocksQueryOptions(goalId))
  const createBlock = useCreatePlanBlock(goalId)
  const updateBlock = useUpdatePlanBlock(goalId)
  const deleteBlock = useDeletePlanBlock(goalId)
  const reorderBlocks = useReorderPlanBlocks(goalId)
  const moveStep = useMoveCurrentStep(goalId, goalQuery.data?.dogId ?? "")

  const blocks = blocksQuery.data ?? []
  // Wait for the goal so a loading null does not flash the first block as current.
  const currentStepId = goalQuery.isSuccess
    ? (goalQuery.data.currentStepId ?? blocks[0]?.id ?? null)
    : null

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleSave = async (exercise: NewExercise) => {
    try {
      if (dialogMode?.kind === "edit") {
        const { insertAt: _insertAt, ...values } = exercise
        await updateBlock.mutateAsync({ blockId: dialogMode.block.id, values })
      } else {
        await createBlock.mutateAsync(exercise)
      }
      setDialogMode(null)
    } catch {
      // The hook already told the user; keep the dialog open.
    }
  }

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= blocks.length) return
    const reordered = [...blocks]
    const [moved] = reordered.splice(index, 1)
    if (!moved) return
    reordered.splice(target, 0, moved)
    reorderBlocks.mutate(reordered)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = blocks.findIndex((b) => b.id === active.id)
    const newIndex = blocks.findIndex((b) => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate(20)
    }

    const reordered = arrayMove(blocks, oldIndex, newIndex)
    reorderBlocks.mutate(reordered)
  }

  const handleConfirmDelete = () => {
    if (!blockToDelete) return
    deleteBlock.mutate(blockToDelete.id)
    setBlockToDelete(null)
  }

  return (
    <section
      className="space-y-3"
      aria-labelledby="plan-blocks-heading"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="plan-blocks-heading"
          className="text-xl font-semibold tracking-tight text-foreground"
        >
          Cviky
        </h2>
        {blocks.length > 0 ? (
          <span className="text-sm text-muted-foreground">{blocks.length}</span>
        ) : null}
      </div>

      {blocksQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : blocksQuery.error ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Cviky se nepodařilo načíst.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => void blocksQuery.refetch()}
          >
            Zkusit znovu
          </Button>
        </div>
      ) : blocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <ListOrdered className="size-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            Plán zatím nemá žádný cvik. Přidejte první krok, který se bude doma cvičit.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="flex flex-col gap-2">
              {blocks.map((block, index) => (
                <SortablePlanBlockItem
                  key={block.id}
                  block={block}
                  number={index + 1}
                  isFirst={index === 0}
                  isLast={index === blocks.length - 1}
                  isCurrent={block.id === currentStepId}
                  isReordering={reorderBlocks.isPending}
                  isStepBusy={moveStep.isPending}
                  onEdit={() => setDialogMode({ kind: "edit", block })}
                  onMove={(direction) => handleMove(index, direction)}
                  onDelete={() => setBlockToDelete(block)}
                  onAdvance={() => void moveStep.mutateAsync("advance")}
                  onSkip={() => void moveStep.mutateAsync("skip")}
                  onBack={() => void moveStep.mutateAsync("back")}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <Button
        type="button"
        variant="ghost"
        className="min-h-11 w-full gap-2"
        onClick={() => setDialogMode({ kind: "create", blocks })}
      >
        <Plus className="size-4" />
        Přidat cvik
      </Button>

      <ExerciseDialog
        mode={dialogMode}
        onClose={() => setDialogMode(null)}
        isPending={createBlock.isPending || updateBlock.isPending}
        onSubmit={handleSave}
      />

      <AlertDialog
        open={blockToDelete !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setBlockToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat cvik?</AlertDialogTitle>
            <AlertDialogDescription>
              Cvik „{blockToDelete?.title}“ zmizí z plánu. Vrátit to nepůjde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Ponechat</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="min-h-11"
              onClick={handleConfirmDelete}
            >
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
