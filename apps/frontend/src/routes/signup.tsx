import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { ROUTES } from "@/app/routes"
import { AuthLayout } from "@/components/AuthLayout"
import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { SignUpForm } from "@/features/auth/components/SignUpForm"
import { GoogleSignInError, useGoogleSignIn } from "@/features/auth/hooks/useGoogleSignIn"
import { useSignUp, type SignUpInput } from "@/features/auth/hooks/useSignUp"
import { accountHome } from "@/features/auth/lib/account-home"
import { isGoogleOAuthEnabled } from "@/features/auth/lib/google-oauth-enabled"
import {
  buildAuthCallbackUrl,
  OAUTH_FAILED_MESSAGE,
  oauthErrorMessage,
} from "@/features/auth/lib/oauth-error"
import { RegistrationError, registrationError } from "@/features/auth/lib/registration-errors"

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  validateSearch: z.object({
    code: z.string().optional(),
    email: z.string().optional(),
    error: z.string().optional(),
  }),
  loaderDeps: ({ search }) => ({ code: search.code }),
  loader: async ({ context, deps }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (!session) return
    if (deps.code) {
      throw redirect({ to: ROUTES.invite, search: { code: deps.code } })
    }
    throw redirect({ to: accountHome(session.user) })
  },
})

function SignUpPage() {
  const { code, email, error: searchError } = Route.useSearch()
  const navigate = useNavigate()
  const signUp = useSignUp()
  const googleSignIn = useGoogleSignIn()
  const queryClient = useQueryClient()
  const [error, setError] = useState<RegistrationError | null>(null)
  const [dismissedSearchError, setDismissedSearchError] = useState<string | undefined>(undefined)

  const displayedError =
    error ??
    (searchError && dismissedSearchError !== searchError
      ? new RegistrationError(oauthErrorMessage(searchError))
      : null)

  const handleSubmit = async (values: SignUpInput) => {
    setError(null)
    setDismissedSearchError(searchError)
    try {
      await signUp.mutateAsync(values)
      const session = await queryClient.ensureQueryData(authSessionQueryOptions())
      if (!session) throw registrationError()

      if (code) {
        await navigate({ to: ROUTES.invite, search: { code } })
        return
      }

      await navigate({ to: accountHome(session.user) })
    } catch (error) {
      setError(error instanceof RegistrationError ? error : registrationError())
    }
  }

  const handleGoogleSignIn = async (isTrainer: boolean) => {
    setError(null)
    setDismissedSearchError(searchError)
    try {
      await googleSignIn.mutateAsync({
        callbackURL: buildAuthCallbackUrl(ROUTES.signup, { code }),
        errorCallbackURL: buildAuthCallbackUrl(ROUTES.signup, { code, email }),
        isTrainer: code ? false : isTrainer,
      })
    } catch (error) {
      setError(
        new RegistrationError(
          error instanceof GoogleSignInError ? error.message : OAUTH_FAILED_MESSAGE,
        ),
      )
    }
  }

  return (
    <>
      <Seo title="Registrace" />
      <AuthLayout
        shouldHideBack
        title=""
        description={
          code
            ? "Dokončete registraci pro propojení se svým trenérem."
            : "Založte si účet psovoda nebo trenéra zdarma. Pozvánku nepotřebujete."
        }
        footer={
          <>
            Už máte účet?{" "}
            <Link
              to={ROUTES.login}
              search={code ? { from: `/invite?code=${code}` } : undefined}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Přihlásit se
            </Link>
          </>
        }
      >
        <SignUpForm
          isLoading={signUp.isPending}
          isGoogleLoading={googleSignIn.isPending}
          error={displayedError}
          defaultEmail={email}
          isInvitation={Boolean(code)}
          onSubmit={handleSubmit}
          onGoogleSignIn={isGoogleOAuthEnabled() ? handleGoogleSignIn : undefined}
        />
      </AuthLayout>
    </>
  )
}
