import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDayLong, type CalendarDate } from "@/lib/calendarDate"

import { goalTrainingsQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { useScheduleTraining } from "@/features/dog/hooks/useScheduleTraining"

import { ScheduleTrainingDialog } from "./ScheduleTrainingDialog"

type TrainingScheduleSectionProps = {
  goalId: string
  dogName: string
  isScheduleRequested?: boolean
  onScheduleRequestHandled?: () => void
}

const statusLabels = {
  PLANNED: "Naplánováno",
  COMPLETED: "Odcvičeno",
  SKIPPED: "Přeskočeno",
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
  const trainings = trainingsQuery.data ?? []
  const plannedDates = trainings
    .filter((training) => training.status === "PLANNED")
    .map((training) => training.date)
  const isOpen = isDialogOpen || (isScheduleRequested && trainingsQuery.isSuccess)

  const handleOpenChange = (isNextOpen: boolean) => {
    if (schedule.isPending) return
    setIsDialogOpen(isNextOpen)
    if (!isNextOpen && isScheduleRequested) onScheduleRequestHandled?.()
  }

  const handleSchedule = async (date: CalendarDate) => {
    try {
      await schedule.mutateAsync(date)
      setIsDialogOpen(false)
      onScheduleRequestHandled?.()
    } catch {
      // The mutation reports the error; keep the selected date for retry.
    }
  }

  return (
    <section
      className="space-y-4 border-t border-border pt-8"
      aria-labelledby="training-schedule-heading"
    >
      <div className="space-y-2">
        <h2
          id="training-schedule-heading"
          className="text-xl font-semibold tracking-tight text-foreground"
        >
          Tréninky k cíli
        </h2>
        <p className="text-sm text-muted-foreground">
          Každý trénink je jedno cvičení v konkrétní den. Na stejném cíli můžete pracovat opakovaně,
          i několik týdnů.
        </p>
      </div>
      {trainingsQuery.isLoading ? (
        <Skeleton className="h-16 w-full rounded-lg" />
      ) : trainingsQuery.error ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Tréninky se nepodařilo načíst.</p>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => void trainingsQuery.refetch()}
          >
            Zkusit znovu
          </Button>
        </div>
      ) : (
        <>
          {trainings.length ? (
            <ul className="divide-y divide-border">
              {trainings.map((training) => (
                <li
                  key={training.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays
                      className="size-5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <time
                      dateTime={training.date}
                      className="text-base font-medium text-foreground"
                    >
                      {formatDayLong(training.date)} {training.date.slice(0, 4)}
                    </time>
                  </div>
                  <Badge variant={training.status === "PLANNED" ? "secondary" : "outline"}>
                    {statusLabels[training.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              K tomuto cíli zatím nejsou naplánované žádné tréninky.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full gap-2 sm:w-auto"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus
              className="size-4"
              aria-hidden="true"
            />
            {trainings.length ? "Přidat další trénink" : "Naplánovat první trénink"}
          </Button>
        </>
      )}
      <ScheduleTrainingDialog
        dogName={dogName}
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        isPending={schedule.isPending}
        onSchedule={handleSchedule}
        plannedDates={plannedDates}
      />
    </section>
  )
}
