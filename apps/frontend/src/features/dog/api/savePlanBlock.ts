import { api } from "@/lib/api-client"

import {
  planBlockSchema,
  planBlocksSchema,
  type ExerciseFormValues,
  type PlanBlock,
} from "./dogSchemas"

// Where a new exercise goes: an index in the plan, or the end when missing.
export type NewExercise = ExerciseFormValues & { insertAt?: number }

// The API stores an empty instruction or criterion as "none", so the form
// values go over as they are.
export async function createPlanBlock(goalId: string, input: NewExercise): Promise<PlanBlock> {
  const json = await api.post(`goals/${goalId}/blocks`, { json: input }).json()
  return planBlockSchema.parse(json)
}

export async function updatePlanBlock(
  blockId: string,
  values: ExerciseFormValues,
): Promise<PlanBlock> {
  const json = await api.patch(`blocks/${blockId}`, { json: values }).json()
  return planBlockSchema.parse(json)
}

export async function deletePlanBlock(blockId: string): Promise<void> {
  await api.delete(`blocks/${blockId}`)
}

export async function reorderPlanBlocks(goalId: string, blockIds: string[]): Promise<PlanBlock[]> {
  const json = await api.put(`goals/${goalId}/blocks/order`, { json: { blockIds } }).json()
  return planBlocksSchema.parse(json)
}
