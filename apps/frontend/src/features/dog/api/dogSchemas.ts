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
