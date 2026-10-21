import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"
import { addCalendarDays, type CalendarDate } from "@/lib/calendarDate"

export const weekTrainingSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["PLANNED", "COMPLETED", "SKIPPED"]),
  dog: z.object({ id: z.string(), name: z.string(), color: z.number() }),
  goal: z.object({ id: z.string(), title: z.string() }),
  exercises: z.array(z.object({ id: z.string(), title: z.string() })),
})

export type WeekTraining = z.infer<typeof weekTrainingSchema>

export const weekKeys = {
  all: ["week"] as const,
  week: (weekStart: CalendarDate) => [...weekKeys.all, weekStart] as const,
}

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
