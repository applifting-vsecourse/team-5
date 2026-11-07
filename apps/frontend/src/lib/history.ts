import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"
import { dogKeys } from "@/lib/dogKeys"

export const accessibleDogSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.number(),
  ownerId: z.string(),
})
export type AccessibleDog = z.infer<typeof accessibleDogSchema>
export function accessibleDogsQueryOptions() {
  return queryOptions({
    queryKey: [...dogKeys.all, "accessible"],
    queryFn: async () => z.array(accessibleDogSchema).parse(await api.get("overview/dogs").json()),
  })
}
const historyItemSchema = z.object({
  id: z.string(),
  dog: accessibleDogSchema.omit({ ownerId: true }),
  title: z.string(),
  status: z.enum(["COMPLETED", "SKIPPED"]),
  completedAt: z.coerce.date(),
  successRate: z.number().nullable(),
  note: z.string().nullable(),
  plannedDurationMinutes: z.number().nullable(),
  messageCount: z.number(),
  lastMessage: z
    .object({ text: z.string(), author: z.object({ id: z.string().nullable(), name: z.string() }) })
    .nullable(),
})
export type HistoryItem = z.infer<typeof historyItemSchema>
const historyPageSchema = z.object({
  items: z.array(historyItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  firstRecordedAt: z.coerce.date().nullable(),
  summary: z.object({
    month: z.string(),
    completedSessions: z.number(),
    trainedDays: z.number(),
    successRate: z.number().nullable(),
  }),
})
export function historyQueryOptions(filters: {
  dogId?: string
  month?: string
  commentsOnly: boolean
}) {
  return infiniteQueryOptions({
    queryKey: [...dogKeys.all, "history", filters],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      historyPageSchema.parse(
        await api
          .get("history", {
            searchParams: {
              page: pageParam,
              pageSize: 5,
              ...(filters.dogId ? { dogId: filters.dogId } : {}),
              ...(filters.month ? { month: filters.month } : {}),
              commentsOnly: String(filters.commentsOnly),
            },
          })
          .json(),
      ),
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
  })
}
