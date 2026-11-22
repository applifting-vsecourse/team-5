import type { CalendarDate } from "@/lib/calendarDate"

import type { WeekTraining } from "@/features/week/api/weekQueryOptions"

const bySchedule = (a: WeekTraining, b: WeekTraining): number =>
  a.date.localeCompare(b.date) ||
  a.dog.name.localeCompare(b.dog.name, "cs") ||
  a.id.localeCompare(b.id)

/**
 * Next unfinished planned training for dog cards / week hints:
 * prefer today/future, else oldest overdue. Stable order: date, dog name, id.
 * Called from TodayView dog cards (not the hero).
 */
export function pickNextTraining(
  trainings: WeekTraining[],
  today: CalendarDate,
): WeekTraining | null {
  const planned = trainings.filter((training) => training.status === "PLANNED")
  const upcoming = planned.filter((training) => training.date >= today).sort(bySchedule)
  if (upcoming[0]) return upcoming[0]
  const overdue = planned.filter((training) => training.date < today).sort(bySchedule)
  return overdue[0] ?? null
}

/**
 * Dnes hero only: today's plan or oldest overdue — never a future day.
 * Called from TodayView hero; future sessions stay on dog cards / Týden.
 */
export function pickTodayHeroTraining(
  trainings: WeekTraining[],
  today: CalendarDate,
): WeekTraining | null {
  const planned = trainings.filter((training) => training.status === "PLANNED")
  const todayPlan = planned.filter((training) => training.date === today).sort(bySchedule)
  if (todayPlan[0]) return todayPlan[0]
  const overdue = planned.filter((training) => training.date < today).sort(bySchedule)
  return overdue[0] ?? null
}
