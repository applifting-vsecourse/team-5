import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { QueryState } from "@/components/QueryState"
import { Button } from "@/components/ui/button"
import {
  addCalendarDays,
  daysOfWeek,
  formatDayOfMonth,
  formatWeekdayShort,
  formatWeekRange,
  type CalendarDate,
} from "@/lib/calendarDate"
import { dogColorClass } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

import { weekTrainingsQueryOptions } from "@/features/week/api/weekQueryOptions"

export function TodayWeekPreview({
  weekStart,
  today,
}: {
  weekStart: CalendarDate
  today: CalendarDate
}) {
  const [shownWeek, setShownWeek] = useState(weekStart)
  const query = useQuery(weekTrainingsQueryOptions(shownWeek))
  return (
    <section
      className="hidden min-w-0 space-y-4 rounded-card border border-border bg-card p-5 xl:col-start-1 xl:row-span-2 xl:row-start-2 xl:block"
      aria-labelledby="today-week-heading"
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <h2
            id="today-week-heading"
            className="text-section font-extrabold"
          >
            Tvůj týden
          </h2>
          <p className="text-xs text-muted-foreground">{formatWeekRange(shownWeek)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Předchozí týden"
          onClick={() => setShownWeek(addCalendarDays(shownWeek, -7))}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Další týden"
          onClick={() => setShownWeek(addCalendarDays(shownWeek, 7))}
        >
          <ChevronRight />
        </Button>
      </div>
      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={null}
      >
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek(shownWeek).map((day) => (
            <div
              key={day}
              className={cn("min-w-0 space-y-3 rounded-field p-2", day === today && "bg-accent")}
            >
              <div className={cn("text-center", day === today && "font-bold text-primary")}>
                <p className="text-xs">{formatWeekdayShort(day)}</p>
                <p className="text-lg font-extrabold">{formatDayOfMonth(day)}</p>
              </div>
              {query.data
                ?.filter((training) => training.date === day)
                .map((training) => (
                  <Link
                    key={training.id}
                    to="/trainings/$trainingId"
                    params={{ trainingId: training.id }}
                    className={cn(
                      "block space-y-1 rounded-control p-2 text-xs",
                      training.status === "COMPLETED"
                        ? "bg-success text-success-foreground"
                        : training.status === "SKIPPED"
                          ? "bg-warning text-warning-foreground"
                          : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    <span className="flex items-center gap-1 font-bold">
                      <span
                        aria-hidden
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          dogColorClass(training.dog.color),
                        )}
                      />
                      {training.dog.name}
                    </span>
                    <span className="block break-words">
                      {training.training?.title ?? training.goal.title}
                    </span>
                    <span className="block text-xs">
                      {training.status === "COMPLETED"
                        ? "✓ Hotovo"
                        : training.status === "SKIPPED"
                          ? "Přeskočeno"
                          : `${training.exercises.length} cviků`}
                    </span>
                  </Link>
                ))}
            </div>
          ))}
        </div>
      </QueryState>
      <Link
        to="/week"
        search={{ tyden: shownWeek }}
        className="inline-flex min-h-touch items-center text-sm font-bold text-primary"
      >
        Otevřít celý týden →
      </Link>
    </section>
  )
}
