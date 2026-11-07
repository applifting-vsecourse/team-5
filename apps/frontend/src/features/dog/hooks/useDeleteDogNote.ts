import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { dogKeys } from "@/features/dog/api/dogKeys"
import { deleteDogNote } from "@/features/dog/api/saveDogNote"

export function useDeleteDogNote(dogId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (noteId: string) => deleteDogNote(noteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dogKeys.notes(dogId) })
      toast.success("Poznámka je smazaná")
    },
    onError: () => {
      toast.error("Poznámku se nepodařilo smazat. Zkuste to prosím znovu.")
    },
  })
}
