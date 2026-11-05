import type { CalendarDate } from "@/lib/calendarDate"

import type { WeekTraining } from "@/features/week/api/weekQueryOptions"

/** Next planned training on or after today (stable: date, dog name, id). */
export function pickNextTraining(
  trainings: WeekTraining[],
  today: CalendarDate,
): WeekTraining | null {
  const planned = trainings
    .filter((training) => training.status === "PLANNED" && training.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.dog.name.localeCompare(b.dog.name, "cs") ||
        a.id.localeCompare(b.id),
    )
  return planned[0] ?? null
}
