import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import {
  Calendar,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Undo2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
import { MoveTrainingDialog } from "@/features/week/components/MoveTrainingDialog"
import { SkipTrainingDialog } from "@/features/week/components/SkipTrainingDialog"
import { useUndoSkip } from "@/features/week/hooks/useSkipTraining"

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

// A skip can be taken back until the training's week is over (#75).
function UndoSkipButton({ training, heading }: { training: WeekTraining; heading: string }) {
  const undoSkip = useUndoSkip(training.id)

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-11"
      aria-label={`Vrátit přeskočení tréninku ${heading}`}
      disabled={undoSkip.isPending}
      onClick={() => undoSkip.mutate()}
    >
      <Undo2 className="size-4" />
      Vrátit
    </Button>
  )
}

type WeekTrainingCardProps = {
  training: WeekTraining
  today: CalendarDate
}

function WeekTrainingCard({ training, today }: WeekTrainingCardProps) {
  const [isMoveOpen, setIsMoveOpen] = useState(false)
  const [isSkipOpen, setIsSkipOpen] = useState(false)
  const titles = training.exercises.map((exercise) => exercise.title)
  const isPlanned = training.status === "PLANNED"
  const canUndoSkip =
    training.status === "SKIPPED" && startOfWeekOf(training.date) >= startOfWeekOf(today)
  const heading = `${training.dog.name} · ${training.goal.title}`

  return (
    <li className="relative overflow-hidden rounded-lg border border-border bg-card py-3 pr-3 pl-4 transition-colors has-[a:hover]:border-foreground/30">
      {/* The dog's colour tells the dogs apart, as in the day strip above. */}
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-1", dogColorClass(training.dog.color))}
      />
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-medium text-foreground">
          {isPlanned ? (
            // The link covers the whole card (::after), so the card still opens
            // the walkthrough (#76); the actions below sit on top of it.
            <Link
              to="/trainings/$trainingId"
              params={{ trainingId: training.id }}
              className="outline-hidden transition-colors after:absolute after:inset-0 after:rounded-lg hover:text-primary focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
              aria-label={`Trénink ${heading}`}
            >
              {heading}
            </Link>
          ) : (
            heading
          )}
        </h3>
        <Badge
          variant={isPlanned ? "secondary" : "outline"}
          className={cn(
            "shrink-0 font-mono text-xs font-semibold tracking-wider uppercase",
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
      {isPlanned ? (
        <>
          <div className="relative mt-3 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              aria-label={`Přesunout trénink ${heading}`}
              onClick={() => setIsMoveOpen(true)}
            >
              <CalendarClock className="size-4" />
              Přesunout
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              aria-label={`Přeskočit trénink ${heading}`}
              onClick={() => setIsSkipOpen(true)}
            >
              <SkipForward className="size-4" />
              Přeskočit
            </Button>
          </div>
          <MoveTrainingDialog
            training={training}
            isOpen={isMoveOpen}
            onOpenChange={setIsMoveOpen}
          />
          <SkipTrainingDialog
            training={training}
            isOpen={isSkipOpen}
            onOpenChange={setIsSkipOpen}
          />
        </>
      ) : null}
      {canUndoSkip ? (
        <div className="mt-3 flex gap-2">
          <UndoSkipButton
            training={training}
            heading={heading}
          />
        </div>
      ) : null}
    </li>
  )
}

type WeekViewProps = {
  weekStart: CalendarDate
  today: CalendarDate
  onWeekChange: (weekStart: CalendarDate) => void
}

export function WeekView({ weekStart, today, onWeekChange }: WeekViewProps) {
  const days = daysOfWeek(weekStart)
  // Today when it is in the shown week, otherwise its Monday.
  const [selectedDay, setSelectedDay] = useState<CalendarDate>(
    days.includes(today) ? today : weekStart,
  )
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
        <p className="text-sm text-muted-foreground">
          Jednotlivé tréninky vašich psů. Na jednom cíli můžete pracovat v několika dnech.
        </p>
        {/* Week switching (#73): arrows a week back and forth, range opens month calendar */}
        <div className="flex items-center justify-between gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            aria-label="Předchozí týden"
            onClick={() => onWeekChange(addCalendarDays(weekStart, -7))}
          >
            <ChevronLeft className="size-5" />
          </Button>

          {/* The range opens a month calendar (standup feedback). */}
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 min-w-0 flex-1 gap-1.5 px-2 text-base font-semibold tracking-tight sm:gap-2 sm:text-lg"
            aria-label={`Vybrat týden, aktuálně ${formatWeekRange(weekStart)}`}
            onClick={() => setIsWeekPickerOpen(true)}
          >
            <span
              aria-live="polite"
              className="truncate"
            >
              {formatWeekRange(weekStart)}
            </span>
            <Calendar className="size-4 shrink-0 text-muted-foreground" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            aria-label="Další týden"
            onClick={() => onWeekChange(addCalendarDays(weekStart, 7))}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>

        {totalCount > 0 && (
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span id="week-progress-label">Týdenní postup</span>
              <span className="font-medium text-foreground">
                {completedCount} z {totalCount} odcvičeno
              </span>
            </div>
            <Progress
              value={Math.round((completedCount / totalCount) * 100)}
              aria-labelledby="week-progress-label"
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
                "data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground",
                day === today && "font-semibold text-primary",
              )}
            >
              <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
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
                      "size-2 rounded-full ring-1 ring-background",
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
                today={today}
              />
            ))}
          </ul>
        )}
      </section>

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
