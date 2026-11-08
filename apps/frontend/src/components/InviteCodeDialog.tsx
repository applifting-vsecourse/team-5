import { useState, type ReactNode } from "react"
import { useNavigate } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function InviteCodeDialog({ trigger }: { trigger: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isNextOpen) => {
        setOpen(isNextOpen)
        setError("")
        setCode("")
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="public-flow rounded-sheet">
        <DialogHeader>
          <DialogTitle>Mám kód od trenéra</DialogTitle>
          <DialogDescription>
            Kód ti trenér předá na lekci nebo pošle e-mailem. Vybereš si, které psy s ním budeš
            sdílet.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-6"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            const normalized = code.replace(/[-\s]/g, "").toUpperCase()
            if (!/^[A-Z0-9]{6}$/.test(normalized)) {
              setError("Zadej šestimístný kód pozvánky.")
              return
            }
            setOpen(false)
            void navigate({ to: ROUTES.invite, search: { code: normalized } })
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="invite-code">Kód pozvánky</Label>
            <Input
              id="invite-code"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="např. K7M2PQ"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "invite-code-error" : undefined}
              className="font-mono text-xl font-bold tracking-widest"
            />
            {error && (
              <p
                id="invite-code-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2.5">
            <Button
              type="submit"
              size="lg"
            >
              Pokračovat
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setOpen(false)}
            >
              Zrušit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
