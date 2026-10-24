import { useState } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  addCalendarDays,
  daysOfWeek,
  formatDayLong,
  formatDayOfMonth,
  formatWeekdayShort,
  formatWeekRange,
  startOfWeekOf,
  todayCalendarDate,
  type CalendarDate,
} from "@/lib/calendarDate"

export type DayPickerProps = {
  // The day picked when the picker opens; today by default.
  initialDay?: CalendarDate
  // A day that cannot be picked besides the past, e.g. the day a training
  // is on now when it is being moved (#74).
  unavailableDay?: CalendarDate
  hint: string
  isPending: boolean
  submitLabel: (day: CalendarDate) => string
  onPick: (day: CalendarDate) => Promise<void>
}

// One day of any week from today on: week arrows, seven days, one button.
// Meant for dialog content, which mounts on every opening, so the picker
// always starts again from the initial day (#71, #74).
export function DayPicker({
  initialDay,
  unavailableDay,
  hint,
  isPending,
  submitLabel,
  onPick,
}: DayPickerProps) {
  const today = todayCalendarDate()
  const currentWeek = startOfWeekOf(today)
  const [selected, setSelected] = useState<CalendarDate>(initialDay ?? today)
  const [weekStart, setWeekStart] = useState(startOfWeekOf(selected))

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
              disabled={day < today || day === unavailableDay}
              aria-label={formatDayLong(day)}
              className="flex h-auto min-h-14 min-w-11 flex-col gap-0 rounded-md border border-transparent px-0 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[today=true]:border-border"
              data-today={day === today}
            >
              <span className="text-xs">{formatWeekdayShort(day)}</span>
              <span className="text-base font-medium">{formatDayOfMonth(day)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>

      <DialogFooter>
        <Button
          type="button"
          className="min-h-11 w-full"
          disabled={isPending}
          onClick={() => void onPick(selected)}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel(selected)}
        </Button>
      </DialogFooter>
    </>
  )
}
