import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"
import { dogKeys } from "@/lib/dogKeys"

import { planBlockSchema } from "./dogSchemas"

export const sessionSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  title: z.string(),
  position: z.number(),
  isArchived: z.boolean(),
  steps: z.array(planBlockSchema),
  workoutLogs: z.array(z.object({ id: z.string(), completedAt: z.coerce.date() })).optional(),
  scheduledTrainings: z
    .array(
      z.object({
        id: z.string(),
        date: z.coerce.date(),
        status: z.enum(["PLANNED", "COMPLETED", "SKIPPED"]),
      }),
    )
    .optional(),
})
export const planGoalSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdBy: z.object({ name: z.string() }).nullable().optional(),
  criterion: z.string().nullable(),
  principle: z.string().nullable(),
  deadline: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]),
  sessions: z.array(sessionSchema),
})
export const planSchema = z.array(
  z.object({
    id: z.string(),
    isArchived: z.boolean(),
    discipline: z.object({ id: z.string(), name: z.string() }),
    goals: z.array(planGoalSchema),
  }),
)
export type PlanGoal = z.infer<typeof planGoalSchema>
export type TrainingSession = z.infer<typeof sessionSchema>

export function dogPlanQueryOptions(dogId: string) {
  return queryOptions({
    queryKey: [...dogKeys.detail(dogId), "plan"],
    enabled: Boolean(dogId),
    queryFn: async () => planSchema.parse(await api.get(`dogs/${dogId}/plan`).json()),
  })
}

export async function createSession(goalId: string, title: string) {
  return z
    .object({ id: z.string() })
    .parse(await api.post(`goals/${goalId}/sessions`, { json: { title } }).json())
}

// Built-in templates become independent, persisted copies when inserted.
export const stepTemplates = [
  {
    id: "whistle",
    category: "Přivolání",
    icon: "Whistle",
    title: "Přivolání na píšťalku",
    instruction: "Zapískej jednou. Jakmile pes přiběhne, odměň ho u nohy.",
    criterion: "Přiběhne do 3 s na 10 m",
    durationMinutes: 8,
  },
  {
    id: "dogs",
    category: "Přivolání",
    icon: "LibraryUsers",
    title: "Přivolání od jiného psa",
    instruction: "Začni s klidným psem v dostatečné vzdálenosti. Odměň návrat.",
    criterion: "Vrátí se na první povel i od druhého psa",
    durationMinutes: 10,
  },
  {
    id: "run",
    category: "Přivolání",
    icon: "Zap",
    title: "Přivolání z běhu",
    instruction: "Přivolej psa při volném běhu a odměň návrat.",
    criterion: "Zastaví a vrátí se na první povel",
    durationMinutes: 6,
  },
  {
    id: "stay",
    category: "Poslušnost",
    icon: "Paw",
    title: "Sedni – zůstaň 30 s",
    instruction: "Nech psa sednout. Vzdal se o pět kroků a vrať se k odměně.",
    criterion: "Vydrží 30 s, odejdeš 5 kroků",
    durationMinutes: 7,
  },
  {
    id: "heel",
    category: "Poslušnost",
    icon: "LibraryTarget",
    title: "Chůze u nohy",
    instruction: "Krátké úseky; odměna u levé nohy.",
    criterion: "20 m bez zatažení",
    durationMinutes: 10,
  },
  {
    id: "start",
    category: "Canicross",
    icon: "Zap",
    title: "Start na povel",
    instruction: "Připrav postroj a vyraz na povel do krátkého rovného úseku.",
    criterion: "Na povel vyrazí do tahu a 200 m drží přímý směr",
    durationMinutes: 5,
  },
  {
    id: "calm",
    category: "Socializace",
    icon: "LibraryUsers",
    title: "Klidné míjení psů",
    instruction: "Míjej klidného psa v bezpečné vzdálenosti, postupně ji zkracuj.",
    criterion: "Na vodítku mine psa na 3 m bez štěkání a tahání",
    durationMinutes: 8,
  },
] as const
