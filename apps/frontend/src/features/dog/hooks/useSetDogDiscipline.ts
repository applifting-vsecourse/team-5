import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { dogKeys } from "@/lib/dogKeys"

import { setDogDiscipline, type SetDisciplineInput } from "@/features/dog/api/setDogDiscipline"

export function useSetDogDiscipline(dogId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SetDisciplineInput) => setDogDiscipline(dogId, input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: dogKeys.detail(dogId) })
      void queryClient.invalidateQueries({ queryKey: [...dogKeys.detail(dogId), "plan"] })
      void queryClient.invalidateQueries({ queryKey: dogKeys.all })
      if (variables.isArchived) {
        toast.success(`Disciplína „${variables.name}“ byla ukončena a přesunuta do archivu`)
      } else {
        toast.success(`Disciplína „${variables.name}“ byla obnovena`)
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Při změně stavu disciplíny došlo k chybě")
    },
  })
}
