import { useMutation } from "@tanstack/react-query"

import { authClient } from "@/features/auth/lib/auth-client"
import { oauthErrorMessage } from "@/features/auth/lib/oauth-error"

export type GoogleSignInInput = {
  callbackURL: string
  errorCallbackURL: string
  isTrainer?: boolean
}

export class GoogleSignInError extends Error {}

export function useGoogleSignIn() {
  return useMutation({
    mutationFn: async ({ callbackURL, errorCallbackURL, isTrainer }: GoogleSignInInput) => {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL,
        errorCallbackURL,
        ...(typeof isTrainer === "boolean" ? { additionalData: { isTrainer } } : {}),
      })
      if (result?.error) {
        throw new GoogleSignInError(oauthErrorMessage(result.error.code))
      }
      return result?.data
    },
  })
}
