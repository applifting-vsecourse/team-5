import { z } from "zod"

import { api } from "@/lib/api-client"
import type { CalendarDate } from "@/lib/calendarDate"

const movedTrainingSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  dogId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type MovedTraining = z.infer<typeof movedTrainingSchema>

// Puts a planned training on another day, in any week (#74).
export async function moveTraining(trainingId: string, date: CalendarDate): Promise<MovedTraining> {
  const json = await api.patch(`trainings/${trainingId}`, { json: { date } }).json()
  return movedTrainingSchema.parse(json)
}
