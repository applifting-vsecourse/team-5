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
}

// "Kdy má Rex cvičit?" – one day, today preselected, no days in the past (#71).
export function ScheduleTrainingDialog({
  dogName,
  isOpen,
  onOpenChange,
  isPending,
  onSchedule,
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
            Vyberte jeden den. Trénink se objeví v Týdnu ve vybraný den.
          </DialogDescription>
        </DialogHeader>
        <DayPicker
          hint="Den v minulosti vybrat nejde. Na jiný den trénink později přesunete."
          isPending={isPending}
          submitLabel={(day) => `Naplánovat na ${formatDayAccusative(day)}`}
          onPick={onSchedule}
        />
      </DialogContent>
    </Dialog>
  )
}
