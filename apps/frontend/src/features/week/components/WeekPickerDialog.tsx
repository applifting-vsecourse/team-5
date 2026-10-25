import { useState } from "react"
import { cs } from "react-day-picker/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  daysOfWeek,
  fromCalendarDate,
  startOfWeekOf,
  toCalendarDate,
  todayCalendarDate,
  type CalendarDate,
} from "@/lib/calendarDate"

type WeekPickerDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  selectedWeek: CalendarDate
  onSelectWeek: (weekStart: CalendarDate) => void
}

// A real month calendar behind the week range (standup feedback): any day
// picks its whole Monday-to-Sunday week.
export function WeekPickerDialog({
  isOpen,
  onOpenChange,
  selectedWeek,
  onSelectWeek,
}: WeekPickerDialogProps) {
  const thisWeekStart = startOfWeekOf(todayCalendarDate())
  const [month, setMonth] = useState<Date>(() => fromCalendarDate(selectedWeek))

  const handleSelect = (weekStart: CalendarDate) => {
    onSelectWeek(weekStart)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="p-4 sm:max-w-md sm:p-6">
        <DialogHeader>
          <DialogTitle>Vybrat týden</DialogTitle>
          <DialogDescription>Klepnutím na den vyberete celý jeho týden.</DialogDescription>
        </DialogHeader>

        <Calendar
          locale={cs}
          weekStartsOn={1}
          month={month}
          onMonthChange={setMonth}
          onDayClick={(day) => handleSelect(startOfWeekOf(toCalendarDate(day)))}
          modifiers={{ selectedWeek: daysOfWeek(selectedWeek).map(fromCalendarDate) }}
          modifiersClassNames={{
            selectedWeek: "rounded-md bg-secondary text-secondary-foreground",
          }}
          // 44 px cells: a touch target on a phone (DESIGN.md).
          className="mx-auto p-0 [--cell-size:--spacing(11)]"
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={selectedWeek === thisWeekStart}
            onClick={() => handleSelect(thisWeekStart)}
          >
            Tento týden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
