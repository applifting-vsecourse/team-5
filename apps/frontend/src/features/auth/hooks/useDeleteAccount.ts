import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useRouter } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { authKeys } from "@/lib/auth-keys"

import { authClient } from "@/features/auth/lib/auth-client"

export class DeleteAccountError extends Error {
  constructor(
    message: string,
    public readonly field?: "password",
  ) {
    super(message)
  }
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const router = useRouter()

  return useMutation({
    mutationFn: async (password: string) => {
      const { error } = await authClient.deleteUser({ password })
      if (error) {
        if (error.code === "INVALID_PASSWORD" || error.code === "PASSWORD_REQUIRED") {
          throw new DeleteAccountError("Zadejte správné heslo ke svému účtu.", "password")
        }
        throw new DeleteAccountError(
          error.status === 401
            ? "Přihlášení vypršelo. Přihlaste se znovu a smazání opakujte."
            : "Účet se nepodařilo smazat. Zkuste to prosím znovu.",
        )
      }
    },
    onSuccess: async () => {
      // Cancel first: late responses must not restore a deleted user's data.
      await queryClient.cancelQueries()
      queryClient.clear()
      queryClient.setQueryData(authKeys.session(), null)
      await navigate({ to: ROUTES.home, replace: true })
      await router.invalidate()
    },
    gcTime: 0,
  })
}
