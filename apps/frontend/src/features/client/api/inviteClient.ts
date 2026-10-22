import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { api } from "@/lib/api-client"

import { clientKeys } from "@/features/client/api/clientKeys"
import { invitationSchema, type Invitation } from "@/features/client/api/clientSchemas"

export function useInviteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (email: string): Promise<Invitation> => {
      const response = await api
        .post("clients/invitations", {
          json: { email },
        })
        .json()
      return invitationSchema.parse(response)
    },
    onSuccess: () => {
      toast.success("Pozvánka byla úspěšně odeslána")
      void queryClient.invalidateQueries({ queryKey: clientKeys.invitations() })
    },
    onError: () => {
      toast.error("Odeslání pozvánky se nezdařilo")
    },
  })
}

