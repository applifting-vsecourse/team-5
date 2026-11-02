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
export async function createPlanBlock(
  goalId: string,
  input: NewExercise,
  replyToActivityId?: string,
): Promise<PlanBlock> {
  const json = await api
    .post(`goals/${goalId}/blocks`, { json: { ...input, replyToActivityId } })
    .json()
  return planBlockSchema.parse(json)
}

export async function updatePlanBlock(
  blockId: string,
  values: ExerciseFormValues,
  replyToActivityId?: string,
): Promise<PlanBlock> {
  const json = await api
    .patch(`blocks/${blockId}`, { json: { ...values, replyToActivityId } })
    .json()
  return planBlockSchema.parse(json)
}

export async function deletePlanBlock(blockId: string, replyToActivityId?: string): Promise<void> {
  await api.delete(`blocks/${blockId}`, {
    searchParams: replyToActivityId ? { replyToActivityId } : {},
  })
}

export async function reorderPlanBlocks(
  goalId: string,
  blockIds: string[],
  replyToActivityId?: string,
): Promise<PlanBlock[]> {
  const json = await api
    .put(`goals/${goalId}/blocks/order`, { json: { blockIds, replyToActivityId } })
    .json()
  return planBlocksSchema.parse(json)
}
