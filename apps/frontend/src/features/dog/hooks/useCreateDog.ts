import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createDog } from "@/features/dog/api/createDog"
import { dogKeys } from "@/features/dog/api/dogKeys"
import type { CreateDogInput } from "@/features/dog/api/dogSchemas"

export function useCreateDog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateDogInput) => createDog(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dogKeys.lists() })
      toast.success("Pes byl úspěšně vytvořen")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Při vytváření psa došlo k chybě")
    },
  })
}
