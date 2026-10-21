import { useState } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  addCalendarDays,
  daysOfWeek,
  formatDayAccusative,
  formatDayLong,
  formatDayOfMonth,
  formatWeekdayShort,
  formatWeekRange,
  startOfWeekOf,
  todayCalendarDate,
  type CalendarDate,
} from "@/lib/calendarDate"

type DayPickerProps = {
  isPending: boolean
  onSchedule: (date: CalendarDate) => Promise<void>
}

// Lives inside the dialog content, which mounts on every opening, so the
// picker always starts again from today.
function DayPicker({ isPending, onSchedule }: DayPickerProps) {
  const today = todayCalendarDate()
  const currentWeek = startOfWeekOf(today)
  const [weekStart, setWeekStart] = useState(currentWeek)
  const [selected, setSelected] = useState<CalendarDate>(today)

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Předchozí týden"
            // Earlier weeks hold only past days.
            disabled={weekStart <= currentWeek}
            onClick={() => setWeekStart(addCalendarDays(weekStart, -7))}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <p
            className="text-base font-medium text-foreground"
            aria-live="polite"
          >
            {formatWeekRange(weekStart)}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Další týden"
            onClick={() => setWeekStart(addCalendarDays(weekStart, 7))}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>

        <ToggleGroup
          type="single"
          value={selected}
          onValueChange={(value) => {
            // Radix sends "" when the selected day is clicked again; keep it.
            if (value) setSelected(value)
          }}
          aria-label="Den tréninku"
          // No gap and no side padding, so seven days stay 44 px wide on a phone.
          className="grid w-full grid-cols-7 gap-0"
        >
          {daysOfWeek(weekStart).map((day) => (
            <ToggleGroupItem
              key={day}
              value={day}
              disabled={day < today}
              aria-label={formatDayLong(day)}
              className="flex h-auto min-h-14 min-w-11 flex-col gap-0 rounded-md border border-transparent px-0 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[today=true]:border-border"
              data-today={day === today}
            >
              <span className="text-xs">{formatWeekdayShort(day)}</span>
              <span className="text-base font-medium">{formatDayOfMonth(day)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <p className="text-sm text-muted-foreground">
          Den v minulosti vybrat nejde. Na jiný den trénink později přesunete.
        </p>
      </div>

      <DialogFooter>
        <Button
          type="button"
          className="min-h-11 w-full"
          disabled={isPending}
          onClick={() => void onSchedule(selected)}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Naplánovat na {formatDayAccusative(selected)}
        </Button>
      </DialogFooter>
    </>
  )
}

type ScheduleTrainingDialogProps = DayPickerProps & {
  dogName: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
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
          isPending={isPending}
          onSchedule={onSchedule}
        />
      </DialogContent>
    </Dialog>
  )
}
