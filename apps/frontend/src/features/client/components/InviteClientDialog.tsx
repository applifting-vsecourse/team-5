import { useState } from "react"
import { CheckCircle2, Loader2, Mail } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
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

import type { Invitation } from "@/features/client/api/clientSchemas"
import { useInviteClient } from "@/features/client/api/inviteClient"

type InviteClientDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function InviteClientDialog({ isOpen, onOpenChange }: InviteClientDialogProps) {
  const [email, setEmail] = useState("")
  const [createdInvitation, setCreatedInvitation] = useState<Invitation | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const inviteMutation = useInviteClient()

  const handleOpenChange = (isOpenNext: boolean) => {
    if (!isOpenNext) {
      setEmail("")
      setCreatedInvitation(null)
      setErrorMessage(null)
    }
    onOpenChange(isOpenNext)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return

    setErrorMessage(null)
    try {
      const inv = await inviteMutation.mutateAsync(trimmedEmail)
      setCreatedInvitation(inv)
    } catch {
      setErrorMessage("Odeslání pozvánky se nezdařilo. Zkontrolujte e-mail a zkuste to znovu.")
    }
  }

  const handleGenerateOnlyCode = async () => {
    setErrorMessage(null)
    try {
      const inv = await inviteMutation.mutateAsync(undefined)
      setCreatedInvitation(inv)
    } catch {
      setErrorMessage("Vygenerování kódu se nezdařilo. Zkuste to prosím znovu.")
    }
  }

  const handleInviteAnother = () => {
    setEmail("")
    setCreatedInvitation(null)
    setErrorMessage(null)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        {createdInvitation ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="size-6 text-green-600" />
              </div>
              <DialogTitle className="text-center">
                {createdInvitation.email ? "Pozvánka odeslána" : "Kód pozvánky vygenerován"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {createdInvitation.email ? (
                  <>
                    Pozvánka byla úspěšně odeslána na e-mail{" "}
                    <strong className="text-foreground">{createdInvitation.email}</strong>.
                  </>
                ) : (
                  "Předejte tento 6místný kód svému klientovi na lekci nebo osobně."
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 rounded-lg border bg-muted/40 p-4 text-center">
              <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Vygenerovaný kód pozvánky
              </span>
              <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-foreground">
                {createdInvitation.code}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Klient může kliknout na odkaz v e-mailu nebo zadat tento kód na úvodní stránce či ve
                svém účtu. Platnost je 14 dní.
              </p>
            </div>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={handleInviteAnother}
                className="w-full sm:w-auto"
              >
                Pozvat dalšího klienta
              </Button>
              <Button
                onClick={() => handleOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Hotovo
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Pozvat klienta e-mailem</DialogTitle>
              <DialogDescription>
                Zadejte e-mail klienta pro odeslání pozvánky s odkazem, nebo si jen vygenerujte kód
                pro předání na lekci.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="client-invite-email">E-mail klienta</Label>
                <div className="relative">
                  <Input
                    id="client-invite-email"
                    type="email"
                    placeholder="klient@email.cz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={inviteMutation.isPending}
                  />
                </div>
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleGenerateOnlyCode}
                  disabled={inviteMutation.isPending}
                >
                  Nebo vygenerovat pouze kód (bez e-mailu)
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={inviteMutation.isPending}
              >
                Zrušit
              </Button>
              <Button
                type="submit"
                disabled={inviteMutation.isPending || !email.trim()}
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Odesílám…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 size-4" />
                    Odeslat pozvánku
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
