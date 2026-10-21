import { api } from "@/lib/api-client"

import { dogGoalSchema, type DogGoal, type GoalFormValues } from "./dogSchemas"

// The API stores an empty discipline or principle as "none", so the form
// values go over as they are.
export async function createGoal(dogId: string, values: GoalFormValues): Promise<DogGoal> {
  const json = await api.post(`dogs/${dogId}/goals`, { json: values }).json()
  return dogGoalSchema.parse(json)
}

export async function updateGoal(goalId: string, values: GoalFormValues): Promise<DogGoal> {
  const json = await api.patch(`goals/${goalId}`, { json: values }).json()
  return dogGoalSchema.parse(json)
}
