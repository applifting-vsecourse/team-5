import type { CalendarDate } from "@/lib/calendarDate"

// The week (#72) shows trainings together with their goal and exercises, so
// changes made on a dog's screens must refresh it too. The key lives here,
// not in features/week, because feature folders may not import each other.
export const weekKeys = {
  all: ["week"] as const,
  week: (weekStart: CalendarDate) => [...weekKeys.all, weekStart] as const,
}
