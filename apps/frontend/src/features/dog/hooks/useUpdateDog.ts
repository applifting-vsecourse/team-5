import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { dogKeys } from "@/features/dog/api/dogKeys"
import type { Dog, UpdateDogInput } from "@/features/dog/api/dogSchemas"
import { updateDog } from "@/features/dog/api/updateDog"

export function useUpdateDog(dogId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateDogInput & { id?: string }) => {
      const targetId = dogId ?? input.id
      if (!targetId) {
        throw new Error("Identifikátor psa je povinný")
      }
      return updateDog(targetId, input)
    },
    onSuccess: (updatedDog: Dog) => {
      queryClient.setQueryData(dogKeys.detail(updatedDog.id), updatedDog)
      void queryClient.invalidateQueries({ queryKey: dogKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: dogKeys.detail(updatedDog.id) })
      toast.success("Pes byl úspěšně upraven")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Při úpravě psa došlo k chybě")
    },
  })
}
