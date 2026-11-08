import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"
import { addCalendarDays, type CalendarDate } from "@/lib/calendarDate"
import { weekKeys } from "@/lib/weekKeys"

export const weekTrainingSchema = z.object({
  successRate: z.number().nullable().optional(),
  training: z
    .object({
      id: z.string(),
      title: z.string(),
      position: z.number().optional(),
      total: z.number().optional(),
    })
    .optional(),
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["PLANNED", "COMPLETED", "SKIPPED"]),
  dog: z.object({ id: z.string(), name: z.string(), color: z.number() }),
  goal: z.object({
    id: z.string(),
    title: z.string(),
    discipline: z.string().nullable().optional(),
  }),
  exercises: z.array(
    z.object({ id: z.string(), title: z.string(), durationMinutes: z.number().optional() }),
  ),
})

export type WeekTraining = z.infer<typeof weekTrainingSchema>

export function weekMetricsQueryOptions(weekStart: CalendarDate) {
  return queryOptions({
    queryKey: [...weekKeys.week(weekStart), "metrics"],
    queryFn: async () =>
      z
        .object({
          weeklyTarget: z.number(),
          weeklyTrainedDays: z.number(),
          weeklyPlannedSessions: z.number().optional(),
          weeklyCompletedSessions: z.number().optional(),
          weeklySkippedSessions: z.number().optional(),
        })
        .parse(
          await api
            .get("overview/week-metrics", {
              searchParams: { from: weekStart, to: addCalendarDays(weekStart, 6) },
            })
            .json(),
        ),
  })
}

export { weekKeys }

// All of the owner's trainings from Monday to Sunday of one week (#72).
export function weekTrainingsQueryOptions(weekStart: CalendarDate) {
  return queryOptions({
    queryKey: weekKeys.week(weekStart),
    queryFn: async () => {
      const json = await api
        .get("trainings", {
          searchParams: { from: weekStart, to: addCalendarDays(weekStart, 6) },
        })
        .json()
      return z.array(weekTrainingSchema).parse(json)
    },
  })
}

/** Up to 42 days of trainings for Dnes “next” beyond the current week. */
export function upcomingTrainingsQueryOptions(from: CalendarDate) {
  const to = addCalendarDays(from, 41)
  return queryOptions({
    queryKey: weekKeys.range(from, to),
    queryFn: async () => {
      const json = await api
        .get("trainings", {
          searchParams: { from, to },
        })
        .json()
      return z.array(weekTrainingSchema).parse(json)
    },
  })
}
