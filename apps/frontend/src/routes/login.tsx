import { useState } from "react"
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { ROUTES } from "@/app/routes"
import { AuthLayout } from "@/components/AuthLayout"
import { DesignIcon } from "@/components/DesignIcon"
import { InviteCodeDialog } from "@/components/InviteCodeDialog"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton"
import { SignInForm } from "@/features/auth/components/SignInForm"
import { GoogleSignInError, useGoogleSignIn } from "@/features/auth/hooks/useGoogleSignIn"
import { useSignIn } from "@/features/auth/hooks/useSignIn"
import { loginHome } from "@/features/auth/lib/account-home"
import { isGoogleOAuthEnabled } from "@/features/auth/lib/google-oauth-enabled"
import {
  buildAuthCallbackUrl,
  OAUTH_FAILED_MESSAGE,
  oauthErrorMessage,
} from "@/features/auth/lib/oauth-error"
import { decodeRedirectUri } from "@/features/auth/lib/redirect"
import { SIGN_IN_FAILED_MESSAGE, SignInError } from "@/features/auth/lib/sign-in-error"

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: z.object({
    from: z.string().optional(),
    code: z.string().optional(),
    error: z.string().optional(),
  }),
  loaderDeps: ({ search }) => ({ from: search.from, code: search.code }),
  loader: async ({ context, deps }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (!session) return
    if (deps.code) {
      throw redirect({ to: ROUTES.invite, search: { code: deps.code } })
    }
    throw redirect({ href: decodeRedirectUri(deps.from) ?? loginHome(session.user) })
  },
})

function LoginPage() {
  const { from, code, error: searchError } = Route.useSearch()
  const navigate = useNavigate()
  const signIn = useSignIn()
  const googleSignIn = useGoogleSignIn()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [dismissedSearchError, setDismissedSearchError] = useState<string | undefined>(undefined)

  const displayedError =
    errorMessage ??
    (searchError && dismissedSearchError !== searchError ? oauthErrorMessage(searchError) : null)

  const effectiveCode =
    code ??
    (() => {
      if (!from) return undefined
      try {
        const decoded = decodeURIComponent(from)
        const match = /[?&]code=([A-Za-z0-9]+)/.exec(decoded)
        return match ? match[1]?.toUpperCase() : undefined
      } catch {
        return undefined
      }
    })()

  const handleSubmit = async (values: { email: string; password: string }) => {
    setErrorMessage(null)
    setDismissedSearchError(searchError)
    try {
      const session = await signIn.mutateAsync(values)
      if (effectiveCode) {
        await navigate({ to: ROUTES.invite, search: { code: effectiveCode }, replace: true })
        return
      }
      await navigate({ href: decodeRedirectUri(from) ?? loginHome(session.user), replace: true })
    } catch (error) {
      setErrorMessage(error instanceof SignInError ? error.message : SIGN_IN_FAILED_MESSAGE)
    }
  }

  const handleGoogleSignIn = async () => {
    setErrorMessage(null)
    setDismissedSearchError(searchError)
    try {
      const callbackURL = buildAuthCallbackUrl(ROUTES.login, { from, code: effectiveCode })
      await googleSignIn.mutateAsync({
        callbackURL,
        errorCallbackURL: callbackURL,
      })
    } catch (error) {
      setErrorMessage(error instanceof GoogleSignInError ? error.message : OAUTH_FAILED_MESSAGE)
    }
  }

  return (
    <>
      <Seo title="Přihlášení" />
      <AuthLayout
        hasBrand
        title="Vítej zpátky 👋"
        description="Přihlas se a pokračuj v tréninku svého psa."
        footer={
          <span>
            Nemáš účet?{" "}
            <Link
              to={ROUTES.signup}
              search={effectiveCode ? { code: effectiveCode } : undefined}
              className="inline-flex min-h-touch items-center font-bold text-primary"
            >
              Zaregistruj se
            </Link>
          </span>
        }
      >
        <SignInForm
          isLoading={signIn.isPending}
          errorMessage={displayedError}
          onSubmit={handleSubmit}
        />
        {isGoogleOAuthEnabled() ? (
          <>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              nebo
              <span className="h-px flex-1 bg-border" />
            </div>
            <GoogleSignInButton
              isLoading={googleSignIn.isPending}
              isDisabled={signIn.isPending}
              onClick={handleGoogleSignIn}
            />
          </>
        ) : null}
        <div className="space-y-3">
          <InviteCodeDialog
            trigger={
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                disabled={signIn.isPending || googleSignIn.isPending}
              >
                <DesignIcon name="auth-141-1520-IconTicket" />
                Mám pozvánku od trenéra
              </Button>
            }
          />
        </div>
      </AuthLayout>
    </>
  )
}
