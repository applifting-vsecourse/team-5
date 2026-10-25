import { DayPicker } from "@/components/DayPicker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  addCalendarDays,
  formatDayAccusative,
  formatDayLong,
  todayCalendarDate,
  type CalendarDate,
} from "@/lib/calendarDate"

import type { WeekTraining } from "@/features/week/api/weekQueryOptions"
import { useMoveTraining } from "@/features/week/hooks/useMoveTraining"

type MoveTrainingDialogProps = {
  training: WeekTraining
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

// Today, unless the training is already on today: then tomorrow.
const firstOfferedDay = (current: CalendarDate): CalendarDate => {
  const today = todayCalendarDate()
  return current === today ? addCalendarDays(today, 1) : today
}

// "Přesunout trénink" (#74): one other day from today on, in any week.
export function MoveTrainingDialog({ training, isOpen, onOpenChange }: MoveTrainingDialogProps) {
  const moveTraining = useMoveTraining(training.id)

  const move = async (date: CalendarDate) => {
    try {
      await moveTraining.mutateAsync(date)
      onOpenChange(false)
    } catch {
      // The hook already told the user; the dialog stays open to pick again.
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="p-4 sm:max-w-md sm:p-6">
        <DialogHeader>
          <DialogTitle>Přesunout trénink</DialogTitle>
          <DialogDescription>
            {/* formatDayLong already ends with a dot ("sobota 24. 10."). */}
            {training.dog.name} · {training.goal.title}, teď {formatDayLong(training.date)}
          </DialogDescription>
        </DialogHeader>
        <DayPicker
          initialDay={firstOfferedDay(training.date)}
          unavailableDay={training.date}
          hint="Vyberte nový den, i v jiném týdnu. Den v minulosti vybrat nejde."
          isPending={moveTraining.isPending}
          submitLabel={(day) => `Přesunout na ${formatDayAccusative(day)}`}
          onPick={move}
        />
      </DialogContent>
    </Dialog>
  )
}
