import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { dogKeys } from "@/features/dog/api/dogKeys"
import type { ExerciseFormValues } from "@/features/dog/api/dogSchemas"
import { updatePlanBlock } from "@/features/dog/api/savePlanBlock"

export function useUpdatePlanBlock(goalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ blockId, values }: { blockId: string; values: ExerciseFormValues }) =>
      updatePlanBlock(blockId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dogKeys.goalBlocks(goalId) })
      toast.success("Cvik je upravený")
    },
    onError: () => {
      toast.error("Cvik se nepodařilo upravit. Zkuste to prosím znovu.")
    },
  })
}
