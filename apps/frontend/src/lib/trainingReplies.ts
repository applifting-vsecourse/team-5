import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"

const dog = z.object({ id: z.string(), name: z.string(), color: z.number() })
const reply = z.object({
  id: z.string(),
  kind: z.enum(["MESSAGE", "PLAN_CHANGED"]),
  createdAt: z.coerce.date(),
  workoutLog: z.object({ id: z.string(), title: z.string(), dog }).nullable(),
  scheduledTraining: z
    .object({
      id: z.string(),
      date: z.coerce.date(),
      training: z.object({ title: z.string() }),
      dog,
      workoutLog: z.object({ id: z.string() }).nullable(),
    })
    .nullable(),
})
export type UnreadReply = z.infer<typeof reply>
export const unreadRepliesOptions = () =>
  queryOptions({
    queryKey: ["unread-training-replies"],
    queryFn: async () => z.array(reply).parse(await api.get("training-replies").json()),
    refetchInterval: 30000,
  })
export const replyRecordId = (reply: UnreadReply) =>
  reply.workoutLog?.id ?? reply.scheduledTraining?.workoutLog?.id
export const replyDog = (reply: UnreadReply) =>
  reply.workoutLog?.dog ?? reply.scheduledTraining?.dog
