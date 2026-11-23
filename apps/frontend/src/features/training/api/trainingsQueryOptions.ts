import { queryOptions } from "@tanstack/react-query"

import { api, HTTPError } from "@/lib/api-client"

import { trainingDetailSchema, type TrainingDetail } from "./trainingSchemas"

export const trainingKeys = {
  all: ["trainings"] as const,
  detail: (trainingId: string) => [...trainingKeys.all, trainingId] as const,
}

export function isTrainingMissing(error: unknown): boolean {
  return error instanceof HTTPError && error.response.status === 404
}

export function trainingDetailQueryOptions(trainingId: string) {
  return queryOptions({
    queryKey: trainingKeys.detail(trainingId),
    retry: 1,
    queryFn: async (): Promise<TrainingDetail> => {
      const json = await api.get(`trainings/${trainingId}`).json()
      return trainingDetailSchema.parse(json)
    },
  })
}
