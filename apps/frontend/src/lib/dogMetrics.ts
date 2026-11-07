import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"
import { dogKeys } from "@/lib/dogKeys"
import { weekKeys } from "@/lib/weekKeys"

/** Weekly training metrics from GET /dogs/:dogId/metrics. Shared across features. */
export const dogMetricsSchema = z.object({
  completedSessions: z.number().optional(),
  timeZone: z.string(),
  asOf: z.string(),
  weeklyPlannedSessions: z.number().int().nonnegative().optional(),
  weeklyCompletedSessions: z.number().int().nonnegative().optional(),
  weeklySkippedSessions: z.number().int().nonnegative().optional(),
  weeklyTarget: z.number(),
  weeklyTrainedDays: z.number(),
  weeklyTargetReached: z.boolean(),
  streak: z.number(),
  longestStreak: z.number().int().nonnegative().optional(),
  trainedDates: z.array(z.string()).optional(),
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

export function ownerMetricsQueryOptions() {
  return queryOptions({
    queryKey: [...weekKeys.all, "owner-metrics"],
    queryFn: async () => dogMetricsSchema.parse(await api.get("overview/owner-metrics").json()),
  })
}

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
