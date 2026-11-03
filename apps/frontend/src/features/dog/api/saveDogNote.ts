import { api } from "@/lib/api-client"

import { dogNoteSchema, type DogNote, type DogNoteFormValues } from "./dogSchemas"

export async function createDogNote(dogId: string, values: DogNoteFormValues): Promise<DogNote> {
  const json = await api.post(`dogs/${dogId}/notes`, { json: values }).json()
  return dogNoteSchema.parse(json)
}

export async function updateDogNote(noteId: string, values: DogNoteFormValues): Promise<DogNote> {
  const json = await api.patch(`notes/${noteId}`, { json: values }).json()
  return dogNoteSchema.parse(json)
}

export async function deleteDogNote(noteId: string): Promise<void> {
  await api.delete(`notes/${noteId}`)
}
