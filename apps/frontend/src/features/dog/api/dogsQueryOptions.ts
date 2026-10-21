import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api-client"

import { dogKeys } from "./dogKeys"
import { dogSchema, dogsSchema } from "./dogSchemas"

export function dogsQueryOptions() {
  return queryOptions({
    queryKey: dogKeys.lists(),
    queryFn: async () => {
      const json = await api.get("dogs").json()
      return dogsSchema.parse(json)
    },
  })
}

export function dogDetailQueryOptions(dogId: string) {
  return queryOptions({
    queryKey: dogKeys.detail(dogId),
    queryFn: async () => {
      const json = await api.get(`dogs/${dogId}`).json()
      return dogSchema.parse(json)
    },
    enabled: Boolean(dogId),
  })
}
