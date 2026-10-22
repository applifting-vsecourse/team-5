import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { weekKeys } from "@/lib/weekKeys"

import { dogKeys } from "@/features/dog/api/dogKeys"
import { createPlanBlock, type NewExercise } from "@/features/dog/api/savePlanBlock"

export function useCreatePlanBlock(goalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: NewExercise) => createPlanBlock(goalId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dogKeys.goalBlocks(goalId) })
      // The week shows goals and their exercises too (#72).
      void queryClient.invalidateQueries({ queryKey: weekKeys.all })
      toast.success("Cvik je přidaný")
    },
    onError: () => {
      toast.error("Cvik se nepodařilo přidat. Zkuste to prosím znovu.")
    },
  })
}
