import { DayPicker } from "@/components/DayPicker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDayAccusative, type CalendarDate } from "@/lib/calendarDate"

type ScheduleTrainingDialogProps = {
  dogName: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  isPending: boolean
  onSchedule: (date: CalendarDate) => Promise<void>
  // Days the goal already has a planned training on: one a day at most.
  plannedDates?: CalendarDate[]
}

// "Kdy má Rex cvičit?" – a new training of the goal on one day, today
// preselected when it is free, no days in the past (#71).
export function ScheduleTrainingDialog({
  dogName,
  isOpen,
  onOpenChange,
  isPending,
  onSchedule,
  plannedDates,
}: ScheduleTrainingDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="p-4 sm:max-w-md sm:p-6">
        <DialogHeader>
          <DialogTitle>Kdy má {dogName} cvičit?</DialogTitle>
          <DialogDescription>
            Vyberte den nového tréninku. Ostatní tréninky k tomuto cíli zůstanou naplánované.
          </DialogDescription>
        </DialogHeader>
        <DayPicker
          hint="Minulé dny a dny, na které už má tento cíl naplánovaný trénink, nelze vybrat."
          isPending={isPending}
          unavailableDays={plannedDates}
          submitLabel={(day) => `Naplánovat na ${formatDayAccusative(day)}`}
          onPick={onSchedule}
        />
      </DialogContent>
    </Dialog>
  )
}
