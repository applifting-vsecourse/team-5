import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react"

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
}: PlanBlockItemProps) {
  return (
    <li className="flex gap-3 rounded-lg border border-border bg-card p-3">
      <span
        aria-hidden="true"
        className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground"
      >
        {number}
      </span>

      {/* Clicking the block opens it for editing (#65). */}
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 flex-col justify-start gap-1 rounded-md py-1 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
      >
        <h3 className="text-base font-medium text-foreground">
          <span className="sr-only">Cvik {number}: </span>
          {block.title}
        </h3>
        {block.instruction ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            Instrukce: {block.instruction}
          </p>
        ) : null}
        {/* The criterion stays visible without opening the block (#63). */}
        {block.criterion ? (
          <p className="text-sm text-foreground">Kritérium: {block.criterion}</p>
        ) : null}
      </button>

      {/* Arrows instead of drag and drop, so the order can be changed on a phone too. */}
      <div className="grid shrink-0 grid-cols-2 content-start gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label={`Posunout cvik ${block.title} nahoru`}
          disabled={isFirst || isReordering}
          onClick={() => onMove(-1)}
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
          onClick={() => onMove(1)}
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

export function PlanBlocksSection({ goalId }: { goalId: string }) {
  const [dialogMode, setDialogMode] = useState<ExerciseDialogMode | null>(null)
  const [blockToDelete, setBlockToDelete] = useState<PlanBlock | null>(null)

  const blocksQuery = useQuery(goalBlocksQueryOptions(goalId))
  const createBlock = useCreatePlanBlock(goalId)
  const updateBlock = useUpdatePlanBlock(goalId)
  const deleteBlock = useDeletePlanBlock(goalId)
  const reorderBlocks = useReorderPlanBlocks(goalId)

  const blocks = blocksQuery.data ?? []

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
        <ol className="flex flex-col gap-2">
          {blocks.map((block, index) => (
            <PlanBlockItem
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
