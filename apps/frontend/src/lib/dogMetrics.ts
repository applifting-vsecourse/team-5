import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"
import { dogKeys } from "@/lib/dogKeys"

/** Weekly training metrics from GET /dogs/:dogId/metrics. Shared across features. */
export const dogMetricsSchema = z.object({
  timeZone: z.string(),
  asOf: z.string(),
  weeklyTarget: z.number(),
  weeklyTrainedDays: z.number(),
  weeklyTargetReached: z.boolean(),
  streak: z.number(),
  successRate: z.number().nullable(),
  ratedSessions: z.number(),
  weeklyChange: z.number().nullable(),
  weeks: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      completedSessions: z.number(),
      trainedDays: z.number(),
      ratedSessions: z.number(),
      successRate: z.number().nullable(),
    }),
  ),
})

export type DogMetrics = z.infer<typeof dogMetricsSchema>

export function dogMetricsQueryOptions(dogId: string) {
  return queryOptions({
    queryKey: dogKeys.metrics(dogId),
    queryFn: async () => {
      const json = await api.get(`dogs/${dogId}/metrics`).json()
      return dogMetricsSchema.parse(json)
    },
    enabled: Boolean(dogId),
  })
}
