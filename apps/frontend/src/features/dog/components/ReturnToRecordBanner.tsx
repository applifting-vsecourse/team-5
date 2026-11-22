import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Contextual bar shown while editing a goal opened from a training record (#68). */
export function ReturnToRecordBanner({
  hasSavedChanges,
  onReturn,
}: {
  hasSavedChanges: boolean
  onReturn: () => void
}) {
  return (
    <div
      role="region"
      aria-label="Návrat na záznam tréninku"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-card border bg-card px-4 py-2.5",
        hasSavedChanges ? "border-primary" : "border-border",
      )}
    >
      <p className="text-sm font-medium text-card-foreground">
        {hasSavedChanges ? "Změny uloženy." : "Ze záznamu tréninku."}
      </p>
      <Button
        type="button"
        variant={hasSavedChanges ? "default" : "outline"}
        size="sm"
        className="min-h-touch shrink-0 font-bold"
        onClick={onReturn}
      >
        <ChevronLeft
          className="size-4"
          aria-hidden
        />
        {hasSavedChanges ? "Hotovo, zpět na záznam" : "Zpět na záznam"}
      </Button>
    </div>
  )
}
