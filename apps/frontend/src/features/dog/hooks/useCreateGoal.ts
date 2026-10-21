import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { dogKeys } from "@/features/dog/api/dogKeys"
import type { GoalFormValues } from "@/features/dog/api/dogSchemas"
import { createGoal } from "@/features/dog/api/saveGoal"

export function useCreateGoal(dogId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: GoalFormValues) => createGoal(dogId, values),
    onSuccess: (goal) => {
      queryClient.setQueryData(dogKeys.goal(goal.id), goal)
      void queryClient.invalidateQueries({ queryKey: dogKeys.goals(dogId) })
      toast.success("Cíl je uložený")
    },
    onError: () => {
      toast.error("Cíl se nepodařilo uložit. Zkuste to prosím znovu.")
    },
  })
}
