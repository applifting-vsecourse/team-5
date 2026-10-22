import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { z } from "zod"

import { ROUTES } from "@/app/routes"
import { AuthLayout } from "@/components/AuthLayout"
import { Seo } from "@/components/Seo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { accountHome } from "@/features/auth/lib/account-home"
import { useAcceptInvitation, verifyInvitation } from "@/features/client/api/invitationApi"

const inviteSearchSchema = z.object({
  code: z.string().optional(),
})

type InviteSearch = {
  code?: string
}

export const Route = createFileRoute("/invite")({
  validateSearch: (search: Record<string, unknown>): InviteSearch =>
    inviteSearchSchema.parse(search),
  component: InvitePage,
})

function InvitePage() {
  const { code: rawCode } = Route.useSearch()
  const code = rawCode?.trim().toUpperCase() ?? ""
  const navigate = useNavigate()

  const { data: session } = useQuery(authSessionQueryOptions())
  const acceptMutation = useAcceptInvitation()
  const [isAccepted, setIsAccepted] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)

  const {
    data: invitation,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["invitation", code],
    queryFn: () => verifyInvitation(code),
    enabled: Boolean(code),
    retry: false,
  })

  const handleAccept = async () => {
    if (!code) return
    setAcceptError(null)
    try {
      await acceptMutation.mutateAsync(code)
      setIsAccepted(true)
      setTimeout(() => {
        if (session?.user) {
          void navigate({ to: accountHome(session.user) })
        } else {
          void navigate({ to: ROUTES.dogs })
        }
      }, 1500)
    } catch {
      setAcceptError("Přijetí pozvánky se nezdařilo. Zkontrolujte prosím své připojení.")
    }
  }

  if (!code) {
    return (
      <>
        <Seo title="Pozvánka" />
        <AuthLayout
          title="Pozvánka do TrainLoopu"
          description="Nebyl zadán žádný kód pozvánky."
          footer={
            <Link
              to={ROUTES.home}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Zpět na úvodní stránku
            </Link>
          }
        >
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>Chybí kód pozvánky</AlertTitle>
              <AlertDescription>
                Pro přijetí pozvánky klikněte na odkaz v e-mailu od trenéra, nebo zadejte kód na
                úvodní stránce v sekci „Mám pozvánku“.
              </AlertDescription>
            </Alert>
            <Button
              asChild
              className="w-full"
            >
              <Link to={ROUTES.home}>Přejít na úvodní stránku</Link>
            </Button>
          </div>
        </AuthLayout>
      </>
    )
  }

  if (isLoading) {
    return (
      <>
        <Seo title="Ověřuji pozvánku…" />
        <AuthLayout
          title="Ověřování pozvánky"
          description="Čekejte prosím, ověřujeme platnost vašeho kódu…"
          footer={null}
        >
          <div className="flex justify-center py-8">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        </AuthLayout>
      </>
    )
  }

  if (isError || !invitation) {
    return (
      <>
        <Seo title="Neplatná pozvánka" />
        <AuthLayout
          title="Neplatná pozvánka"
          description="Pozvánka nebyla nalezena nebo její platnost již vypršela."
          footer={
            <Link
              to={ROUTES.home}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Zpět na úvodní stránku
            </Link>
          }
        >
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Neplatný nebo vypršený kód</AlertTitle>
              <AlertDescription>
                Kód <strong>{code}</strong> není platný, již byl použit, nebo vypršela jeho 14denní
                lhůta. Požádejte svého trenéra o vystavení nové pozvánky.
              </AlertDescription>
            </Alert>
            <Button
              asChild
              className="w-full"
            >
              <Link to={ROUTES.home}>Přejít na úvodní stránku</Link>
            </Button>
          </div>
        </AuthLayout>
      </>
    )
  }

  if (isAccepted) {
    return (
      <>
        <Seo title="Pozvánka přijata" />
        <AuthLayout
          title="Propojení úspěšné!"
          description={`Byli jste úspěšně propojeni s trenérem ${invitation.trainerName}.`}
          footer={null}
        >
          <div className="space-y-4 py-4 text-center">
            <CheckCircle2 className="mx-auto size-12 text-green-600" />
            <p className="text-sm text-muted-foreground">Přesměrovávám do aplikace…</p>
          </div>
        </AuthLayout>
      </>
    )
  }

  return (
    <>
      <Seo title={`Pozvánka od ${invitation.trainerName}`} />
      <AuthLayout
        title="Pozvánka do TrainLoopu"
        description={`Trenér ${invitation.trainerName} vás zve ke spolupráci v aplikaci TrainLoop.`}
        footer={
          <Link
            to={ROUTES.home}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Zpět na úvodní stránku
          </Link>
        }
      >
        <div className="space-y-6">
          <div className="rounded-lg border bg-muted/40 p-4 text-center">
            <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Kód pozvánky
            </span>
            <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-foreground">
              {invitation.code}
            </p>
          </div>

          {acceptError ? (
            <Alert variant="destructive">
              <AlertDescription>{acceptError}</AlertDescription>
            </Alert>
          ) : null}

          {session?.user ? (
            session.user.role === "trainer" ? (
              <Alert>
                <AlertCircle className="size-4" />
                <AlertTitle>Přihlášen jako trenér</AlertTitle>
                <AlertDescription>
                  Jste aktuálně přihlášeni jako trenér ({session.user.email}). Pozvánku může
                  přijmout pouze psovod (klient). Odhlaste se a přihlaste se prosím jako klient.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Jste přihlášeni jako <strong>{session.user.name}</strong> ({session.user.email}).
                </p>
                <Button
                  onClick={handleAccept}
                  disabled={acceptMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {acceptMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Propojuji…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-4" />
                      Přijmout pozvánku a propojit účet
                    </>
                  )}
                </Button>
              </div>
            )
          ) : invitation.isExistingUser ? (
            <div className="space-y-4">
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
                K e-mailu <strong className="text-foreground">{invitation.email}</strong> již
                existuje účet v TrainLoopu. Přihlaste se ke svému účtu a pozvánka od trenéra se
                automaticky propojí.
              </div>
              <div className="space-y-2">
                <Button
                  asChild
                  className="w-full"
                  size="lg"
                >
                  <Link
                    to={ROUTES.login}
                    search={{
                      from: `/invite?code=${invitation.code}`,
                      code: invitation.code,
                    }}
                  >
                    Přihlásit se a propojit účet
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground"
                  size="sm"
                >
                  <Link
                    to={ROUTES.signup}
                    search={{ code: invitation.code }}
                  >
                    Chcete se zaregistrovat s jiným e-mailem?
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                asChild
                className="w-full"
                size="lg"
              >
                <Link
                  to={ROUTES.signup}
                  search={{
                    code: invitation.code,
                    email: invitation.email ?? undefined,
                  }}
                >
                  Zaregistrovat se jako psovod
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Link
                  to={ROUTES.login}
                  search={{
                    from: `/invite?code=${invitation.code}`,
                    code: invitation.code,
                  }}
                >
                  Už mám účet → Přihlásit se
                </Link>
              </Button>
            </div>
          )}
        </div>
      </AuthLayout>
    </>
  )
}
