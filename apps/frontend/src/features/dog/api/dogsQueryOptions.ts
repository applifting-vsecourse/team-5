import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api-client"

import { dogKeys } from "./dogKeys"
import {
  dogActivitiesSchema,
  dogGoalSchema,
  dogGoalsSchema,
  dogSchema,
  dogsSchema,
  planBlocksSchema,
  plannedTrainingsSchema,
  trainingsSchema,
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

// The plan of one goal, in the order it is trained.
export function goalBlocksQueryOptions(goalId: string) {
  return queryOptions({
    queryKey: dogKeys.goalBlocks(goalId),
    queryFn: async () => {
      const json = await api.get(`goals/${goalId}/blocks`).json()
      return planBlocksSchema.parse(json)
    },
    enabled: Boolean(goalId),
  })
}

export function goalTrainingsQueryOptions(goalId: string) {
  return queryOptions({
    queryKey: dogKeys.goalTrainings(goalId),
    queryFn: async () => {
      const json = await api.get(`goals/${goalId}/trainings`).json()
      return trainingsSchema.parse(json)
    },
    enabled: Boolean(goalId),
  })
}

export function dogPlannedTrainingsQueryOptions(dogId: string) {
  return queryOptions({
    queryKey: dogKeys.plannedTrainings(dogId),
    queryFn: async () => {
      const json = await api.get(`dogs/${dogId}/trainings`).json()
      return plannedTrainingsSchema.parse(json)
    },
    enabled: Boolean(dogId),
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
