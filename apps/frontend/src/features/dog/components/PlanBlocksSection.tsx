import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import type { ExerciseFormValues, PlanBlock } from "@/features/dog/api/dogSchemas"
import { goalBlocksQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { useCreatePlanBlock } from "@/features/dog/hooks/useCreatePlanBlock"

import { AddExerciseDialog } from "./AddExerciseDialog"

function PlanBlockItem({ block, number }: { block: PlanBlock; number: number }) {
  return (
    <li className="flex gap-3 rounded-lg border border-border bg-card p-4">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground"
      >
        {number}
      </span>
      <div className="min-w-0 space-y-1">
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
      </div>
    </li>
  )
}

export function PlanBlocksSection({ goalId }: { goalId: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const blocksQuery = useQuery(goalBlocksQueryOptions(goalId))
  const createBlock = useCreatePlanBlock(goalId)

  const handleAdd = async (values: ExerciseFormValues) => {
    try {
      await createBlock.mutateAsync(values)
      setIsDialogOpen(false)
    } catch {
      // useCreatePlanBlock already told the user; keep the dialog open.
    }
  }

  const blocks = blocksQuery.data ?? []

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
            />
          ))}
        </ol>
      )}

      <Button
        type="button"
        variant="ghost"
        className="min-h-11 w-full gap-2"
        onClick={() => setIsDialogOpen(true)}
      >
        <Plus className="size-4" />
        Přidat cvik
      </Button>

      <AddExerciseDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isPending={createBlock.isPending}
        onSubmit={handleAdd}
      />
    </section>
  )
}
