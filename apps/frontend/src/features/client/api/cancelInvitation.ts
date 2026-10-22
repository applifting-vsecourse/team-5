import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { api } from "@/lib/api-client"

import { clientKeys } from "@/features/client/api/clientKeys"

export function useCancelInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invitationId: string) => {
      await api.delete(`clients/invitations/${invitationId}`)
    },
    onSuccess: () => {
      toast.success("Pozvánka byla zrušena")
      void queryClient.invalidateQueries({ queryKey: clientKeys.invitations() })
    },
    onError: () => {
      toast.error("Zrušení pozvánky se nezdařilo")
    },
  })
}
