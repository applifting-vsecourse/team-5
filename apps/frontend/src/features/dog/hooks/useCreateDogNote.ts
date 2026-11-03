import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { dogKeys } from "@/features/dog/api/dogKeys"
import type { DogNoteFormValues } from "@/features/dog/api/dogSchemas"
import { createDogNote } from "@/features/dog/api/saveDogNote"

export function useCreateDogNote(dogId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: DogNoteFormValues) => createDogNote(dogId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dogKeys.notes(dogId) })
      toast.success("Poznámka je uložená")
    },
    onError: () => {
      toast.error("Poznámku se nepodařilo uložit. Zkuste to prosím znovu.")
    },
  })
}
