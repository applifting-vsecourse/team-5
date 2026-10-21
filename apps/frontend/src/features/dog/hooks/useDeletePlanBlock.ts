import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { dogKeys } from "@/features/dog/api/dogKeys"
import { deletePlanBlock } from "@/features/dog/api/savePlanBlock"

export function useDeletePlanBlock(goalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (blockId: string) => deletePlanBlock(blockId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dogKeys.goalBlocks(goalId) })
      toast.success("Cvik je smazaný")
    },
    onError: () => {
      toast.error("Cvik se nepodařilo smazat. Zkuste to prosím znovu.")
    },
  })
}
