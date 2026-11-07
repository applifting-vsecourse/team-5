import { z } from "zod"

import { api } from "@/lib/api-client"

export type CurrentStepAction = "advance" | "skip" | "back"

/** Minimal goal shape returned by POST /goals/:id/current-step/* (#66). */
export const movedGoalSchema = z.object({
  id: z.string(),
  dogId: z.string(),
  currentStepId: z.string().nullable(),
})

export type MovedGoal = z.infer<typeof movedGoalSchema>

export async function moveCurrentStep(
  goalId: string,
  action: CurrentStepAction,
): Promise<MovedGoal> {
  const json = await api.post(`goals/${goalId}/current-step/${action}`).json()
  return movedGoalSchema.parse(json)
}
