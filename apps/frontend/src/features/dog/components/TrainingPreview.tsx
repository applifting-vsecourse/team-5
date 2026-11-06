import { useState } from "react"
import { SkipForward, Target } from "lucide-react"

import { EditorIcon } from "@/components/EditorIcon"
import { EmptyState } from "@/components/EmptyState"
import { TrainingStepScreen } from "@/components/TrainingStepScreen"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

import type { Dog, PlanBlock } from "@/features/dog/api/dogSchemas"

export function TrainingPreview({
  dog,
  title,
  steps,
  isOpen,
  onOpenChange,
}: {
  dog: Pick<Dog, "name" | "color">
  title: string
  steps: PlanBlock[]
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}) {
  const [index, setIndex] = useState(0)
  const next = () => {
    if (index + 1 < steps.length) setIndex((value) => value + 1)
    else onOpenChange(false)
  }
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        showCloseButton={false}
        className="inset-0 block h-dvh max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-0 bg-background p-0 shadow-none sm:max-w-none"
      >
        <DialogTitle className="sr-only">Náhled psovoda</DialogTitle>
        <DialogDescription className="sr-only">
          Náhled tréninku bez ukládání postupu. Zavřením se vrátíš do editoru.
        </DialogDescription>
        <TrainingStepScreen
          title={title}
          dog={dog}
          steps={steps}
          index={index}
          isPreview
          closeControl={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 rounded-field bg-card"
              aria-label="Zavřít náhled"
              onClick={() => onOpenChange(false)}
            >
              <EditorIcon name="X" />
            </Button>
          }
          trailingControl={
            <span className="min-w-touch text-center text-xs font-bold text-muted-foreground">
              Náhled
            </span>
          }
          emptyState={
            <EmptyState
              icon={Target}
              title="Zatím není co zobrazit"
              description="Nejdřív přidej do tréninku krok."
            />
          }
          actions={
            <>
              <Button
                type="button"
                size="lg"
                className="w-full text-action font-bold"
                onClick={next}
              >
                <EditorIcon name="PreviewCheck" />
                {index + 1 < steps.length ? "Hotovo, další krok" : "Dokončit náhled"}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="bg-card"
                  disabled={index === 0}
                  onClick={() => setIndex((value) => value - 1)}
                >
                  Zpět
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="bg-card"
                  onClick={next}
                >
                  <SkipForward />
                  Přeskočit krok
                </Button>
              </div>
            </>
          }
        />
      </DialogContent>
    </Dialog>
  )
}
