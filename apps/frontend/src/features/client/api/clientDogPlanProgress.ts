import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"
import { goalTrainingProgress } from "@/lib/goalTrainingProgress"

// Only what goal progress needs from the dog's plan (same endpoint as the dog profile).
const planProgressSchema = z.array(
  z.object({
    goals: z.array(
      z.object({
        id: z.string(),
        sessions: z.array(
          z.object({
            workoutLogs: z
              .array(z.object({ id: z.string(), completedAt: z.coerce.date() }))
              .optional(),
            scheduledTrainings: z
              .array(
                z.object({
                  id: z.string(),
                  date: z.coerce.date(),
                  status: z.enum(["PLANNED", "COMPLETED", "SKIPPED"]),
                }),
              )
              .optional(),
          }),
        ),
      }),
    ),
  }),
)

export type GoalProgress = ReturnType<typeof goalTrainingProgress>

/** Training progress per goal id for a shared dog. */
export function clientDogPlanProgressQueryOptions(dogId: string) {
  return queryOptions({
    queryKey: ["client-dog-plan-progress", dogId],
    enabled: Boolean(dogId),
    queryFn: async () => {
      const plan = planProgressSchema.parse(await api.get(`dogs/${dogId}/plan`).json())
      return new Map<string, GoalProgress>(
        plan.flatMap((group) => group.goals).map((goal) => [goal.id, goalTrainingProgress(goal)]),
      )
    },
  })
}
