import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"
import { startOfWeekOf, todayCalendarDate } from "@/lib/calendarDate"

import { WeekView } from "@/features/week/components/WeekView"

export const Route = createFileRoute("/_ProtectedPages/week")({
  component: WeekPage,
})

function WeekPage() {
  const today = todayCalendarDate()

  return (
    <>
      <Seo title="Týden" />
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-8">
        <WeekView
          weekStart={startOfWeekOf(today)}
          today={today}
        />
      </div>
    </>
  )
}
