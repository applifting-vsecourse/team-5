import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"
import { replyKeys } from "@/lib/trainingReplies"

import { dogActivitySchema, planBlocksSchema } from "@/features/dog/api/dogSchemas"

const dogSummary = z.object({ id: z.string(), name: z.string(), color: z.number() })

export const currentPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  principle: z.string().nullable(),
  blocks: planBlocksSchema,
})
export const trainingRecordSchema = dogActivitySchema.extend({
  dogId: z.string(),
  goalId: z.string().nullable(),
  goal: currentPlanSchema.nullable(),
  isOwner: z.boolean(),
  unreadReplyIds: z.array(z.string()),
  planChanged: z.boolean(),
})

export function trainingRecordQueryOptions(dogId: string, activityId: string) {
  return queryOptions({
    queryKey: replyKeys.record(dogId, activityId),
    queryFn: async ({ signal }) =>
      trainingRecordSchema.parse(
        await api.get(`dogs/${dogId}/activities/${activityId}`, { signal }).json(),
      ),
    enabled: Boolean(dogId && activityId),
    staleTime: 0,
    refetchInterval: 30_000,
  })
}

export function trainingPlanReplyQueryOptions(trainingId: string) {
  return queryOptions({
    queryKey: replyKeys.plan(trainingId),
    queryFn: async ({ signal }) =>
      z
        .object({
          id: z.string(),
          dog: dogSummary,
          goal: currentPlanSchema,
          unreadReplyIds: z.array(z.string()),
        })
        .parse(await api.get(`trainings/${trainingId}/reply`, { signal }).json()),
    enabled: Boolean(trainingId),
    staleTime: 0,
    refetchInterval: 30_000,
  })
}
