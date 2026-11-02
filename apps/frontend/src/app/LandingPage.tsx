import { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { Check, PawPrint, Users } from "lucide-react"

import { ROUTES } from "@/app/routes"
import { Header } from "@/components/Header/Header"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const TRAINER_BENEFITS = [
  "Zadání mezi lekcemi máte písemně u psa klienta",
  "Klienta připojíte kódem, který mu dáte na lekci",
  "Vidíte jen své klienty a jejich psy",
] as const

const HANDLER_BENEFITS = [
  "V týdnu vidíte, co máte kdy cvičit",
  "Trénink projdete cvik po cviku s kritériem",
  "Po tréninku zapíšete, jak to šlo, trenér to uvidí",
] as const

export function LandingPage() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const navigate = useNavigate()

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedCode = inviteCode.trim().toUpperCase()
    if (!trimmedCode) return
    setIsInviteDialogOpen(false)
    void navigate({
      to: ROUTES.invite,
      search: { code: trimmedCode },
    })
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Seo title="TrainLoop" />
      <Header nav={null} />

      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-6 sm:max-w-xl sm:py-10">
          {/* Úvod */}
          <section className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Zadání z lekce, které klient nezapomene
            </h1>
            <p className="text-base leading-normal text-muted-foreground">
              Trenér zapíše cíl a cviky s instrukcí a kritériem. Psovod je má v telefonu u psa,
              odcvičí je a zapíše, jak to šlo.
            </p>
          </section>

          {/* Akce */}
          <section className="flex flex-col gap-2">
            <Button
              asChild
              className="min-h-11 w-full"
            >
              <Link to={ROUTES.signup}>Zaregistrovat se</Link>
            </Button>
            <Button
              variant="outline"
              className="min-h-11 w-full"
              onClick={() => setIsInviteDialogOpen(true)}
            >
              Mám kód od trenéra
            </Button>
            <Button
              asChild
              variant="ghost"
              className="min-h-11 w-full"
            >
              <Link to={ROUTES.login}>Přihlásit se</Link>
            </Button>
          </section>

          {/* Pro trenéra */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Users className="size-6 text-foreground" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Pro trenéra</h2>
            </div>
            <ul className="flex flex-col gap-3">
              {TRAINER_BENEFITS.map((text) => (
                <li
                  key={text}
                  className="flex items-start gap-2.5"
                >
                  <Check className="mt-0.5 size-5 shrink-0 text-foreground" />
                  <span className="text-base leading-normal text-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Pro psovoda */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <PawPrint className="size-6 text-foreground" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Pro psovoda</h2>
            </div>
            <ul className="flex flex-col gap-3">
              {HANDLER_BENEFITS.map((text) => (
                <li
                  key={text}
                  className="flex items-start gap-2.5"
                >
                  <Check className="mt-0.5 size-5 shrink-0 text-foreground" />
                  <span className="text-base leading-normal text-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <Dialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={handleInviteSubmit}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Mám kód od trenéra</DialogTitle>
              <DialogDescription>
                Zadejte kód pozvánky, který jste obdrželi od trenéra na lekci.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="invite-code">Kód pozvánky</Label>
              <Input
                id="invite-code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="např. KOD123"
                required
              />
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsInviteDialogOpen(false)}
              >
                Zrušit
              </Button>
              <Button type="submit">Pokračovat</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
