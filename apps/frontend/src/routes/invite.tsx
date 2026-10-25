import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AlertCircle, CheckCircle2, Loader2, Plus, Sparkles } from "lucide-react"
import { z } from "zod"

import { ROUTES } from "@/app/routes"
import { AuthLayout } from "@/components/AuthLayout"
import { Seo } from "@/components/Seo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { accountHome } from "@/features/auth/lib/account-home"
import { useAcceptInvitation, verifyInvitation } from "@/features/client/api/invitationApi"
import { dogsQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { CreateDogDialog } from "@/features/dog/components/CreateDogDialog"
import { PesAvatar } from "@/features/dog/components/PesAvatar"

const inviteSearchSchema = z.object({
  code: z.string().optional(),
})

export const Route = createFileRoute("/invite")({
  validateSearch: inviteSearchSchema,
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
  const [userSelectedDogIds, setUserSelectedDogIds] = useState<string[] | null>(null)

  const isClient = Boolean(session?.user && session.user.role !== "trainer")

  const { data: dogs = [], isLoading: isLoadingDogs } = useQuery({
    ...dogsQueryOptions(),
    enabled: isClient,
  })

  const selectedDogIds = userSelectedDogIds ?? dogs.map((d) => d.id)

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

  useEffect(() => {
    if (!isAccepted) return
    const timer = setTimeout(() => {
      if (session?.user) {
        void navigate({ to: accountHome(session.user) })
      } else {
        void navigate({ to: ROUTES.dogs })
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [isAccepted, navigate, session])

  const handleAccept = async () => {
    if (!code) return
    if (selectedDogIds.length === 0) {
      setAcceptError("Vyberte alespoň jednoho psa pro sdílení s trenérem.")
      return
    }
    setAcceptError(null)
    try {
      await acceptMutation.mutateAsync({ code, dogIds: selectedDogIds })
      setIsAccepted(true)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAcceptError(err.message)
      } else {
        setAcceptError("Přijetí pozvánky se nezdařilo. Zkontrolujte prosím své připojení.")
      }
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
                Kód <strong>{code}</strong> není platný, již byl použit, nebo vypršela jeho 7denní
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

  const isEmailMismatch = Boolean(
    invitation.email &&
    session?.user?.email &&
    invitation.email.toLowerCase() !== session.user.email.toLowerCase(),
  )

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
            ) : isEmailMismatch ? (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Pozvánka pro jiný e-mail</AlertTitle>
                <AlertDescription>
                  Tato pozvánka je určena pro e-mail <strong>{invitation.email}</strong>, ale vy
                  jste přihlášeni jako <strong>{session.user.email}</strong>. Přihlaste se prosím
                  správným účtem.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Jste přihlášeni jako <strong>{session.user.name}</strong> ({session.user.email}).
                  Vyberte psy, které chcete s trenérem <strong>{invitation.trainerName}</strong>{" "}
                  sdílet.
                </p>

                {isLoadingDogs ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="size-6 animate-spin text-primary" />
                  </div>
                ) : dogs.length === 0 ? (
                  <div className="space-y-3 rounded-lg border border-dashed p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Zatím nemáte v účtu žádného psa. Před přijetím pozvánky je nutné vytvořit
                      profil alespoň jednoho psa pro sdílení s trenérem.
                    </p>
                    <CreateDogDialog
                      existingDogs={dogs}
                      onSuccess={(newDog) => setUserSelectedDogIds([...selectedDogIds, newDog.id])}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="mr-2 size-4" />
                          Založit psa
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Sdílení psi (vyberte alespoň jednoho) *
                      </span>
                      <CreateDogDialog
                        existingDogs={dogs}
                        onSuccess={(newDog) =>
                          setUserSelectedDogIds([...selectedDogIds, newDog.id])
                        }
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                          >
                            <Plus className="mr-1 size-3.5" />
                            Nový pes
                          </Button>
                        }
                      />
                    </div>
                    <div className="space-y-2 rounded-lg border p-3">
                      {dogs.map((dog) => {
                        const isChecked = selectedDogIds.includes(dog.id)
                        return (
                          <label
                            key={dog.id}
                            className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setUserSelectedDogIds([...selectedDogIds, dog.id])
                                } else {
                                  setUserSelectedDogIds(
                                    selectedDogIds.filter((id) => id !== dog.id),
                                  )
                                }
                              }}
                            />
                            <PesAvatar
                              name={dog.name}
                              color={dog.color}
                              photoUrl={dog.photoUrl}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm leading-none font-medium">
                                {dog.name}
                              </p>
                              {dog.breed && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {dog.breed}
                                </p>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                    {selectedDogIds.length === 0 && (
                      <p className="text-xs text-destructive">
                        Je nutné vybrat alespoň jednoho psa.
                      </p>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleAccept}
                  disabled={
                    acceptMutation.isPending || isLoadingDogs || selectedDogIds.length === 0
                  }
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
                existuje účet v TrainLoopu. Přihlaste se ke svému účtu pro výběr psů a potvrzení
                propojení s trenérem.
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
                    Přihlásit se a pokračovat k propojení
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
