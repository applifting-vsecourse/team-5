import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { dogKeys } from "@/features/dog/api/dogKeys"
import { createPlanBlock, type NewExercise } from "@/features/dog/api/savePlanBlock"

export function useCreatePlanBlock(goalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: NewExercise) => createPlanBlock(goalId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dogKeys.goalBlocks(goalId) })
      toast.success("Cvik je přidaný")
    },
    onError: () => {
      toast.error("Cvik se nepodařilo přidat. Zkuste to prosím znovu.")
    },
  })
}
