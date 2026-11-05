import type { CalendarDate } from "@/lib/calendarDate"

import type { WeekTraining } from "@/features/week/api/weekQueryOptions"

/** Next unfinished planned training in the week (overdue first; stable: date, dog, id). */
export function pickNextTraining(
  trainings: WeekTraining[],
  _today: CalendarDate,
): WeekTraining | null {
  const planned = trainings
    .filter((training) => training.status === "PLANNED")
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.dog.name.localeCompare(b.dog.name, "cs") ||
        a.id.localeCompare(b.id),
    )
  return planned[0] ?? null
}
