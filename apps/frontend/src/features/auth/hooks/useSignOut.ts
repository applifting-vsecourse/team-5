import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useRouter } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { authKeys } from "@/lib/auth-keys"

import { authClient } from "@/features/auth/lib/auth-client"

export function useSignOut() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut()
      if (error) throw new Error("Odhlášení se nezdařilo. Zkuste to prosím znovu.")
    },
    onSuccess: async () => {
      await queryClient.cancelQueries()
      queryClient.clear()
      queryClient.setQueryData(authKeys.session(), null)
      await navigate({ to: ROUTES.home, replace: true })
      await router.invalidate()
    },
  })
}
