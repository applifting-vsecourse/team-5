import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

import { dogKeys } from "@/lib/dogKeys"
import { weekKeys } from "@/lib/weekKeys"

import { completeTraining } from "@/features/training/api/completeTraining"
import type { CompleteTrainingInput } from "@/features/training/api/trainingSchemas"

export function useCompleteTraining(trainingId: string, dogId: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (input: CompleteTrainingInput) => completeTraining(trainingId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: weekKeys.all })
      void queryClient.invalidateQueries({ queryKey: dogKeys.activities(dogId) })
      void queryClient.invalidateQueries({ queryKey: dogKeys.detail(dogId) })
      void queryClient.invalidateQueries({ queryKey: dogKeys.all })
      toast.success("Záznam tréninku byl uložen")
      void navigate({ to: "/week" })
    },
    onError: () => {
      toast.error("Záznam se nepodařilo uložit. Zkuste to prosím znovu.")
    },
  })
}
