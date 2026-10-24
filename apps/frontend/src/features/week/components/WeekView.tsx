import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

function WeekTrainingCard({ training }: { training: WeekTraining }) {
  const titles = training.exercises.map((exercise) => exercise.title)

  const cardContent = (
    <>
      {/* The dog's colour tells the dogs apart, as in the day strip above. */}
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-1", dogColorClass(training.dog.color))}
      />
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-medium text-foreground transition-colors group-hover:text-primary">
          {training.dog.name} · {training.goal.title}
        </h3>
        <Badge
          variant={training.status === "PLANNED" ? "secondary" : "outline"}
          className="shrink-0"
        >
          {STATUS_LABELS[training.status]}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {titles.length === 0
          ? "Plán zatím nemá žádný cvik."
          : `${exerciseCount(titles.length)} · ${titles.join(", ")}`}
      </p>
    </>
  )

  if (training.status === "PLANNED") {
    return (
      <li className="relative">
        <Link
          to="/trainings/$trainingId"
          params={{ trainingId: training.id }}
          className="group block overflow-hidden rounded-lg border border-border bg-card py-3 pr-3 pl-4 outline-hidden transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Trénink ${training.dog.name} · ${training.goal.title}`}
        >
          {cardContent}
        </Link>
      </li>
    )
  }

  return (
    <li className="relative overflow-hidden rounded-lg border border-border bg-card py-3 pr-3 pl-4">
      {cardContent}
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
  const weekQuery = useQuery(weekTrainingsQueryOptions(weekStart))

  const trainings = weekQuery.data ?? []
  const trainingsOf = (day: CalendarDate) => trainings.filter((training) => training.date === day)
  const selectedTrainings = trainingsOf(selectedDay)

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
          <p
            className="flex-1 text-center text-lg font-semibold tracking-tight text-foreground"
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
                "flex h-auto min-h-16 min-w-11 flex-col gap-1 rounded-md px-0 py-2 data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground",
                day === today && "font-semibold text-primary",
              )}
            >
              <span className="text-xs">{formatWeekdayShort(day)}</span>
              <span className="text-base">{formatDayOfMonth(day)}</span>
              {/* One dot per dog that trains that day (#72). */}
              <span
                aria-hidden="true"
                className="flex h-2 items-center gap-1"
              >
                {dogColors.map((color) => (
                  <span
                    key={color}
                    className={cn("size-2 rounded-full", dogColorClass(color))}
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
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Na tento týden nemáte nic naplánováno. Založte psovi cíl a naplánujte trénink, nebo
              počkejte, až vám ho zadá trenér.
            </p>
            <Button
              asChild
              variant="outline"
              className="min-h-11"
            >
              <Link to="/dogs">Přejít na psy</Link>
            </Button>
          </div>
        ) : selectedTrainings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Na tento den nemáte nic naplánováno.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedTrainings.map((training) => (
              <WeekTrainingCard
                key={training.id}
                training={training}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
