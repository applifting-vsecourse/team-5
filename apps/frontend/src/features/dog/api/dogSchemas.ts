import { z } from "zod"

export const dogColorSchema = z.number().int().min(1).max(6)

export const dogSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Jméno je povinné").max(40, "Jméno může mít maximálně 40 znaků"),
  breed: z.string().max(100).nullable().optional(),
  color: dogColorSchema,
  ownerId: z.string(),
  disciplines: z.array(z.string()).default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const dogsSchema = z.array(dogSchema)

export const createDogInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Jméno psa je povinné")
    .max(40, "Maximální délka jména je 40 znaků"),
  breed: z
    .string()
    .trim()
    .max(100, "Maximální délka plemene je 100 znaků")
    .optional()
    .or(z.literal("")),
  color: dogColorSchema,
  disciplines: z.array(z.string()).default([]),
})

export type Dog = z.infer<typeof dogSchema>
export type CreateDogInput = z.infer<typeof createDogInputSchema>

export const dogGoalSchema = z.object({
  id: z.string(),
  dogId: z.string().optional(),
  title: z.string().min(1),
  discipline: z.string().nullable().optional(),
  category: z.string().optional(),
  principle: z.string().nullable().optional(),
  status: z.string().default("ACTIVE"),
  order: z.number().optional(),
  createdAt: z.coerce.date().optional(),
})

export const dogGoalsSchema = z.array(dogGoalSchema)

export const createGoalInputSchema = z.object({
  title: z.string().trim().min(1, "Název cíle je povinný").max(100),
  discipline: z.string().trim().max(60).optional(),
  principle: z.string().trim().optional(),
})

export type DogGoal = z.infer<typeof dogGoalSchema>
export type CreateGoalInput = z.infer<typeof createGoalInputSchema>

export const dogActivitySchema = z.object({
  id: z.string(),
  dogId: z.string().optional(),
  title: z.string(),
  discipline: z.string().nullable().optional(),
  status: z
    .enum(["completed", "skipped", "COMPLETED", "SKIPPED"])
    .transform((s) => s.toLowerCase() as "completed" | "skipped"),
  completedAt: z.coerce.date().optional(),
  date: z.string().optional(),
  successRate: z.number().min(0).max(100).nullable().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  focus: z.enum(["YES", "PARTIALLY", "NO"]).nullable().optional(),
  repeatedMistakes: z.enum(["YES", "PARTIALLY", "NO"]).nullable().optional(),
  note: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  skipReason: z.string().nullable().optional(),
})

export const dogActivitiesSchema = z.array(dogActivitySchema)

export type DogActivity = z.infer<typeof dogActivitySchema>
