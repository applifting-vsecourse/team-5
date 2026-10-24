import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProgressBar } from "@/components/ui/progress-bar"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  addCalendarDays,
  daysOfWeek,
  formatDayLong,
  formatDayOfMonth,
  formatWeekdayShort,
  formatWeekRange,
  startOfWeekOf,
  type CalendarDate,
} from "@/lib/calendarDate"
import { dogColorClass } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

import { weekTrainingsQueryOptions, type WeekTraining } from "@/features/week/api/weekQueryOptions"
import { WeekPickerDialog } from "./WeekPickerDialog"

const STATUS_LABELS: Record<WeekTraining["status"], string> = {
  PLANNED: "Naplánováno",
  COMPLETED: "Odcvičeno",
  SKIPPED: "Přeskočeno",
}

// 1 cvik, 2–4 cviky, 5 cviků.
const exerciseCount = (count: number): string => {
  if (count === 1) return "1 cvik"
  if (count >= 2 && count <= 4) return `${count} cviky`
  return `${count} cviků`
}

function WeekTrainingCard({
  training,
  onClick,
}: {
  training: WeekTraining
  onClick?: () => void
}) {
  const titles = training.exercises.map((exercise) => exercise.title)

  return (
    <li className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-150 hover:border-foreground/30 active:scale-[0.99]">
      {/* The dog's colour tells the dogs apart, as in the day strip above. */}
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-1", dogColorClass(training.dog.color))}
      />
      <button
        type="button"
        onClick={onClick}
        className="w-full py-3 pr-3 pl-4 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-medium text-foreground transition-colors group-hover:text-primary">
            {training.dog.name} · {training.goal.title}
          </h3>
          <Badge
            variant={training.status === "PLANNED" ? "secondary" : "outline"}
            className={cn(
              "shrink-0 font-mono text-[11px] font-semibold tracking-wider uppercase",
              training.status === "COMPLETED" && "border-primary/40 bg-primary/10 text-primary",
            )}
          >
            {STATUS_LABELS[training.status]}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {titles.length === 0
            ? "Plán zatím nemá žádný cvik."
            : `${exerciseCount(titles.length)} · ${titles.join(", ")}`}
        </p>
      </button>
    </li>
  )
}

type WeekViewProps = {
  weekStart: CalendarDate
  today: CalendarDate
  onWeekChange: (weekStart: CalendarDate) => void
}

