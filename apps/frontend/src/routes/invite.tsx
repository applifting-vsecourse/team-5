import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { HTTPError } from "ky"
import { Check, Clock, CloudOff } from "lucide-react"
import { z } from "zod"

import { ROUTES } from "@/app/routes"
import { AuthBrand } from "@/components/AuthLayout"
import { DesignIcon } from "@/components/DesignIcon"
import { EmptyState } from "@/components/EmptyState"
import { InviteCodeDialog } from "@/components/InviteCodeDialog"
import { QueryState } from "@/components/QueryState"
import { Seo } from "@/components/Seo"
import { StatusChip } from "@/components/StatusChip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { useSignOut } from "@/features/auth/hooks/useSignOut"
import { accountHome } from "@/features/auth/lib/account-home"
import { useAcceptInvitation, verifyInvitation } from "@/features/client/api/invitationApi"
import { dogsQueryOptions } from "@/features/dog/api/dogsQueryOptions"
import { CreateDogDialog } from "@/features/dog/components/CreateDogDialog"
import { PesAvatar } from "@/features/dog/components/PesAvatar"

export const Route = createFileRoute("/invite")({
  validateSearch: z.object({ code: z.string().optional() }),
  component: InvitePage,
})
function InvitePage() {
  const { code: rawCode } = Route.useSearch()
  const navigate = useNavigate()
  const code = rawCode?.replace(/[-\s]/g, "").toUpperCase() ?? ""
  const session = useQuery(authSessionQueryOptions())
  const invitation = useQuery({
    queryKey: ["invitation", code],
    queryFn: () => verifyInvitation(code),
    enabled: Boolean(code),
    retry: false,
  })
  const isClient = Boolean(session.data?.user && session.data.user.role !== "trainer")
  const dogs = useQuery({ ...dogsQueryOptions(), enabled: isClient })
  const ownedDogs = (dogs.data ?? []).filter((dog) => dog.ownerId === session.data?.user.id)
  const [selected, setSelected] = useState<string[] | null>(null)
  const selectedIds = selected ?? ownedDogs.map((dog) => dog.id)
  const accept = useAcceptInvitation()
  const signOut = useSignOut()
  const [isAccepted, setAccepted] = useState(false)
  const [error, setError] = useState("")
  async function acceptInvite() {
    setError("")
    if (!selectedIds.length) {
      setError("Vyberte alespoň jednoho psa pro sdílení s trenérem.")
      return
    }
    try {
      await accept.mutateAsync({ code, dogIds: selectedIds })
      setAccepted(true)
    } catch {
      setError(
        "Přijetí pozvánky se nezdařilo. Zkontroluj připojení a platnost kódu a zkus to znovu.",
      )
    }
  }
  const user = session.data?.user
  const data = invitation.data
  const isMismatch = Boolean(
    data?.email && user?.email && data.email.toLowerCase() !== user.email.toLowerCase(),
  )
  const isInvalid =
    invitation.error instanceof HTTPError && invitation.error.response.status === 404
  return (
    <main className="public-flow min-h-svh bg-background">
      <Seo title={isAccepted ? "Pozvánka přijata" : "Pozvánka do TrainLoopu"} />
      <div className="mx-auto w-full max-w-md pb-10 md:pt-8">
        <div className="px-5 py-6">
          <AuthBrand />
        </div>
        {!code ? (
          <section className="space-y-6 px-5">
            <h1 className="text-page font-extrabold">Mám pozvánku od trenéra</h1>
            <p className="text-sm text-muted-foreground">
              Zadej kód z pozvánky a ověř, s kým budeš svého psa sdílet.
            </p>
            <InviteCodeDialog
              trigger={
                <Button
                  size="lg"
                  className="w-full"
                >
                  Zadat kód pozvánky
                </Button>
              }
            />
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full"
            >
              <Link to={user ? accountHome(user) : ROUTES.signup}>Pokračovat bez trenéra</Link>
            </Button>
          </section>
        ) : session.isPending || invitation.isPending ? (
          <div className="px-5">
            <QueryState
              isLoading
              empty={null}
            >
              <span />
            </QueryState>
          </div>
        ) : session.error || invitation.error || !data ? (
          <section className="space-y-6 px-5">
            <h1 className="sr-only">{isInvalid ? "Neplatná pozvánka" : "Ověření pozvánky"}</h1>
            <EmptyState
              icon={isInvalid ? Clock : CloudOff}
              chip={isInvalid ? "POZVÁNKA VYPRŠELA" : "CHYBA PŘIPOJENÍ"}
              title={isInvalid ? "Pozvánka už neplatí" : "Pozvánku se nepodařilo ověřit"}
              description={
                isInvalid
                  ? "Kód neexistuje, už byl použit nebo vypršela jeho platnost. Požádej trenéra o novou pozvánku."
                  : "Zkontroluj připojení a zkus ověření znovu."
              }
              action={
                !isInvalid ? (
                  <Button
                    size="lg"
                    onClick={() => {
                      void session.refetch()
                      void invitation.refetch()
                    }}
                  >
                    Zkusit znovu
                  </Button>
                ) : undefined
              }
            />
            <InviteCodeDialog
              trigger={
                <Button
                  size="lg"
                  className="w-full"
                  variant={isInvalid ? "default" : "outline"}
                >
                  Ověřit nový kód
                </Button>
              }
            />
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full"
            >
              <Link to={user ? accountHome(user) : ROUTES.signup}>Pokračovat bez trenéra</Link>
            </Button>
            <Link
              to={ROUTES.login}
              search={{ code }}
              className="flex min-h-touch items-center justify-center text-sm font-bold text-primary"
            >
              Už mám účet – přihlásit
            </Link>
          </section>
        ) : isAccepted ? (
          <>
            <header className="space-y-4 rounded-b-sheet bg-primary px-6 py-6 text-primary-foreground md:rounded-sheet">
              <StatusChip tone="hero">Pozvánka přijata</StatusChip>
              <h1 className="text-page font-extrabold">
                Vítej v TrainLoopu, {user?.name.split(" ")[0]}!
              </h1>
              <p className="text-sm">Propojení s trenérem {data.trainerName} je hotové.</p>
            </header>
            <section className="space-y-6 px-5 pt-6">
              <div className="space-y-4 rounded-card border border-border bg-card p-4">
                <h2 className="text-xl font-extrabold">Začínáme</h2>
                <p className="flex items-center gap-3">
                  <Check className="size-6 text-success-foreground" />
                  Přijmout pozvánku
                </p>
                <p className="flex items-start gap-3">
                  <Check className="size-6 shrink-0 text-success-foreground" />
                  <span>
                    Sdílení psi:{" "}
                    {ownedDogs
                      .filter((dog) => selectedIds.includes(dog.id))
                      .map((dog) => dog.name)
                      .join(", ")}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Teď si prohlédni týdenní plán nebo profil svého psa. Cíle a záznamy u sdílených
                  psů už vidí i tvůj trenér. Soukromé poznámky zůstávají tvoje.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="w-full"
              >
                <Link to={ROUTES.week}>Zobrazit týdenní plán</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full"
              >
                <Link to={ROUTES.dogs}>Moji psi</Link>
              </Button>
            </section>
          </>
        ) : (
          <>
            <header className="space-y-4 rounded-b-sheet bg-hero px-6 py-6 text-hero-foreground md:rounded-sheet">
              <StatusChip tone="hero">
                <span className="inline-flex items-center gap-2">
                  <DesignIcon name="auth-142-1518-IconTicket" />
                  POZVÁNKA
                </span>
              </StatusChip>
              <div className="flex items-center gap-3.5">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-card text-2xl font-extrabold text-foreground">
                  {data.trainerName.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-section font-extrabold">{data.trainerName}</p>
                  <p className="text-sm text-hero-muted">Trenér</p>
                </div>
              </div>
              <h1 className="text-section font-extrabold">
                {data.trainerName} tě zve ke společnému tréninku v TrainLoopu.
              </h1>
              {data.expiresAt && (
                <p className="text-sm text-hero-muted">
                  Platí do {new Date(data.expiresAt).toLocaleDateString("cs-CZ")}
                </p>
              )}
            </header>
            <section className="space-y-6 px-5 pt-6">
              <div className="space-y-3">
                <h2 className="font-extrabold">Co tím získáš</h2>
                {[
                  "Cíle a tréninky pro tvého psa od trenéra",
                  "Odpovědi trenéra přímo u každého tréninku",
                  "Přehled pokroku a týdenního plánu psa",
                ].map((text) => (
                  <p
                    key={text}
                    className="flex items-center gap-2.5 text-sm font-semibold"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success">
                      <DesignIcon name="auth-142-1518-IconCheck" />
                    </span>
                    {text}
                  </p>
                ))}
              </div>
              {data.email && (
                <div className="space-y-2">
                  <p className="text-sm font-bold">E-mail pozvánky</p>
                  <p className="rounded-field border border-border bg-card p-3.5 break-all">
                    {data.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pozvánku může přijmout jen účet s tímto e-mailem.
                  </p>
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {!user ? (
                <div className="space-y-2.5">
                  <Button
                    asChild
                    size="lg"
                    className="w-full"
                  >
                    <Link
                      to={data.isExistingUser ? ROUTES.login : ROUTES.signup}
                      search={{ code, email: data.email ?? undefined }}
                    >
                      {" "}
                      {data.isExistingUser
                        ? "Přihlásit se a pokračovat k propojení"
                        : "Přijmout a vytvořit účet"}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full"
                  >
                    <Link
                      to={data.isExistingUser ? ROUTES.signup : ROUTES.login}
                      search={{ code, email: data.email ?? undefined }}
                    >
                      {data.isExistingUser ? "Vytvořit jiný účet" : "Už mám účet – přihlásit"}
                    </Link>
                  </Button>
                </div>
              ) : user.role === "trainer" || isMismatch ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertDescription>
                      {isMismatch
                        ? "Pozvánka pro jiný e-mail. Přihlas se účtem, pro který je pozvánka určena."
                        : "Přihlášen jako trenér. Pozvánku může přijmout pouze psovod."}
                    </AlertDescription>
                  </Alert>
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={signOut.isPending}
                    onClick={() =>
                      signOut.mutate(undefined, {
                        onSuccess: () => {
                          void navigate({ to: ROUTES.login, search: { code }, replace: true })
                        },
                      })
                    }
                  >
                    Odhlásit se a použít jiný účet
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="font-extrabold">Které psy bude trenér vidět?</h2>
                  <QueryState
                    isLoading={dogs.isPending}
                    error={dogs.error}
                    onRetry={() => {
                      void dogs.refetch()
                    }}
                    isEmpty={!ownedDogs.length}
                    empty={
                      <p className="text-sm text-muted-foreground">
                        Zatím nemáš žádného psa. Nejdřív založ jeho profil.
                      </p>
                    }
                  >
                    <div className="space-y-2.5">
                      {ownedDogs.map((dog) => (
                        <label
                          key={dog.id}
                          htmlFor={`invite-dog-${dog.id}`}
                          className={`flex min-h-touch cursor-pointer items-center gap-3 rounded-card border p-4 ${selectedIds.includes(dog.id) ? "border-primary bg-accent" : "border-border bg-card"}`}
                        >
                          <PesAvatar
                            name={dog.name}
                            color={dog.color}
                            photoUrl={dog.photoUrl}
                            size="sm"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-extrabold">{dog.name}</span>
                            <span className="text-xs text-muted-foreground">{dog.breed}</span>
                          </span>
                          <Checkbox
                            id={`invite-dog-${dog.id}`}
                            checked={selectedIds.includes(dog.id)}
                            disabled={accept.isPending}
                            onCheckedChange={(checked) =>
                              setSelected(
                                checked
                                  ? [...selectedIds, dog.id]
                                  : selectedIds.filter((id) => id !== dog.id),
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </QueryState>
                  <CreateDogDialog
                    existingDogs={ownedDogs}
                    onSuccess={(dog) => setSelected([...selectedIds, dog.id])}
                    trigger={
                      <Button
                        variant="outline"
                        disabled={accept.isPending}
                      >
                        {ownedDogs.length ? "Nový pes" : "Založit psa"}
                      </Button>
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Trenér uvidí tréninky, záznamy a cíle vybraných psů. Poznámky z deníku zůstanou
                    jen tvoje.
                  </p>
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={accept.isPending || dogs.isPending || dogs.isError}
                    onClick={() => {
                      void acceptInvite()
                    }}
                  >
                    {accept.isPending ? "Propojuji…" : "Přijmout pozvánku a sdílet psy"}
                  </Button>
                </div>
              )}
              <Button
                asChild
                variant="ghost"
                className="w-full"
              >
                <Link to={user ? accountHome(user) : ROUTES.signup}>Pokračovat bez trenéra</Link>
              </Button>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
