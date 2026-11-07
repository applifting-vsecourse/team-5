import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"

const dog = z.object({ id: z.string(), name: z.string(), color: z.number() })
const message = z.object({
  id: z.string(),
  workoutLogId: z.string(),
  text: z.string(),
  createdAt: z.coerce.date(),
  author: z.object({ id: z.string().nullable(), name: z.string() }),
})
const update = message.extend({ activity: z.object({ id: z.string(), title: z.string(), dog }) })
export type TrainingUpdate = z.infer<typeof update>
export const updatesQueryOptions = () =>
  queryOptions({
    queryKey: ["training-updates"],
    queryFn: async () => z.array(update).parse(await api.get("updates").json()),
  })
export const conversationQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["training-conversation", id],
    enabled: Boolean(id),
    queryFn: async () =>
      z
        .object({
          id: z.string(),
          title: z.string(),
          dog,
          completedAt: z.coerce.date(),
          successRate: z.number().nullable(),
          note: z.string().nullable(),
          videoUrl: z.string().nullable(),
          messages: z.array(message),
        })
        .parse(await api.get(`activities/${id}`).json()),
  })
