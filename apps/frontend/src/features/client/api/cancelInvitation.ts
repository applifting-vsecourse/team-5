import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api-client"

import { clientKeys } from "@/features/client/api/clientKeys"

export function useCancelInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invitationId: string) => {
      await api.delete(`clients/invitations/${invitationId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.invitations() })
    },
  })
}
