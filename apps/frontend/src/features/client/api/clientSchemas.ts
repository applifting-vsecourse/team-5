import { z } from "zod"

export const clientDogSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.number().int().min(1).max(6),
  breed: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  disciplines: z.array(z.string()).optional(),
})

export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  dogs: z.array(clientDogSchema),
  createdAt: z.coerce.date(),
})

export const clientsSchema = z.array(clientSchema)

export const invitationSchema = z.object({
  id: z.string(),
  code: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

export const invitationsSchema = z.array(invitationSchema)

export type ClientDog = z.infer<typeof clientDogSchema>
export type Client = z.infer<typeof clientSchema>
export type Invitation = z.infer<typeof invitationSchema>
