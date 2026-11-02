import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { toast } from "sonner"

import { formatDayAccusative, type CalendarDate } from "@/lib/calendarDate"
import { dogKeys } from "@/lib/dogKeys"
import { weekKeys } from "@/lib/weekKeys"

import { moveTraining } from "@/features/week/api/moveTraining"

export function useMoveTraining(trainingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (date: CalendarDate) => moveTraining(trainingId, date),
    onSuccess: (training) => {
      // The old day and the new one may sit in different cached weeks.
      void queryClient.invalidateQueries({ queryKey: weekKeys.all })
      void queryClient.invalidateQueries({ queryKey: dogKeys.goalTrainings(training.goalId) })
      void queryClient.invalidateQueries({ queryKey: dogKeys.plannedTrainings(training.dogId) })
      toast.success(`Trénink je přesunutý na ${formatDayAccusative(training.date)}`)
    },
    onError: (error) => {
      // 409: the goal already has a training on that day, or this one was
      // completed or skipped meanwhile (e.g. on another device).
      const isConflict = error instanceof HTTPError && error.response.status === 409
      if (isConflict) void queryClient.invalidateQueries({ queryKey: weekKeys.all })
      toast.error(
        isConflict
          ? "Přesunout to nejde: cíl už má na ten den trénink, nebo tento trénink už není naplánovaný."
          : "Trénink se nepodařilo přesunout. Zkuste to prosím znovu.",
      )
    },
  })
}
