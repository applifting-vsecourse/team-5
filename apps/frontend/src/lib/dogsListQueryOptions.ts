import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"
import { dogKeys } from "@/lib/dogKeys"

/** Slim dog list for screens outside the dog feature (e.g. Dnes). */
const dogListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.number(),
})

export type DogListItem = z.infer<typeof dogListItemSchema>

export function dogsListQueryOptions() {
  return queryOptions({
    queryKey: dogKeys.lists(),
    queryFn: async () => {
      const json = await api.get("dogs").json()
      return z.array(dogListItemSchema).parse(json)
    },
  })
}
