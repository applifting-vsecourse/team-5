import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { dogKeys } from "@/features/dog/api/dogKeys"
import type { DogNoteFormValues } from "@/features/dog/api/dogSchemas"
import { updateDogNote } from "@/features/dog/api/saveDogNote"

export function useUpdateDogNote(dogId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ noteId, values }: { noteId: string; values: DogNoteFormValues }) =>
      updateDogNote(noteId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dogKeys.notes(dogId) })
      toast.success("Poznámka je upravená")
    },
    onError: () => {
      toast.error("Poznámku se nepodařilo upravit. Zkuste to prosím znovu.")
    },
  })
}
