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
  dogId: z.string(),
  createdBy: z.object({ id: z.string(), name: z.string() }),
  title: z.string().min(1),
  discipline: z.string().nullable(),
  principle: z.string().nullable(),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "ARCHIVED"]),
  order: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const dogGoalsSchema = z.array(dogGoalSchema)

// Limits match the API (goal.dto.ts). An empty discipline means "none".
export const goalFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Název cíle je povinný")
    .max(100, "Název cíle může mít nejvýš 100 znaků"),
  discipline: z.string(),
  principle: z.string().trim().max(2000, "Princip může mít nejvýš 2000 znaků"),
})

export type DogGoal = z.infer<typeof dogGoalSchema>
export type GoalFormValues = z.infer<typeof goalFormSchema>

export const planBlockSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  position: z.number(),
  title: z.string(),
  instruction: z.string().nullable(),
  criterion: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const planBlocksSchema = z.array(planBlockSchema)

// Limits match the API (plan-block.dto.ts).
export const exerciseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Název cviku je povinný")
    .max(100, "Název cviku může mít nejvýš 100 znaků"),
  instruction: z.string().trim().max(2000, "Instrukce může mít nejvýš 2000 znaků"),
  criterion: z.string().trim().max(1000, "Kritérium může mít nejvýš 1000 znaků"),
})

export type PlanBlock = z.infer<typeof planBlockSchema>
export type ExerciseFormValues = z.infer<typeof exerciseFormSchema>

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