export function WeekView({ weekStart, today, onWeekChange }: WeekViewProps) {
  const currentWeek = startOfWeekOf(today)
  const days = daysOfWeek(weekStart)
  // Today when it is in the shown week, otherwise its Monday.
  const [selectedDay, setSelectedDay] = useState<CalendarDate>(
    days.includes(today) ? today : weekStart,
  )
  const [selectedTraining, setSelectedTraining] = useState<WeekTraining | null>(null)
  const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false)
  const weekQuery = useQuery(weekTrainingsQueryOptions(weekStart))

  const trainings = weekQuery.data ?? []
  const trainingsOf = (day: CalendarDate) => trainings.filter((training) => training.date === day)
  const selectedTrainings = trainingsOf(selectedDay)

  const completedCount = trainings.filter((t) => t.status === "COMPLETED").length
  const totalCount = trainings.length

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Týden</h1>
        {/* Week switching (#73): arrows a week back and forth, "Dnes" back to this week. */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Předchozí týden"
            onClick={() => onWeekChange(addCalendarDays(weekStart, -7))}
          >
            <ChevronLeft className="size-5" />
          </Button>

          <button
            type="button"
            onClick={() => setIsWeekPickerOpen(true)}
            className="group flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 text-center transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            aria-label={`Vybrat týden, aktuálně ${formatWeekRange(weekStart)}`}
          >
            <span
              className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary"
              aria-live="polite"
            >
              {formatWeekRange(weekStart)}
            </span>
            <Calendar className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Další týden"
            onClick={() => onWeekChange(addCalendarDays(weekStart, 7))}
          >
            <ChevronRight className="size-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            disabled={weekStart === currentWeek}
            onClick={() => onWeekChange(currentWeek)}
          >
            Dnes
          </Button>
        </div>

        {totalCount > 0 && (
          <div className="mt-3 flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Týdenní postup</span>
              <span className="font-medium text-foreground">
                {completedCount} z {totalCount} odcvičeno
              </span>
            </div>
            <ProgressBar
              value={completedCount}
              max={totalCount}
            />
          </div>
        )}
      </header>

      <ToggleGroup
        type="single"
        value={selectedDay}
        onValueChange={(value) => {
          // Radix sends "" when the selected day is clicked again; keep it.
          if (value) setSelectedDay(value)
        }}
        aria-label="Den v týdnu"
        className="grid w-full grid-cols-7 gap-0"
      >
        {days.map((day) => {
          const dogColors = [...new Set(trainingsOf(day).map((training) => training.dog.color))]
          return (
            <ToggleGroupItem
              key={day}
              value={day}
              aria-label={`${formatDayLong(day)}${day === today ? ", dnes" : ""}${
                dogColors.length > 0 ? `, tréninků: ${trainingsOf(day).length}` : ""
              }`}
              className={cn(
                "flex h-auto min-h-16 min-w-11 flex-col gap-1 rounded-md px-0 py-2 transition-all duration-150 select-none",
                "hover:bg-accent/40 active:scale-95",
                "data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground data-[state=on]:shadow-2xs",
                day === today && "font-semibold text-primary",
              )}
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {formatWeekdayShort(day)}
              </span>
              <span className="text-base font-bold">{formatDayOfMonth(day)}</span>
              {/* One dot per dog that trains that day (#72). */}
              <span
                aria-hidden="true"
                className="flex h-2 items-center gap-1"
              >
                {dogColors.map((color) => (
                  <span
                    key={color}
                    className={cn(
                      "size-2 rounded-full shadow-2xs ring-1 ring-background",
                      dogColorClass(color),
                    )}
                  />
                ))}
              </span>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>

      <section
        aria-labelledby="selected-day-heading"
        className="flex flex-col gap-3"
      >
        <h2
          id="selected-day-heading"
          className="text-xs tracking-widest text-muted-foreground uppercase"
        >
          {formatDayLong(selectedDay)}
          {selectedDay === today ? " · dnes" : ""}
        </h2>

        {weekQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : weekQuery.error ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Týden se nepodařilo načíst.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => void weekQuery.refetch()}
            >
              Zkusit znovu
            </Button>
          </div>
        ) : trainings.length === 0 ? (
          // Nothing in the whole week: say what to do next (#72).
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center sm:p-12">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Calendar className="size-6" />
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Na tento týden nemáte nic naplánováno. Založte psovi cíl a naplánujte trénink, nebo
              počkejte, až vám ho zadá trenér.
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-4 min-h-11"
            >
              <Link to="/dogs">Přejít na psy</Link>
            </Button>
          </div>
        ) : selectedTrainings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Calendar className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">Na tento den nemáte nic naplánováno.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedTrainings.map((training) => (
              <WeekTrainingCard
                key={training.id}
                training={training}
                onClick={() => setSelectedTraining(training)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Workout Session / Training Preview Dialog */}
      <Dialog
        open={selectedTraining !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedTraining(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          {selectedTraining && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-3 rounded-full ring-2 ring-background",
                      dogColorClass(selectedTraining.dog.color),
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    {selectedTraining.dog.name}
                  </span>
                  <Badge
                    variant={selectedTraining.status === "PLANNED" ? "secondary" : "outline"}
                    className={cn(
                      "ml-auto font-mono text-[11px] font-semibold tracking-wider uppercase",
                      selectedTraining.status === "COMPLETED" &&
                        "border-primary/40 bg-primary/10 text-primary",
                    )}
                  >
                    {STATUS_LABELS[selectedTraining.status]}
                  </Badge>
                </div>
                <DialogTitle className="mt-1 text-xl font-bold tracking-tight">
                  {selectedTraining.goal.title}
                </DialogTitle>
                <DialogDescription>
                  Trénink naplánovaný na {formatDayLong(selectedTraining.date)}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cviky v tréninku ({selectedTraining.exercises.length})
                </div>
                {selectedTraining.exercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tento plán zatím nemá žádný cvik.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedTraining.exercises.map((exercise, idx) => (
                      <li
                        key={exercise.id}
                        className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-2xs"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-bold text-secondary-foreground">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block font-medium text-foreground">{exercise.title}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => setSelectedTraining(null)}
                >
                  Zavřít
                </Button>
                <Button
                  type="button"
                  asChild
                  className="min-h-11"
                >
                  <Link
                    to="/dogs/$dogId/goals/$goalId"
                    params={{
                      dogId: selectedTraining.dog.id,
                      goalId: selectedTraining.goal.id,
                    }}
                  >
                    Otevřít plán cíle
                  </Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Month Calendar Week Picker Dialog */}
      <WeekPickerDialog
        isOpen={isWeekPickerOpen}
        onOpenChange={setIsWeekPickerOpen}
        selectedWeek={weekStart}
        onSelectWeek={onWeekChange}
      />
    </div>
  )
}
