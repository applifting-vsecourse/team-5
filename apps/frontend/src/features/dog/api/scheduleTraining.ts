import { api } from "@/lib/api-client"
import type { CalendarDate } from "@/lib/calendarDate"

import { trainingSchema, type Training } from "./dogSchemas"

export async function scheduleTraining(goalId: string, date: CalendarDate): Promise<Training> {
  const json = await api.post(`goals/${goalId}/trainings`, { json: { date } }).json()
  return trainingSchema.parse(json)
}
