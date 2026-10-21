import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"
import {
  isCalendarDate,
  startOfWeekOf,
  todayCalendarDate,
  type CalendarDate,
} from "@/lib/calendarDate"

import { WeekView } from "@/features/week/components/WeekView"

type WeekSearch = {
  // Monday of the shown week; missing means the current week (#73).
  tyden?: CalendarDate | undefined
}

export const Route = createFileRoute("/_ProtectedPages/week")({
  // Any day of a week opens that week; anything else falls back to this week.
  // The key is always returned: the parent route passes raw search params
  // through, and an omitted key would let an invalid "?tyden=" leak back in.
  validateSearch: (search: Record<string, unknown>): WeekSearch => ({
    tyden: isCalendarDate(search.tyden) ? startOfWeekOf(search.tyden) : undefined,
  }),
  component: WeekPage,
})

function WeekPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const today = todayCalendarDate()
  const currentWeek = startOfWeekOf(today)
  const weekStart = isCalendarDate(search.tyden) ? search.tyden : currentWeek

  // The current week keeps a clean URL; other weeks are in it, so a reload
  // or a shared link opens the same week.
  const showWeek = (nextWeekStart: CalendarDate) => {
    void navigate({
      search: nextWeekStart === currentWeek ? {} : { tyden: nextWeekStart },
    })
  }

  return (
    <>
      <Seo title="Týden" />
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-8">
        {/* Remount per week, so the selected day starts again from today or Monday. */}
        <WeekView
          key={weekStart}
          weekStart={weekStart}
          today={today}
          onWeekChange={showWeek}
        />
      </div>
    </>
  )
}
