import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { HTTPError } from "ky"
import { toast } from "sonner"

import { dogKeys } from "@/lib/dogKeys"
import { weekKeys } from "@/lib/weekKeys"

import { completeTraining } from "@/features/training/api/completeTraining"
import type { CompleteTrainingInput } from "@/features/training/api/trainingSchemas"
import {
  toTrainingReturnSearch,
  trainingHome,
  type TrainingReturnTo,
} from "@/features/training/lib/trainingReturn"

export function useCompleteTraining(trainingId: string, dogId: string, zpet?: TrainingReturnTo) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const returnSearch = toTrainingReturnSearch(zpet)

  return useMutation({
    mutationFn: (input: CompleteTrainingInput) => completeTraining(trainingId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: weekKeys.all })
      void queryClient.invalidateQueries({ queryKey: dogKeys.activities(dogId) })
      void queryClient.invalidateQueries({ queryKey: dogKeys.detail(dogId) })
      void queryClient.invalidateQueries({ queryKey: dogKeys.metrics(dogId) })
      void queryClient.invalidateQueries({ queryKey: dogKeys.all })
      toast.success("Záznam tréninku byl uložen")
      void navigate({
        to: "/trainings/$trainingId/done",
        params: { trainingId },
        search: returnSearch,
      })
    },
    onError: (error) => {
      const status = error instanceof HTTPError ? error.response.status : undefined
      // 409: already completed, e.g. the form was sent twice. "Try again"
      // would mislead; the training is done, so back to the origin screen.
      if (status === 409) {
        void queryClient.invalidateQueries({ queryKey: weekKeys.all })
        toast.error("Trénink už je odcvičený")
        void navigate({ to: trainingHome(zpet) })
        return
      }
      toast.error(
        status === 403
          ? "Záznam z tréninku odesílá psovod"
          : "Záznam se nepodařilo uložit. Zkuste to prosím znovu.",
      )
    },
  })
}
