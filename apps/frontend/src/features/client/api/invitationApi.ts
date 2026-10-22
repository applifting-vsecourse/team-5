import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"

import { api } from "@/lib/api-client"

import { clientKeys } from "@/features/client/api/clientKeys"

export const verifyInvitationSchema = z.object({
  valid: z.boolean(),
  code: z.string(),
  trainerName: z.string(),
  email: z.string().nullable().optional(),
})

export type VerifyInvitationResponse = z.infer<typeof verifyInvitationSchema>

export async function verifyInvitation(code: string): Promise<VerifyInvitationResponse> {
  const response = await api.get(`invitations/${encodeURIComponent(code)}`).json()
  return verifyInvitationSchema.parse(response)
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (code: string) => {
      await api.post("invitations/accept", {
        json: { code },
      })
    },
    onSuccess: () => {
      toast.success("Pozvánka byla úspěšně přijata")
      void queryClient.invalidateQueries({ queryKey: clientKeys.all })
    },
    onError: () => {
      toast.error("Přijetí pozvánky se nezdařilo")
    },
  })
}

