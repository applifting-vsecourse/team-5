import { api } from "@/lib/api-client"

import { dogSchema, type CreateDogInput, type Dog } from "./dogSchemas"

export async function createDog(input: CreateDogInput): Promise<Dog> {
  const json = await api
    .post("dogs", {
      json: {
        name: input.name,
        breed: input.breed ?? undefined,
        color: input.color,
      },
    })
    .json()
  return dogSchema.parse(json)
}
