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
})

export type Dog = z.infer<typeof dogSchema>
export type CreateDogInput = z.infer<typeof createDogInputSchema>

export const dogGoalSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string().optional(),
  status: z.enum(["active", "completed"]).default("active"),
})

export const dogActivitySchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  status: z.enum(["completed", "skipped"]),
  successRate: z.number().min(0).max(100).optional(),
  rating: z.number().min(1).max(5).optional(),
  note: z.string().optional(),
})

export type DogGoal = z.infer<typeof dogGoalSchema>
export type DogActivity = z.infer<typeof dogActivitySchema>
