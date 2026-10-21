import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { dogKeys } from "@/features/dog/api/dogKeys"
import type { PlanBlock } from "@/features/dog/api/dogSchemas"
import { reorderPlanBlocks } from "@/features/dog/api/savePlanBlock"

// Moving a block with the arrows should feel instant, so the new order shows
// right away and is rolled back if the server refuses it.
export function useReorderPlanBlocks(goalId: string) {
  const queryClient = useQueryClient()
  const queryKey = dogKeys.goalBlocks(goalId)

  return useMutation({
    mutationFn: (blocks: PlanBlock[]) =>
      reorderPlanBlocks(
        goalId,
        blocks.map((block) => block.id),
      ),
    onMutate: async (blocks) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<PlanBlock[]>(queryKey)
      queryClient.setQueryData(queryKey, blocks)
      return { previous }
    },
    onError: (_error, _blocks, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      toast.error("Pořadí se nepodařilo uložit. Zkuste to prosím znovu.")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
    },
  })
}
