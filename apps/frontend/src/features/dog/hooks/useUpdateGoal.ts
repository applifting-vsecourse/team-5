import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { replyKeys } from "@/lib/trainingReplies"
import { weekKeys } from "@/lib/weekKeys"

import { dogKeys } from "@/features/dog/api/dogKeys"
import type { GoalFormValues } from "@/features/dog/api/dogSchemas"
import { updateGoal } from "@/features/dog/api/saveGoal"

export function useUpdateGoal(dogId: string, goalId: string, replyToActivityId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: GoalFormValues) => updateGoal(goalId, values, replyToActivityId),
    onSuccess: (goal) => {
      queryClient.setQueryData(dogKeys.goal(goal.id), goal)
      void queryClient.invalidateQueries({ queryKey: dogKeys.goals(dogId) })
      // The week shows goals and their exercises too (#72).
      void queryClient.invalidateQueries({ queryKey: weekKeys.all })
      void queryClient.invalidateQueries({ queryKey: replyKeys.all })
      toast.success("Změny jsou uložené")
    },
    onError: () => {
      toast.error("Změny se nepodařilo uložit. Zkuste to prosím znovu.")
    },
  })
}
