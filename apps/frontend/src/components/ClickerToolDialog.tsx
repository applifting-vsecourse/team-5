import { useState, type ReactNode } from "react"
import { RotateCcw, Vibrate, VibrateOff, Volume2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useClicker } from "@/hooks/useClicker"
import { cn } from "@/lib/utils"

function ClickerToolPanel() {
  const { count, isHapticsSupported, isHapticsEnabled, click, reset, toggleHaptics } = useClicker()

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <button
        type="button"
        onClick={click}
        aria-label="Kliknout"
        className="flex size-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform select-none hover:bg-primary/90 focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95"
      >
        <Volume2
          className="size-11"
          aria-hidden
        />
        <span className="text-xl font-extrabold tracking-tight">Klik</span>
      </button>

      <div className="text-center">
        <p
          role="status"
          aria-live="polite"
          aria-label={`Počet kliknutí: ${count}`}
          className="text-3xl font-extrabold tabular-nums"
        >
          {count}
        </p>
        <p className="text-sm font-medium text-muted-foreground">kliknutí v této relaci</p>
      </div>

      <div className="flex w-full flex-wrap items-center justify-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          disabled={count === 0}
          onClick={reset}
          className="min-w-32 rounded-field bg-card"
        >
          <RotateCcw aria-hidden />
          Vynulovat
        </Button>

        {isHapticsSupported && (
          <Button
            type="button"
            variant="outline"
            onClick={toggleHaptics}
            aria-pressed={isHapticsEnabled}
            className={cn(
              "min-w-36 rounded-field bg-card",
              isHapticsEnabled && "border-primary/40 bg-accent text-primary",
            )}
          >
            {isHapticsEnabled ? <Vibrate aria-hidden /> : <VibrateOff aria-hidden />}
            {isHapticsEnabled ? "Vibrace zapnuty" : "Vibrace vypnuty"}
          </Button>
        )}
      </div>
    </div>
  )
}

type ClickerToolDialogProps = {
  trigger?: ReactNode
}

export function ClickerToolDialog({ trigger }: ClickerToolDialogProps) {
  const [isOpen, setOpen] = useState(false)

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="outline"
            className="rounded-field bg-card font-bold"
            aria-label="Otevřít klikr"
          >
            <Volume2 aria-hidden />
            <span className="hidden sm:inline">Klikr</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-background sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Klikr</DialogTitle>
          <DialogDescription>
            Samostatný rychlý nástroj pro označení psa zvukovým signálem.
          </DialogDescription>
        </DialogHeader>
        {isOpen && <ClickerToolPanel />}
      </DialogContent>
    </Dialog>
  )
}
