import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { toast } from "sonner"

import { dogKeys } from "@/lib/dogKeys"
import { weekKeys } from "@/lib/weekKeys"

import { skipTraining, undoSkip, type SkippedTraining } from "@/features/week/api/skipTraining"

// A skip shows in the week, in the goal's trainings and in the dog's
// Activities (the planned list and the "skipped" record).
const refreshAfterSkip = (queryClient: QueryClient, training: SkippedTraining) => {
  void queryClient.invalidateQueries({ queryKey: weekKeys.all })
  void queryClient.invalidateQueries({ queryKey: dogKeys.goalTrainings(training.goalId) })
  void queryClient.invalidateQueries({ queryKey: dogKeys.plannedTrainings(training.dogId) })
  void queryClient.invalidateQueries({ queryKey: dogKeys.activities(training.dogId) })
}

const isConflict = (error: Error) => error instanceof HTTPError && error.response.status === 409

export function useSkipTraining(trainingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => skipTraining(trainingId),
    onSuccess: (training) => {
      refreshAfterSkip(queryClient, training)
      toast.success("Trénink je přeskočený. Do konce týdne to můžete vrátit.")
    },
    onError: (error) => {
      // 409: completed or skipped meanwhile (e.g. on another device).
      if (isConflict(error)) void queryClient.invalidateQueries({ queryKey: weekKeys.all })
      toast.error(
        isConflict(error)
          ? "Trénink už není naplánovaný, přeskočit ho nejde."
          : "Trénink se nepodařilo přeskočit. Zkuste to prosím znovu.",
      )
    },
  })
}

export function useUndoSkip(trainingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => undoSkip(trainingId),
    onSuccess: (training) => {
      refreshAfterSkip(queryClient, training)
      toast.success("Trénink je zase naplánovaný")
    },
    onError: (error) => {
      // 409: the week is over, or the goal has been planned again meanwhile.
      if (isConflict(error)) void queryClient.invalidateQueries({ queryKey: weekKeys.all })
      toast.error(
        isConflict(error)
          ? "Přeskočení už vrátit nejde. Cíl má na ten den jiný trénink, nebo týden skončil."
          : "Přeskočení se nepodařilo vrátit. Zkuste to prosím znovu.",
      )
    },
  })
}
