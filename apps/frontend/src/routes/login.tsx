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
import { SignInForm } from "@/features/auth/components/SignInForm"
import { useSignIn } from "@/features/auth/hooks/useSignIn"
import { loginHome } from "@/features/auth/lib/account-home"
import { decodeRedirectUri } from "@/features/auth/lib/redirect"
import { SIGN_IN_FAILED_MESSAGE, SignInError } from "@/features/auth/lib/sign-in-error"

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: z.object({
    from: z.string().optional(),
    code: z.string().optional(),
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
  const { from, code } = Route.useSearch()
  const navigate = useNavigate()
  const signIn = useSignIn()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          nebo
          <span className="h-px flex-1 bg-border" />
        </div>
        <InviteCodeDialog
          trigger={
            <Button
              variant="outline"
              size="lg"
              className="w-full"
            >
              <DesignIcon name="auth-141-1520-IconTicket" />
              Mám pozvánku od trenéra
            </Button>
          }
        />
      </AuthLayout>
    </>
  )
}
