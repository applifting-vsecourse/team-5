import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { weekKeys } from "@/lib/weekKeys"

import { dogKeys } from "@/features/dog/api/dogKeys"
import { deletePlanBlock } from "@/features/dog/api/savePlanBlock"

export function useDeletePlanBlock(goalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (blockId: string) => deletePlanBlock(blockId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dogKeys.goalBlocks(goalId) })
      // The week shows goals and their exercises too (#72).
      void queryClient.invalidateQueries({ queryKey: weekKeys.all })
      toast.success("Cvik je smazaný")
    },
    onError: () => {
      toast.error("Cvik se nepodařilo smazat. Zkuste to prosím znovu.")
    },
  })
}
