import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"

const dogSummary = z.object({ id: z.string(), name: z.string(), color: z.number() })
export const unreadRepliesSchema = z.array(
  z.object({
    id: z.string(),
    kind: z.enum(["MESSAGE", "PLAN_CHANGED"]),
    createdAt: z.coerce.date(),
    workoutLog: z
      .object({ id: z.string(), title: z.string(), completedAt: z.coerce.date(), dog: dogSummary })
      .nullable(),
    scheduledTraining: z
      .object({
        id: z.string(),
        date: z.coerce.date(),
        goal: z.object({ title: z.string() }),
        dog: dogSummary,
      })
      .nullable(),
  }),
)
export type UnreadReply = z.infer<typeof unreadRepliesSchema>[number]

export const replyKeys = {
  all: ["training-replies"] as const,
  unread: ["training-replies", "unread"] as const,
  record: (dogId: string, activityId: string) =>
    ["training-replies", "record", dogId, activityId] as const,
  plan: (trainingId: string) => ["training-replies", "plan", trainingId] as const,
}

export function unreadRepliesQueryOptions() {
  return queryOptions({
    queryKey: replyKeys.unread,
    queryFn: async ({ signal }) =>
      unreadRepliesSchema.parse(await api.get("training-replies", { signal }).json()),
    staleTime: 0,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}
