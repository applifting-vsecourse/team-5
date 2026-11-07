import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { toast } from "sonner"

import { dogKeys } from "@/lib/dogKeys"
import { moveCurrentStep, type CurrentStepAction } from "@/lib/moveCurrentStep"
import { weekKeys } from "@/lib/weekKeys"

const trainingKeysAll = ["trainings"] as const

/** Shared by PlanBlocksSection and TrainingWalkthrough (#66). */
export function useMoveCurrentStep(goalId: string, dogId: string, trainingId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (action: CurrentStepAction) => moveCurrentStep(goalId, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dogKeys.goal(goalId) })
      void queryClient.invalidateQueries({ queryKey: dogKeys.goalBlocks(goalId) })
      if (dogId) {
        void queryClient.invalidateQueries({ queryKey: dogKeys.detail(dogId) })
      }
      void queryClient.invalidateQueries({ queryKey: weekKeys.all })
      if (trainingId) {
        void queryClient.invalidateQueries({ queryKey: [...trainingKeysAll, trainingId] })
      } else {
        void queryClient.invalidateQueries({ queryKey: trainingKeysAll })
      }
    },
    onError: (error) => {
      const status = error instanceof HTTPError ? error.response.status : undefined
      toast.error(
        status === 403
          ? "Krok může posunout jen psovod nebo trenér tohoto psa"
          : "Krok se nepodařilo posunout. Zkuste to prosím znovu.",
      )
    },
  })
}
