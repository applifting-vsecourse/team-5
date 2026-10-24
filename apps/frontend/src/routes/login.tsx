import { useState } from "react"
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { X } from "lucide-react"
import { z } from "zod"

import { LandingPage } from "@/app/LandingPage"
import { ROUTES } from "@/app/routes"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
      <LandingPage />
      <Seo title="Přihlášení" />
      <Dialog
        open
        onOpenChange={(isOpen) => {
          if (!isOpen && !signIn.isPending) {
            void navigate({ to: ROUTES.home, replace: true })
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="tracking-tight">Přihlášení</DialogTitle>
            <DialogDescription>Přihlaste se e-mailem a heslem ke svému účtu.</DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              aria-label="Zavřít přihlášení"
              disabled={signIn.isPending}
            >
              <X
                aria-hidden="true"
                className="size-4"
              />
            </Button>
          </DialogClose>
          <SignInForm
            isLoading={signIn.isPending}
            errorMessage={errorMessage}
            onSubmit={handleSubmit}
          />
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              <Link
                to={ROUTES.forgotPassword}
                className="font-medium text-foreground underline underline-offset-4"
              >
                Zapomenuté heslo?
              </Link>
            </div>
            <p>
              Ještě nemáte účet?{" "}
              <Link
                to={ROUTES.signup}
                className="font-medium text-foreground underline underline-offset-4"
              >
                Registrace
              </Link>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
