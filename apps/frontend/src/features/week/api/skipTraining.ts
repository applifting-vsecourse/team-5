import { z } from "zod"

import { api } from "@/lib/api-client"

const skippedTrainingSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  dogId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["PLANNED", "COMPLETED", "SKIPPED"]),
})

export type SkippedTraining = z.infer<typeof skippedTrainingSchema>

// Skips a planned training; the dog's Activities get a "skipped" record (#75).
export async function skipTraining(trainingId: string): Promise<SkippedTraining> {
  const json = await api.post(`trainings/${trainingId}/skip`).json()
  return skippedTrainingSchema.parse(json)
}

// Takes the skip back, possible until the training's week is over (#75).
export async function undoSkip(trainingId: string): Promise<SkippedTraining> {
  const json = await api.delete(`trainings/${trainingId}/skip`).json()
  return skippedTrainingSchema.parse(json)
}
