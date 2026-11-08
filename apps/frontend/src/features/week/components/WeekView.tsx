import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Calendar, Ellipsis } from "lucide-react"

import { DesignIcon } from "@/components/DesignIcon"
import { EmptyState } from "@/components/EmptyState"
import { QueryState } from "@/components/QueryState"
import { StripCard } from "@/components/StripCard"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
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

import {
  weekMetricsQueryOptions,
  weekTrainingsQueryOptions,
  type WeekTraining,
} from "@/features/week/api/weekQueryOptions"
import { MoveTrainingDialog } from "@/features/week/components/MoveTrainingDialog"
import { WeekPickerDialog } from "@/features/week/components/WeekPickerDialog"
import { useUndoSkip } from "@/features/week/hooks/useSkipTraining"

function WeekTrainingCard({ training, today }: { training: WeekTraining; today: CalendarDate }) {
  const [isMoveOpen, setMoveOpen] = useState(false)
  const [isSkipOpen, setSkipOpen] = useState(false)
  const undo = useUndoSkip(training.id)
  const isPlanned = training.status === "PLANNED"
  const isTodayOrOverdue = training.date <= today
  const canUndo =
    training.status === "SKIPPED" && startOfWeekOf(training.date) >= startOfWeekOf(today)
  const title = training.training?.title ?? training.goal.title
  const heading = `${training.dog.name} · ${title}`
  const duration = training.exercises.every((exercise) => exercise.durationMinutes !== undefined)
    ? training.exercises.reduce((sum, exercise) => sum + (exercise.durationMinutes ?? 0), 0)
    : null
  const subtitle = [
    training.dog.name,
    duration ? `${isPlanned ? "" : "plán "}${duration} min` : null,
    training.successRate != null ? `${training.successRate} %` : null,
  ]
    .filter(Boolean)
    .join(" · ")
  return (
    <StripCard
      as="li"
      dogColor={training.dog.color}
      className="rounded-card"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 py-3 pr-3 pl-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold break-words">{title}</h3>
            {!isPlanned && (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  training.status === "COMPLETED"
                    ? "bg-success text-success-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                <DesignIcon name={training.status === "COMPLETED" ? "week-Check" : "week-X"} />
                {training.status === "COMPLETED" ? "Hotovo" : "Přeskočeno"}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {isPlanned ? (
          <Button
            asChild
            size="sm"
            variant={isTodayOrOverdue ? "default" : "secondary"}
            className={cn(
              "shrink-0 gap-1.5 rounded-field",
              !isTodayOrOverdue && "text-muted-foreground",
            )}
          >
            <Link
              to="/trainings/$trainingId"
              params={{ trainingId: training.id }}
              aria-label={`${isTodayOrOverdue ? "Začít trénink" : "Trénink"} ${heading}`}
            >
              <DesignIcon name={isTodayOrOverdue ? "week-Play" : "week-Cal"} />
              {isTodayOrOverdue ? "Začít" : "Naplánováno"}
            </Link>
          </Button>
        ) : training.activityId ? (
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="shrink-0 gap-1.5 rounded-field font-bold"
          >
            <Link
              to="/dogs/$dogId/activities/$activityId"
              params={{ dogId: training.dog.id, activityId: training.activityId }}
              aria-label={`Záznam tréninku ${heading}`}
            >
              <DesignIcon name="history-Msg1" />
              Záznam
            </Link>
          </Button>
        ) : null}
        {(isPlanned || canUndo) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Možnosti tréninku ${heading}`}
                className="shrink-0"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPlanned && (
                <>
                  <DropdownMenuItem onSelect={() => setMoveOpen(true)}>
                    Přesunout trénink
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setSkipOpen(true)}>
                    Přeskočit trénink
                  </DropdownMenuItem>
                </>
              )}
              {canUndo && (
                <DropdownMenuItem
                  disabled={undo.isPending}
                  onSelect={() => undo.mutate()}
                >
                  Vrátit přeskočení
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <MoveTrainingDialog
        training={training}
        isOpen={isMoveOpen || isSkipOpen}
        initialAction={isSkipOpen ? "skip" : "move"}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setMoveOpen(false)
            setSkipOpen(false)
          }
        }}
      />
    </StripCard>
  )
}

export function WeekView({
  weekStart,
  today,
  onWeekChange,
}: {
  weekStart: CalendarDate
  today: CalendarDate
  onWeekChange: (weekStart: CalendarDate) => void
}) {
  const days = daysOfWeek(weekStart)
  const [selectedDay, setSelectedDay] = useState<CalendarDate>(
    days.includes(today) ? today : weekStart,
  )
  const [isPickerOpen, setPickerOpen] = useState(false)
  const query = useQuery(weekTrainingsQueryOptions(weekStart))
  const metrics = useQuery(weekMetricsQueryOptions(weekStart))
  const trainings = query.data ?? []
  const completed = trainings.filter((training) => training.status === "COMPLETED").length
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-page font-extrabold tracking-tight">Tento týden</h1>
          <Button
            variant="ghost"
            className="h-auto min-h-touch max-w-full justify-start px-0 text-xs font-normal text-muted-foreground"
            aria-label={`Vybrat týden, aktuálně ${formatWeekRange(weekStart)}`}
            onClick={() => setPickerOpen(true)}
          >
            <span className="break-words whitespace-normal">
              {formatWeekRange(weekStart)} · {completed} z {trainings.length} tréninků
            </span>
          </Button>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Předchozí týden"
          className="shrink-0 rounded-field bg-card"
          onClick={() => onWeekChange(addCalendarDays(weekStart, -7))}
        >
          <DesignIcon name="week-ChevL" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Další týden"
          className="shrink-0 rounded-field bg-card"
          onClick={() => onWeekChange(addCalendarDays(weekStart, 7))}
        >
          <DesignIcon name="week-ChevR" />
        </Button>
      </header>
      <ToggleGroup
        type="single"
        spacing={1.5}
        value={selectedDay}
        onValueChange={(value) => {
          if (value) {
            setSelectedDay(value)
            const target = document.getElementById(`day-${value}`)
            target?.scrollIntoView({
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
              block: "start",
            })
            target?.focus({ preventScroll: true })
          }
        }}
        aria-label="Den v týdnu"
        className="grid w-full grid-cols-7 gap-1.5"
      >
        {days.map((day) => {
          const dayTrainings = trainings.filter((training) => training.date === day)
          const colors = [...new Set(dayTrainings.map((training) => training.dog.color))]
          return (
            <ToggleGroupItem
              key={day}
              value={day}
              aria-label={`${formatDayLong(day)}${day === today ? ", dnes" : ""}${dayTrainings.length ? `, tréninků: ${dayTrainings.length}` : ""}`}
              className="flex h-auto min-h-20 min-w-0 flex-col gap-1 rounded-control border border-border bg-card px-0 py-2 text-foreground data-[state=on]:bg-hero data-[state=on]:text-hero-foreground"
            >
              <span className="text-xs font-medium opacity-75">{formatWeekdayShort(day)}</span>
              <span className="text-lg font-extrabold">{formatDayOfMonth(day)}</span>
              <span
                aria-hidden
                className="flex h-1.5 items-center justify-center gap-1"
              >
                {colors.map((color) => (
                  <span
                    key={color}
                    className={cn("size-1.5 rounded-full", dogColorClass(color))}
                  />
                ))}
              </span>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
      <QueryState
        isLoading={metrics.isLoading}
        error={metrics.error}
        onRetry={() => void metrics.refetch()}
        empty={null}
      >
        {metrics.data?.weeklyPlannedSessions != null && (
          <section
            className="space-y-2 rounded-card border border-border bg-card p-4"
            aria-label="Týdenní plán"
          >
            <div className="flex items-center justify-between gap-3 text-sm font-bold">
              <h2>Týdenní plán</h2>
              <span className="text-primary">
                {metrics.data.weeklyPlannedSessions > 0
                  ? `${metrics.data.weeklyCompletedSessions ?? 0} / ${metrics.data.weeklyPlannedSessions}`
                  : "Bez plánu"}
              </span>
            </div>
            <Progress
              value={Math.min(
                100,
                metrics.data.weeklyPlannedSessions > 0
                  ? ((metrics.data.weeklyCompletedSessions ?? 0) /
                      metrics.data.weeklyPlannedSessions) *
                      100
                  : 0,
              )}
              aria-label="Dokončené naplánované tréninky"
              className="h-2"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {metrics.data.weeklyPlannedSessions === 0
                ? "Na tento týden zatím nemáš naplánované tréninky."
                : `Hotové ${metrics.data.weeklyCompletedSessions ?? 0} z ${metrics.data.weeklyPlannedSessions} naplánovaných tréninků. Přeskočené: ${metrics.data.weeklySkippedSessions ?? 0}.`}
            </p>
          </section>
        )}
      </QueryState>
      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        errorTitle="Týden se nepodařilo načíst"
        empty={null}
        className="flex flex-col gap-6"
      >
        {!trainings.length && (
          <EmptyState
            icon={Calendar}
            titleAs="p"
            title="Na tento týden nemáte nic naplánováno"
            description="Vytvoř psovi cíl a naplánuj trénink."
            action={
              <Button asChild>
                <Link to="/dogs">Přejít na psy</Link>
              </Button>
            }
          />
        )}
        <div className="flex flex-col gap-6">
          {days.map((day) => {
            const dayTrainings = trainings.filter((training) => training.date === day)
            return (
              <section
                key={day}
                aria-labelledby={`day-${day}`}
                className="flex flex-col gap-2"
              >
                <h2
                  id={`day-${day}`}
                  tabIndex={-1}
                  className={cn(
                    "scroll-mt-4 text-xs font-extrabold tracking-wide uppercase outline-none",
                    day === today ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {formatDayLong(day)}
                  {day === today && (
                    <span className="ml-2 rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                      Dnes
                    </span>
                  )}
                </h2>
                {dayTrainings.length ? (
                  <ul className="flex flex-col gap-2">
                    {dayTrainings.map((training) => (
                      <WeekTrainingCard
                        key={training.id}
                        training={training}
                        today={today}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="flex items-center gap-2 rounded-card border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                    <DesignIcon name="week-Moon" />
                    Volný den – odpočinek je taky trénink.
                  </p>
                )}
              </section>
            )
          })}
        </div>
      </QueryState>
      <WeekPickerDialog
        isOpen={isPickerOpen}
        onOpenChange={setPickerOpen}
        selectedWeek={weekStart}
        onSelectWeek={onWeekChange}
      />
    </div>
  )
}
