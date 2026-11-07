import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { dogKeys } from "@/features/dog/api/dogKeys"
import type { Dog, UpdateDogInput } from "@/features/dog/api/dogSchemas"
import { archiveDog, restoreDog, updateDog } from "@/features/dog/api/updateDog"
import { weekKeys } from "@/lib/weekKeys"

function invalidateAfterArchiveChange(
  queryClient: ReturnType<typeof useQueryClient>,
  dog: Dog,
) {
  queryClient.setQueryData(dogKeys.detail(dog.id), dog)
  void queryClient.invalidateQueries({ queryKey: dogKeys.lists() })
  void queryClient.invalidateQueries({ queryKey: dogKeys.archivedList() })
  void queryClient.invalidateQueries({ queryKey: dogKeys.detail(dog.id) })
  void queryClient.invalidateQueries({ queryKey: weekKeys.all })
}

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

export function useArchiveDog(dogId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => archiveDog(dogId),
    onSuccess: (dog) => {
      invalidateAfterArchiveChange(queryClient, dog)
      toast.success("Pes je v archivu")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Archivaci psa se nepodařilo dokončit")
    },
  })
}

export function useRestoreDog(dogId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => restoreDog(dogId),
    onSuccess: (dog) => {
      invalidateAfterArchiveChange(queryClient, dog)
      toast.success("Pes je zase aktivní")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Vrácení psa z archivu se nepodařilo")
    },
  })
}
