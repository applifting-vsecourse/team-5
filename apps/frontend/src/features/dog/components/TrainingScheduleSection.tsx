import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDayAccusative, type CalendarDate } from "@/lib/calendarDate"

import { goalTrainingsQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { useScheduleTraining } from "@/features/dog/hooks/useScheduleTraining"

import { ScheduleTrainingDialog } from "./ScheduleTrainingDialog"

type TrainingScheduleSectionProps = {
  goalId: string
  dogName: string
  // Set when the user came from "Uložit a naplánovat" on a new goal.
  isScheduleRequested?: boolean
  onScheduleRequestHandled?: () => void
}

export function TrainingScheduleSection({
  goalId,
  dogName,
  isScheduleRequested = false,
  onScheduleRequestHandled,
}: TrainingScheduleSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const trainingsQuery = useQuery(goalTrainingsQueryOptions(goalId))
  const schedule = useScheduleTraining(goalId)

  const planned = trainingsQuery.data?.find((training) => training.status === "PLANNED")

  // Coming from "Uložit a naplánovat", the picker opens by itself once we know
  // the training has no day yet.
  const isAutoOpen = isScheduleRequested && trainingsQuery.isSuccess && !planned
  const isOpen = isDialogOpen || isAutoOpen

  // A request for a training that already has a day has nothing to do.
  useEffect(() => {
    if (isScheduleRequested && planned) onScheduleRequestHandled?.()
  }, [isScheduleRequested, planned, onScheduleRequestHandled])

  const handleOpenChange = (isNextOpen: boolean) => {
    setIsDialogOpen(isNextOpen)
    if (!isNextOpen && isScheduleRequested) onScheduleRequestHandled?.()
  }

  const handleSchedule = async (date: CalendarDate) => {
    try {
      await schedule.mutateAsync(date)
      handleOpenChange(false)
    } catch {
      // useScheduleTraining already told the user; keep the dialog open.
    }
  }

  return (
    <section
      className="space-y-3"
      aria-labelledby="training-schedule-heading"
    >
      <h2
        id="training-schedule-heading"
        className="text-xl font-semibold tracking-tight text-foreground"
      >
        Kdy cvičit
      </h2>

      {trainingsQuery.isLoading ? (
        <Skeleton className="h-11 w-full rounded-lg" />
      ) : trainingsQuery.error ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Termín tréninku se nepodařilo načíst.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => void trainingsQuery.refetch()}
          >
            Zkusit znovu
          </Button>
        </div>
      ) : planned ? (
        // Changing the day of a planned training arrives with the move in the week (#74).
        <p className="flex items-center gap-2 text-base text-foreground">
          <CalendarDays
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
          Naplánováno na {formatDayAccusative(planned.date)}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Trénink zatím nemá den. Naplánujte ho, ať se objeví v Týdnu.
          </p>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <CalendarDays className="size-4" />
            Naplánovat
          </Button>
        </div>
      )}

      <ScheduleTrainingDialog
        dogName={dogName}
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        isPending={schedule.isPending}
        onSchedule={handleSchedule}
      />
    </section>
  )
}
