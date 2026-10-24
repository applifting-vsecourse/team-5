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
import { ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Trash2 } from "lucide-react"

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
import { cn } from "@/lib/utils"

import type { PlanBlock } from "@/features/dog/api/dogSchemas"
import { goalBlocksQueryOptions } from "@/features/dog/api/dogsQueryOptions"
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
  isReordering: boolean
  onEdit: () => void
  onMove: (direction: -1 | 1) => void
  onDelete: () => void
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
  isReordering,
  onEdit,
  onMove,
  onDelete,
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
      className={cn(
        "relative flex gap-3 rounded-lg border border-border bg-card p-3 transition-shadow duration-150",
        isDragging && "z-20 opacity-60 shadow-lg ring-2 ring-primary/40",
      )}
    >
      {/* Agility Track Station Marker & Course Trail */}
      <div
        {...dragHandleProps}
        className="relative flex cursor-grab touch-none flex-col items-center select-none active:cursor-grabbing"
        title="Přetáhněte pro změnu pořadí na trati"
        aria-label={`Přetáhnout cvik ${block.title}`}
      >
        {/* Upper agility track connector line */}
        {!isFirst && (
          <div
            aria-hidden="true"
            className="absolute -top-3.5 left-1/2 h-3.5 w-0 -translate-x-1/2 border-l-2 border-dashed border-primary/35"
          />
        )}

        {/* Agility Course Station Checkpoint */}
        <span
          aria-hidden="true"
          className="relative mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-bold text-secondary-foreground shadow-2xs ring-2 ring-primary/25"
        >
          {number}
        </span>

        <GripVertical
          aria-hidden="true"
          className="mt-1 size-3.5 text-muted-foreground/45 transition-colors hover:text-foreground"
        />

        {/* Lower agility track connector line */}
        {!isLast && (
          <div
            aria-hidden="true"
            className="absolute -bottom-3.5 left-1/2 h-3.5 w-0 -translate-x-1/2 border-l-2 border-dashed border-primary/35"
          />
        )}
      </div>

      {/* Clicking the block opens it for editing (#65). */}
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 flex-col justify-start gap-1 rounded-md py-1 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
      >
        {/* A button only allows phrasing content, so spans instead of h3/p. */}
        <span className="block text-base font-medium text-foreground">
          <span className="sr-only">Cvik {number}: </span>
          {block.title}
        </span>
        {block.instruction ? (
          <span className="line-clamp-2 block text-sm text-muted-foreground">
            Instrukce: {block.instruction}
          </span>
        ) : null}
        {/* The criterion stays visible without opening the block (#63). */}
        {block.criterion ? (
          <span className="block text-sm text-foreground">Kritérium: {block.criterion}</span>
        ) : null}
      </button>

      {/* Buttons for accessibility and mobile arrow navigation */}
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

  const blocksQuery = useQuery(goalBlocksQueryOptions(goalId))
  const createBlock = useCreatePlanBlock(goalId)
  const updateBlock = useUpdatePlanBlock(goalId)
  const deleteBlock = useDeletePlanBlock(goalId)
  const reorderBlocks = useReorderPlanBlocks(goalId)

  const blocks = blocksQuery.data ?? []

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
        <p className="text-sm text-muted-foreground">
          Plán zatím nemá žádný cvik. Přidejte první krok, který se bude doma cvičit.
        </p>
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
                  isReordering={reorderBlocks.isPending}
                  onEdit={() => setDialogMode({ kind: "edit", block })}
                  onMove={(direction) => handleMove(index, direction)}
                  onDelete={() => setBlockToDelete(block)}
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
