import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"

import { clientKeys } from "./clientKeys"

const dog = z.object({ id: z.string(), name: z.string(), color: z.number() })
const person = z.object({ id: z.string(), name: z.string() })
const matrixCell = z.object({
  date: z.string(),
  successRate: z.number().nullable(),
  activityId: z.string().nullable(),
  dogId: z.string().nullable(),
})

const overviewSchema = z.object({
  metrics: z.object({
    activeClients: z.number(),
    newClientsThisMonth: z.number(),
    completedThisWeek: z.number(),
    weeklySessionChange: z.number(),
    successRate: z.number().nullable(),
    weeklyRateChange: z.number().nullable(),
    unreadNotes: z.number().int().nonnegative(),
  }),
  clients: z.array(
    person.extend({
      dogs: z.array(dog),
      successRate: z.number().nullable(),
      weeks: z.array(z.object({ from: z.string(), successRate: z.number().nullable() })),
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
  activityMatrix: z.object({
    days: z.array(z.string()),
    rows: z.array(
      z.object({
        clientId: z.string(),
        clientName: z.string(),
        dogs: z.array(dog),
        cells: z.array(matrixCell),
        averageSuccessRate: z.number().nullable(),
      }),
    ),
  }),
})
export type TrainerDashboard = z.infer<typeof overviewSchema>
export function trainerOverviewQueryOptions() {
  return queryOptions({
    queryKey: [...clientKeys.all, "overview"],
    queryFn: async () => overviewSchema.parse(await api.get("overview/trainer").json()),
    refetchInterval: 60000,
  })
}
