import { useState } from "react"
import { addMonths, isSameMonth, subMonths } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  daysOfWeek,
  formatDayOfMonth,
  formatMonthYear,
  formatWeekRange,
  fromCalendarDate,
  getMonthWeeks,
  startOfWeekOf,
  todayCalendarDate,
  type CalendarDate,
} from "@/lib/calendarDate"
import { cn } from "@/lib/utils"

type WeekPickerDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  selectedWeek: CalendarDate
  onSelectWeek: (weekStart: CalendarDate) => void
}

export function WeekPickerDialog({
  isOpen,
  onOpenChange,
  selectedWeek,
  onSelectWeek,
}: WeekPickerDialogProps) {
  const today = todayCalendarDate()
  const thisWeekStart = startOfWeekOf(today)

  // Start navigation on the month of the selected week
  const [currentMonth, setCurrentMonth] = useState<Date>(() => fromCalendarDate(selectedWeek))

  const weeks = getMonthWeeks(currentMonth)

  const handleSelect = (weekStart: CalendarDate) => {
    onSelectWeek(weekStart)
    onOpenChange(false)
  }

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))
  const handleToday = () => {
    const todayDate = fromCalendarDate(today)
    setCurrentMonth(todayDate)
    handleSelect(thisWeekStart)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="p-4 sm:max-w-md sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <CalendarIcon className="size-5 text-primary" />
            Vybrat týden
          </DialogTitle>
          <DialogDescription>
            Kliknutím na libovolný řádek vyberete celý týden (pondělí až neděle).
          </DialogDescription>
        </DialogHeader>

        {/* Month Navigation Header */}
        <div className="mt-2 flex items-center justify-between gap-2 border-b border-border pb-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label="Předchozí měsíc"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="size-5" />
          </Button>

          <span className="text-base font-semibold text-foreground">
            {formatMonthYear(currentMonth)}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label="Další měsíc"
            onClick={handleNextMonth}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>

        {/* Weekday column headers */}
        <div className="mt-2 grid grid-cols-7 gap-1 text-center">
          {["Po", "Út", "St", "Čt", "Pá", "So", "Ne"].map((dayName) => (
            <span
              key={dayName}
              className="py-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
            >
              {dayName}
            </span>
          ))}
        </div>

        {/* Week rows */}
        <div className="flex flex-col gap-1">
          {weeks.map((weekStartItem) => {
            const isSelected = weekStartItem === selectedWeek
            const isThisWeek = weekStartItem === thisWeekStart
            const days = daysOfWeek(weekStartItem)

            return (
              <button
                key={weekStartItem}
                type="button"
                onClick={() => handleSelect(weekStartItem)}
                className={cn(
                  "group grid min-h-10 grid-cols-7 items-center gap-1 rounded-md px-1 py-1 text-center transition-all duration-150 select-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden",
                  isSelected
                    ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                    : isThisWeek
                      ? "border border-primary/30 bg-secondary/80 text-foreground hover:bg-secondary"
                      : "text-foreground hover:bg-accent/60 active:scale-[0.99]",
                )}
                aria-label={`Týden ${formatWeekRange(weekStartItem)}${
                  isThisWeek ? ", tento týden" : ""
                }${isSelected ? ", vybráno" : ""}`}
              >
                {days.map((day) => {
                  const isInMonth = isSameMonth(fromCalendarDate(day), currentMonth)
                  const isDayToday = day === today
                  return (
                    <span
                      key={day}
                      className={cn(
                        "relative flex size-8 items-center justify-center rounded-sm text-xs",
                        !isInMonth && (isSelected ? "opacity-50" : "text-muted-foreground/35"),
                        isDayToday &&
                          !isSelected &&
                          "font-bold text-primary underline decoration-primary underline-offset-2",
                      )}
                    >
                      {formatDayOfMonth(day)}
                    </span>
                  )
                })}
              </button>
            )
          })}
        </div>

        {/* Quick jump to Current Week / Today */}
        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10"
            disabled={selectedWeek === thisWeekStart}
            onClick={handleToday}
          >
            Tento týden
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-10"
            onClick={() => onOpenChange(false)}
          >
            Zavřít
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
