import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"

import { clientKeys } from "./clientKeys"

const dog = z.object({ id: z.string(), name: z.string(), color: z.number() })
const person = z.object({ id: z.string(), name: z.string() })
const weeks = z.array(z.object({ from: z.string(), successRate: z.number().nullable() }))
const contextDog = dog.extend({
  breed: z.string().nullable(),
  successRate: z.number().nullable(),
  weeks,
  goals: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      deadline: z.string().nullable(),
      totalSteps: z.number(),
      masteredSteps: z.number(),
    }),
  ),
  lastTraining: z
    .object({
      id: z.string(),
      title: z.string(),
      completedAt: z.coerce.date(),
      successRate: z.number().nullable(),
      note: z.string().nullable(),
    })
    .nullable(),
})
const overviewSchema = z.object({
  metrics: z.object({
    activeClients: z.number(),
    newClientsThisMonth: z.number(),
    completedThisWeek: z.number(),
    weeklySessionChange: z.number(),
    successRate: z.number().nullable(),
    weeklyRateChange: z.number().nullable(),
  }),
  clients: z.array(
    person.extend({
      dogs: z.array(contextDog),
      activity: z.object({
        successRate: z.number().nullable(),
        days: z.array(
          z.object({
            date: z.string(),
            completedSessions: z.number(),
            ratedSessions: z.number(),
            successRate: z.number().nullable(),
          }),
        ),
      }),
      successRate: z.number().nullable(),
      weeks,
      lastTraining: z
        .object({ id: z.string(), title: z.string(), completedAt: z.coerce.date() })
        .nullable(),
    }),
  ),
  attention: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(["reply", "inactive", "low-success"]),
      dog,
      client: person,
      label: z.string(),
      activityId: z.string().nullable(),
      goalId: z.string().nullable(),
    }),
  ),
})
export type TrainerDashboard = z.infer<typeof overviewSchema>
export function trainerOverviewQueryOptions() {
  return queryOptions({
    queryKey: [...clientKeys.all, "overview"],
    queryFn: async () => overviewSchema.parse(await api.get("overview/trainer").json()),
    refetchInterval: 60000,
  })
}
