import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"

const clientDogGoalSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "ARCHIVED"]),
  discipline: z.string().nullable(),
  criterion: z.string().nullable().optional(),
})

export function clientDogGoalsQueryOptions(dogId: string) {
  return queryOptions({
    queryKey: ["client-dog-goals", dogId],
    queryFn: async () =>
      z.array(clientDogGoalSchema).parse(await api.get(`dogs/${dogId}/goals`).json()),
    enabled: Boolean(dogId),
  })
}
