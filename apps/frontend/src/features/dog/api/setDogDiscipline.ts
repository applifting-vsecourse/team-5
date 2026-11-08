import { z } from "zod"

import { api } from "@/lib/api-client"

export const setDisciplineInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  isArchived: z.boolean().optional(),
})

export type SetDisciplineInput = z.infer<typeof setDisciplineInputSchema>

export const disciplineMembershipSchema = z.object({
  id: z.string(),
  dogId: z.string(),
  disciplineId: z.string(),
  isArchived: z.boolean(),
  discipline: z.object({
    id: z.string(),
    name: z.string(),
  }),
})

export type DisciplineMembership = z.infer<typeof disciplineMembershipSchema>

export async function setDogDiscipline(
  dogId: string,
  input: SetDisciplineInput,
): Promise<DisciplineMembership> {
  const data = setDisciplineInputSchema.parse(input)
  const res = await api.put(`dogs/${dogId}/disciplines`, { json: data }).json()
  return disciplineMembershipSchema.parse(res)
}
