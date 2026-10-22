import { api } from "@/lib/api-client"

import { dogSchema, type Dog, type UpdateDogInput } from "./dogSchemas"

export async function updateDog(id: string, input: UpdateDogInput): Promise<Dog> {
  const patchPayload: Record<string, unknown> = {}
  if (input.name !== undefined) patchPayload.name = input.name
  if (input.breed !== undefined) patchPayload.breed = input.breed ? input.breed.trim() : ""
  if (input.color !== undefined) patchPayload.color = input.color
  if (input.disciplines !== undefined) patchPayload.disciplines = input.disciplines

  const json = await api.patch(`dogs/${id}`, { json: patchPayload }).json()
  let dog = dogSchema.parse(json)

  if (input.removePhoto) {
    const delJson = await api.delete(`dogs/${id}/photo`).json()
    dog = dogSchema.parse(delJson)
  }

  if (input.photo) {
    const formData = new FormData()
    formData.append("file", input.photo)
    const photoJson = await api.post(`dogs/${id}/photo`, { body: formData }).json()
    dog = dogSchema.parse(photoJson)
  }

  return dog
}
