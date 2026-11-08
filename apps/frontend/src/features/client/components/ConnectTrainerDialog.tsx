import { useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { HTTPError } from "ky"

import { DesignIcon } from "@/components/DesignIcon"
import { PesAvatar } from "@/components/PesAvatar"
import { QueryState } from "@/components/QueryState"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDesktop } from "@/hooks/useDesktop"

import { useAcceptInvitation, verifyInvitation } from "@/features/client/api/invitationApi"

type SharedDog = {
  id: string
  name: string
  color: number
  breed?: string | null
  photoUrl?: string | null
}
export function ConnectTrainerDialog({
  dogs,
  email,
  isLoading,
  error,
  onRetry,
  createDogAction,
}: {
  dogs: SharedDog[]
  email: string
  isLoading: boolean
  error: Error | null
  onRetry: () => void
  createDogAction: ReactNode
}) {
  const isDesktop = useDesktop()
  const Root = isDesktop ? Dialog : Drawer
  const Content = isDesktop ? DialogContent : DrawerContent
  const Header = isDesktop ? DialogHeader : DrawerHeader
  const Title = isDesktop ? DialogTitle : DrawerTitle
  const Description = isDesktop ? DialogDescription : DrawerDescription
  const Trigger = isDesktop ? DialogTrigger : DrawerTrigger
  const [isOpen, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [code, setCode] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [isSuccess, setSuccess] = useState(false)
  const verify = useQuery({
    queryKey: ["invitation", code],
    queryFn: () => verifyInvitation(code),
    enabled: isOpen && Boolean(code),
    retry: false,
  })
  const accept = useAcceptInvitation()
  const isMismatch = Boolean(
    verify.data?.email && verify.data.email.toLowerCase() !== email.toLowerCase(),
  )
  function changeOpen(isNext: boolean) {
    if (accept.isPending) return
    setOpen(isNext)
    setCode("")
    setInput("")
    setSelected([])
    setMessage("")
    setSuccess(false)
    accept.reset()
  }
  async function submit() {
    setMessage("")
    if (!selected.length) {
      setMessage("Vyber alespoň jednoho psa ke sdílení.")
      return
    }
    try {
      await accept.mutateAsync({ code, dogIds: selected })
      setSuccess(true)
    } catch {
      setMessage("Propojení se nezdařilo. Zkus to znovu nebo požádej trenéra o nový kód.")
    }
  }
  return (
    <Root
      open={isOpen}
      onOpenChange={changeOpen}
    >
      <Trigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
        >
          <DesignIcon name="auth-219-749-IconKey" />
          Mám kód od trenéra
        </Button>
      </Trigger>
      <Content className="public-flow overflow-y-auto rounded-sheet">
        <Header>
          <Title>Mám kód od trenéra</Title>
          <Description>Kód ti trenér předá na lekci nebo pošle e-mailem.</Description>
        </Header>
        <div className="space-y-4 px-5 pb-5 md:px-0 md:pb-0">
          {isSuccess ? (
            <>
              <p
                role="status"
                className="rounded-card bg-success p-4 text-success-foreground"
              >
                Propojení s trenérem {verify.data?.trainerName} je hotové.
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={() => changeOpen(false)}
              >
                Hotovo
              </Button>
            </>
          ) : (
            <>
              <form
                noValidate
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  const normalized = input.replace(/[-\s]/g, "").toUpperCase()
                  if (!/^[A-Z0-9]{6}$/.test(normalized)) {
                    setMessage("Zadej šestimístný kód pozvánky.")
                    return
                  }
                  setMessage("")
                  if (code === normalized) void verify.refetch()
                  else setCode(normalized)
                }}
              >
                <Label htmlFor="account-invite-code">Kód pozvánky</Label>
                <Input
                  id="account-invite-code"
                  value={input}
                  autoCapitalize="characters"
                  autoComplete="off"
                  disabled={accept.isPending}
                  spellCheck={false}
                  onChange={(event) => {
                    setInput(event.target.value.toUpperCase())
                    setCode("")
                  }}
                  placeholder="např. K7M2PQ"
                  className="font-mono text-xl font-extrabold tracking-widest"
                />
                <Button
                  type="submit"
                  variant={verify.data ? "outline" : "default"}
                  size="lg"
                  className="w-full"
                  disabled={verify.isFetching || accept.isPending}
                >
                  {verify.isFetching ? "Ověřuji…" : "Ověřit kód"}
                </Button>
              </form>
              {verify.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {verify.error instanceof HTTPError && verify.error.response.status === 404
                      ? "Kód neexistuje nebo už vypršel. Požádej trenéra o nový kód."
                      : "Pozvánku nelze ověřit. Zkontroluj připojení a zkus to znovu."}
                  </AlertDescription>
                </Alert>
              )}
              {code && verify.isSuccess && (
                <>
                  <div className="flex items-center gap-3 rounded-card bg-accent p-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-hero font-extrabold text-hero-foreground">
                      {verify.data.trainerName.charAt(0)}
                    </span>
                    <div>
                      <p className="font-extrabold">{verify.data.trainerName}</p>
                      <p className="text-sm text-muted-foreground">Trenér</p>
                    </div>
                  </div>
                  {isMismatch ? (
                    <Alert variant="destructive">
                      <AlertDescription>
                        Pozvánka je určená pro jiný e-mail. Požádej trenéra o pozvánku pro {email}.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <h3 className="text-sm font-bold text-muted-foreground">
                        Které psy bude trenér vidět?
                      </h3>
                      <QueryState
                        isLoading={isLoading}
                        error={error}
                        onRetry={onRetry}
                        isEmpty={!dogs.length}
                        empty={
                          <p className="text-sm text-muted-foreground">
                            Nejdřív založ profil svého psa.
                          </p>
                        }
                      >
                        <div className="space-y-2.5">
                          {dogs.map((dog) => (
                            <label
                              key={dog.id}
                              htmlFor={`connect-dog-${dog.id}`}
                              className={`flex min-h-touch cursor-pointer items-center gap-3 rounded-card border p-4 ${selected.includes(dog.id) ? "border-primary bg-accent" : "border-border bg-card"}`}
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
                                id={`connect-dog-${dog.id}`}
                                checked={selected.includes(dog.id)}
                                disabled={accept.isPending}
                                onCheckedChange={(isChecked) =>
                                  setSelected(
                                    isChecked
                                      ? [...selected, dog.id]
                                      : selected.filter((id) => id !== dog.id),
                                  )
                                }
                              />
                            </label>
                          ))}
                        </div>
                      </QueryState>
                      {!accept.isPending && createDogAction}
                      <p className="text-sm text-muted-foreground">
                        Trenér uvidí tréninky, záznamy a cíle vybraných psů. Poznámky z deníku
                        zůstanou jen tvoje.
                      </p>
                      <Button
                        size="lg"
                        className="w-full"
                        disabled={accept.isPending || isLoading || Boolean(error)}
                        onClick={() => {
                          void submit()
                        }}
                      >
                        {accept.isPending ? "Propojuji…" : "Sdílet vybrané psy s trenérem"}
                      </Button>
                    </>
                  )}
                </>
              )}
              {message && (
                <p
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {message}
                </p>
              )}
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                disabled={accept.isPending}
                onClick={() => changeOpen(false)}
              >
                Zrušit
              </Button>
            </>
          )}
        </div>
      </Content>
    </Root>
  )
}
