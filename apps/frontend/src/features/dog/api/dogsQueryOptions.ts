import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api-client"

import { dogKeys } from "./dogKeys"
import {
  dogActivitiesSchema,
  dogGoalSchema,
  dogGoalsSchema,
  dogSchema,
  dogsSchema,
} from "./dogSchemas"

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

export function dogGoalsQueryOptions(dogId: string) {
  return queryOptions({
    queryKey: dogKeys.goals(dogId),
    queryFn: async () => {
      const json = await api.get(`dogs/${dogId}/goals`).json()
      return dogGoalsSchema.parse(json)
    },
    enabled: Boolean(dogId),
  })
}

export function goalQueryOptions(goalId: string) {
  return queryOptions({
    queryKey: dogKeys.goal(goalId),
    queryFn: async () => {
      const json = await api.get(`goals/${goalId}`).json()
      return dogGoalSchema.parse(json)
    },
    enabled: Boolean(goalId),
  })
}

export function dogActivitiesQueryOptions(dogId: string) {
  return queryOptions({
    queryKey: dogKeys.activities(dogId),
    queryFn: async () => {
      const json = await api.get(`dogs/${dogId}/activities`).json()
      return dogActivitiesSchema.parse(json)
    },
    enabled: Boolean(dogId),
  })
}
