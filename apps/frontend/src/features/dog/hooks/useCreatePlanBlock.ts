import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { dogKeys } from "@/features/dog/api/dogKeys"
import type { ExerciseFormValues } from "@/features/dog/api/dogSchemas"
import { createPlanBlock } from "@/features/dog/api/savePlanBlock"

export function useCreatePlanBlock(goalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: ExerciseFormValues) => createPlanBlock(goalId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dogKeys.goalBlocks(goalId) })
      toast.success("Cvik je přidaný")
    },
    onError: () => {
      toast.error("Cvik se nepodařilo přidat. Zkuste to prosím znovu.")
    },
  })
}
