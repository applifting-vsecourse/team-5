import { api } from "@/lib/api-client"

import { dogSchema, type CreateDogInput, type Dog } from "./dogSchemas"

export async function createDog(input: CreateDogInput): Promise<Dog> {
  const json = await api
    .post("dogs", {
      json: {
        name: input.name,
        breed: input.breed ?? undefined,
        color: input.color,
        disciplines: input.disciplines ?? [],
      },
    })
    .json()

  let dog = dogSchema.parse(json)

  if (input.photo) {
    const formData = new FormData()
    formData.append("file", input.photo)
    const photoJson = await api.post(`dogs/${dog.id}/photo`, { body: formData }).json()
    dog = dogSchema.parse(photoJson)
  }

  return dog
}
