import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { dogKeys } from "@/features/dog/api/dogKeys"
import type { GoalFormValues } from "@/features/dog/api/dogSchemas"
import { updateGoal } from "@/features/dog/api/saveGoal"

export function useUpdateGoal(dogId: string, goalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: GoalFormValues) => updateGoal(goalId, values),
    onSuccess: (goal) => {
      queryClient.setQueryData(dogKeys.goal(goal.id), goal)
      void queryClient.invalidateQueries({ queryKey: dogKeys.goals(dogId) })
      toast.success("Změny jsou uložené")
    },
    onError: () => {
      toast.error("Změny se nepodařilo uložit. Zkuste to prosím znovu.")
    },
  })
}
