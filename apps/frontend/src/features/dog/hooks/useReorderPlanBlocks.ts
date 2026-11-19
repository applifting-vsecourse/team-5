import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { weekKeys } from "@/lib/weekKeys"

import { dogKeys } from "@/features/dog/api/dogKeys"
import type { PlanBlock } from "@/features/dog/api/dogSchemas"
import { reorderPlanBlocks } from "@/features/dog/api/savePlanBlock"

export type ReorderPlanBlocksInput = PlanBlock[] | { ids: string[]; optimistic: PlanBlock[] }

// Moving a block with the arrows should feel instant, so the new order shows
// right away and is rolled back if the server refuses it. Sibling reorder (#67)
// sends only that group's ids while keeping the full plan in the optimistic cache.
export function useReorderPlanBlocks(goalId: string) {
  const queryClient = useQueryClient()
  const queryKey = dogKeys.goalBlocks(goalId)

  return useMutation({
    mutationFn: (input: ReorderPlanBlocksInput) =>
      reorderPlanBlocks(goalId, Array.isArray(input) ? input.map((block) => block.id) : input.ids),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<PlanBlock[]>(queryKey)
      queryClient.setQueryData(queryKey, Array.isArray(input) ? input : input.optimistic)
      return { previous }
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      toast.error("Pořadí se nepodařilo uložit. Zkuste to prosím znovu.")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
      // The week lists the exercises in plan order too (#72).
      void queryClient.invalidateQueries({ queryKey: weekKeys.all })
    },
  })
}
