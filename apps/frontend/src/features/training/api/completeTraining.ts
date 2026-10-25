import { api } from "@/lib/api-client"

import {
  completedActivitySchema,
  type CompletedActivity,
  type CompleteTrainingInput,
} from "./trainingSchemas"

export async function completeTraining(
  trainingId: string,
  input: CompleteTrainingInput,
): Promise<CompletedActivity> {
  const json = await api
    .post(`trainings/${trainingId}/complete`, {
      json: input,
    })
    .json()
  return completedActivitySchema.parse(json)
}
