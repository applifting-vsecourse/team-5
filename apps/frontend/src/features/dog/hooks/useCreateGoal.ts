import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { api } from "@/lib/api-client"

import { dogKeys } from "@/features/dog/api/dogKeys"
import { dogGoalSchema, type CreateGoalInput, type DogGoal } from "@/features/dog/api/dogSchemas"

export function useCreateGoal(dogId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateGoalInput): Promise<DogGoal> => {
      const json = await api
        .post(`dogs/${dogId}/goals`, {
          json: {
            title: input.title,
            discipline: input.discipline ?? undefined,
            principle: input.principle ?? undefined,
          },
        })
        .json()
      return dogGoalSchema.parse(json)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dogKeys.goals(dogId) })
      toast.success("Cíl byl úspěšně přidán")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Při vytváření cíle došlo k chybě")
    },
  })
}
