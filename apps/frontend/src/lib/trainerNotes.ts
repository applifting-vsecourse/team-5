import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"

import { api } from "@/lib/api-client"

export const GENERAL_NOTE_TARGET = "__general__"

export const trainerNoteKeys = {
  all: ["trainer-notes"] as const,
  client: (clientId: string) => [...trainerNoteKeys.all, clientId] as const,
  dog: (clientId: string, dogId: string) =>
    [...trainerNoteKeys.client(clientId), { dogId }] as const,
}

export const trainerNoteDogSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.number().int().min(1).max(6),
})

export const trainerNoteSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  dogId: z.string().nullable(),
  dog: trainerNoteDogSchema.nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
  text: z.string().min(1),
  isPinned: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const trainerNotesSchema = z.array(trainerNoteSchema)

export const trainerNoteFormSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Zadejte datum ve formátu RRRR-MM-DD"),
  dogId: z.string(),
  title: z.string().trim().min(1, "Název je povinný").max(100, "Název může mít nejvýš 100 znaků"),
  text: z.string().trim().min(1, "Text je povinný").max(2000, "Text může mít nejvýš 2000 znaků"),
})

export type TrainerNote = z.infer<typeof trainerNoteSchema>
export type TrainerNoteDog = z.infer<typeof trainerNoteDogSchema>
export type TrainerNoteFormValues = z.infer<typeof trainerNoteFormSchema>

export function trainerNotesQueryOptions(clientId: string, dogId?: string) {
  return queryOptions({
    queryKey: dogId ? trainerNoteKeys.dog(clientId, dogId) : trainerNoteKeys.client(clientId),
    queryFn: async () => {
      const json = dogId
        ? await api.get(`clients/${clientId}/notes`, { searchParams: { dogId } }).json()
        : await api.get(`clients/${clientId}/notes`).json()
      return trainerNotesSchema.parse(json)
    },
    enabled: Boolean(clientId),
  })
}

const normalizeDogId = (dogId: string): string | null =>
  !dogId || dogId === GENERAL_NOTE_TARGET ? null : dogId

export async function createTrainerNote(
  clientId: string,
  values: TrainerNoteFormValues,
): Promise<TrainerNote> {
  const json = await api
    .post(`clients/${clientId}/notes`, {
      json: {
        date: values.date,
        dogId: normalizeDogId(values.dogId),
        title: values.title,
        text: values.text,
      },
    })
    .json()
  return trainerNoteSchema.parse(json)
}

export async function updateTrainerNote(
  noteId: string,
  values: Partial<TrainerNoteFormValues> & { isPinned?: boolean },
): Promise<TrainerNote> {
  const payload: Record<string, unknown> = {}
  if (values.date !== undefined) payload.date = values.date
  if (values.dogId !== undefined) payload.dogId = normalizeDogId(values.dogId)
  if (values.title !== undefined) payload.title = values.title
  if (values.text !== undefined) payload.text = values.text
  if (values.isPinned !== undefined) payload.isPinned = values.isPinned

  const json = await api.patch(`trainer-notes/${noteId}`, { json: payload }).json()
  return trainerNoteSchema.parse(json)
}

export async function deleteTrainerNote(noteId: string): Promise<void> {
  await api.delete(`trainer-notes/${noteId}`)
}

export function useCreateTrainerNote(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: TrainerNoteFormValues) => createTrainerNote(clientId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: trainerNoteKeys.client(clientId) })
      toast.success("Poznámka je uložená")
    },
    onError: () => {
      toast.error("Poznámku se nepodařilo uložit. Zkuste to prosím znovu.")
    },
  })
}

export function useUpdateTrainerNote(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ noteId, values }: { noteId: string; values: TrainerNoteFormValues }) =>
      updateTrainerNote(noteId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: trainerNoteKeys.client(clientId) })
      toast.success("Poznámka je upravená")
    },
    onError: () => {
      toast.error("Poznámku se nepodařilo upravit. Zkuste to prosím znovu.")
    },
  })
}

export function useTogglePinTrainerNote(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ noteId, isPinned }: { noteId: string; isPinned: boolean }) =>
      updateTrainerNote(noteId, { isPinned }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: trainerNoteKeys.client(clientId) })
      toast.success(updated.isPinned ? "Poznámka je připnutá" : "Poznámka je odepnutá")
    },
    onError: () => {
      toast.error("Stav připnutí se nepodařilo změnit. Zkuste to prosím znovu.")
    },
  })
}

export function useDeleteTrainerNote(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (noteId: string) => deleteTrainerNote(noteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: trainerNoteKeys.client(clientId) })
      toast.success("Poznámka je smazaná")
    },
    onError: () => {
      toast.error("Poznámku se nepodařilo smazat. Zkuste to prosím znovu.")
    },
  })
}
