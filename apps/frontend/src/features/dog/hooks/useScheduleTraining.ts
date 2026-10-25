import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { toast } from "sonner"

import { formatDayAccusative, type CalendarDate } from "@/lib/calendarDate"
import { weekKeys } from "@/lib/weekKeys"

import { dogKeys } from "@/features/dog/api/dogKeys"
import { scheduleTraining } from "@/features/dog/api/scheduleTraining"

export function useScheduleTraining(goalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (date: CalendarDate) => scheduleTraining(goalId, date),
    onSuccess: (training) => {
      void queryClient.invalidateQueries({ queryKey: dogKeys.goalTrainings(goalId) })
      // The week shows goals and their exercises too (#72).
      void queryClient.invalidateQueries({ queryKey: weekKeys.all })
      // Activities list the dog's planned days (#74).
      void queryClient.invalidateQueries({ queryKey: dogKeys.plannedTrainings(training.dogId) })
      toast.success(`Trénink je naplánovaný na ${formatDayAccusative(training.date)}`)
    },
    onError: (error) => {
      // 409: someone planned it meanwhile (e.g. in another tab).
      const isAlreadyPlanned = error instanceof HTTPError && error.response.status === 409
      toast.error(
        isAlreadyPlanned
          ? "Trénink už je naplánovaný. Na jiný den ho přesunete v Týdnu."
          : "Trénink se nepodařilo naplánovat. Zkuste to prosím znovu.",
      )
      if (isAlreadyPlanned) {
        void queryClient.invalidateQueries({ queryKey: dogKeys.goalTrainings(goalId) })
      }
    },
  })
}
