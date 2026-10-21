import { api } from "@/lib/api-client"

import { planBlockSchema, type ExerciseFormValues, type PlanBlock } from "./dogSchemas"

// The API stores an empty instruction or criterion as "none", so the form
// values go over as they are.
export async function createPlanBlock(
  goalId: string,
  values: ExerciseFormValues,
): Promise<PlanBlock> {
  const json = await api.post(`goals/${goalId}/blocks`, { json: values }).json()
  return planBlockSchema.parse(json)
}
