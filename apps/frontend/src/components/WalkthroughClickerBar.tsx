import { RotateCcw, Vibrate, VibrateOff, Volume2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useClicker } from "@/hooks/useClicker"
import { cn } from "@/lib/utils"

export function WalkthroughClickerBar() {
  const { count, isHapticsSupported, isHapticsEnabled, click, reset, toggleHaptics } = useClicker()

  return (
    <div
      className="flex items-center gap-2"
      role="region"
      aria-label="Klikr"
    >
      <Button
        type="button"
        variant="outline"
        onClick={click}
        className="h-14 flex-1 justify-between rounded-control border-primary/30 bg-accent px-4 text-action font-extrabold text-primary transition-transform hover:bg-accent/80 active:scale-[0.98]"
      >
        <span className="flex items-center gap-2.5">
          <Volume2
            className="size-5"
            aria-hidden
          />
          <span>Klikr</span>
        </span>
        <span
          role="status"
          aria-live="polite"
          aria-label={`Počet kliknutí: ${count}`}
          className="inline-flex min-w-8 items-center justify-center rounded-full bg-primary px-2.5 py-0.5 text-sm font-extrabold text-primary-foreground tabular-nums"
        >
          {count}
        </span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={count === 0}
        onClick={reset}
        aria-label="Vynulovat počítadlo kliknutí"
        title="Vynulovat počítadlo"
        className="size-14 shrink-0 rounded-control bg-card"
      >
        <RotateCcw aria-hidden />
      </Button>

      {isHapticsSupported && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleHaptics}
          aria-pressed={isHapticsEnabled}
          aria-label={isHapticsEnabled ? "Vypnout haptickou odezvu" : "Zapnout haptickou odezvu"}
          title={isHapticsEnabled ? "Haptická odezva zapnuta" : "Haptická odezva vypnuta"}
          className={cn(
            "size-14 shrink-0 rounded-control bg-card",
            isHapticsEnabled && "border-primary/40 bg-accent text-primary",
          )}
        >
          {isHapticsEnabled ? <Vibrate aria-hidden /> : <VibrateOff aria-hidden />}
        </Button>
      )}
    </div>
  )
}
