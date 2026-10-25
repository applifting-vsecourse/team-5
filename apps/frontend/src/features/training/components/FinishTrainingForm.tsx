import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import type {
  CompleteTrainingInput,
  FocusLevel,
  MistakeLevel,
} from "@/features/training/api/trainingSchemas"
import { useCompleteTraining } from "@/features/training/hooks/useCompleteTraining"

export type FinishTrainingDog = {
  id: string
  name: string
  color?: number
  hasTrainer?: boolean
}

export type FinishTrainingGoal = {
  id: string
  title: string
}

export type FinishTrainingFormProps = {
  trainingId: string
  dog: FinishTrainingDog
  goal: FinishTrainingGoal
  onSubmit?: (data: CompleteTrainingInput) => void | Promise<void>
  isPending?: boolean
}

export function FinishTrainingForm({
  trainingId,
  dog,
  goal,
  onSubmit: customOnSubmit,
  isPending: isPendingProp,
}: FinishTrainingFormProps) {
  const completeMutation = useCompleteTraining(trainingId, dog.id)
  const isPending = isPendingProp ?? completeMutation.isPending

  const [successRate, setSuccessRate] = useState<number | null>(null)
  const [focus, setFocus] = useState<FocusLevel | null>(null)
  const [repeatedMistakes, setRepeatedMistakes] = useState<MistakeLevel | null>(null)
  const [note, setNote] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload: CompleteTrainingInput = {}
    if (successRate !== null) {
      payload.successRate = successRate
    }
    if (focus) {
      payload.focus = focus
    }
    if (repeatedMistakes) {
      payload.repeatedMistakes = repeatedMistakes
    }
    const trimmedNote = note.trim()
    if (trimmedNote.length > 0) {
      payload.note = trimmedNote
    }

    if (customOnSubmit) {
      void customOnSubmit(payload)
    } else {
      completeMutation.mutate(payload)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-2xl flex-col bg-background">
      {/* Subpage Header matching Figma node 51:345 */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        <Link
          to="/week"
          aria-label="Zpět na týden"
          className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
          Jak to šlo?
        </h2>
      </header>

      {/* Form Content */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-5 px-4 py-6"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {dog.name} · {goal.title}
        </h1>

        {/* Úspěšnost (Slider) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Label
              htmlFor="success-rate-slider"
              className="font-medium text-foreground"
            >
              Úspěšnost
            </Label>
            <div className="flex items-center gap-2">
              <span
                className="text-base font-medium text-foreground"
                data-testid="success-rate-value"
              >
                {successRate !== null ? `${successRate} %` : "— %"}
              </span>
              {successRate !== null && (
                <button
                  type="button"
                  onClick={() => setSuccessRate(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Zrušit nastavení úspěšnosti"
                >
                  Zrušit
                </button>
              )}
            </div>
          </div>
          <Slider
            id="success-rate-slider"
            min={0}
            max={100}
            step={10}
            value={successRate !== null ? [successRate] : [50]}
            onValueChange={(val) => setSuccessRate(val[0] ?? null)}
            aria-label="Úspěšnost"
          />
        </div>

        {/* Soustředění */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Soustředění</Label>
          <ToggleGroup
            type="single"
            value={focus ?? ""}
            onValueChange={(val) => setFocus(val ? (val as FocusLevel) : null)}
            className="flex w-full gap-1 rounded-md bg-muted p-1"
            aria-label="Soustředění"
          >
            <ToggleGroupItem
              value="YES"
              className="flex-1 rounded py-2 text-sm text-muted-foreground data-[state=on]:bg-background data-[state=on]:font-medium data-[state=on]:text-foreground"
            >
              Ano
            </ToggleGroupItem>
            <ToggleGroupItem
              value="PARTIALLY"
              className="flex-1 rounded py-2 text-sm text-muted-foreground data-[state=on]:bg-background data-[state=on]:font-medium data-[state=on]:text-foreground"
            >
              Částečně
            </ToggleGroupItem>
            <ToggleGroupItem
              value="NO"
              className="flex-1 rounded py-2 text-sm text-muted-foreground data-[state=on]:bg-background data-[state=on]:font-medium data-[state=on]:text-foreground"
            >
              Ne
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Opakované chyby */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Opakované chyby</Label>
          <ToggleGroup
            type="single"
            value={repeatedMistakes ?? ""}
            onValueChange={(val) => setRepeatedMistakes(val ? (val as MistakeLevel) : null)}
            className="flex w-full gap-1 rounded-md bg-muted p-1"
            aria-label="Opakované chyby"
          >
            <ToggleGroupItem
              value="YES"
              className="flex-1 rounded py-2 text-sm text-muted-foreground data-[state=on]:bg-background data-[state=on]:font-medium data-[state=on]:text-foreground"
            >
              Ano
            </ToggleGroupItem>
            <ToggleGroupItem
              value="PARTIALLY"
              className="flex-1 rounded py-2 text-sm text-muted-foreground data-[state=on]:bg-background data-[state=on]:font-medium data-[state=on]:text-foreground"
            >
              Částečně
            </ToggleGroupItem>
            <ToggleGroupItem
              value="NO"
              className="flex-1 rounded py-2 text-sm text-muted-foreground data-[state=on]:bg-background data-[state=on]:font-medium data-[state=on]:text-foreground"
            >
              Ne
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Poznámka (Textarea) */}
        <div className="space-y-2">
          <Label
            htmlFor="training-note"
            className="text-sm font-medium text-foreground"
          >
            Poznámka
          </Label>
          <Textarea
            id="training-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Jak trénink probíhal, co šlo a co zlepšit…"
            className="min-h-24 resize-y text-base sm:text-sm"
            maxLength={2000}
          />
        </div>

        {/* Pomocný text */}
        <p className="text-sm text-muted-foreground">
          {dog.hasTrainer
            ? `Všechna pole jsou volitelná. Záznam uvidí váš trenér u ${dog.name}.`
            : `Všechna pole jsou volitelná. Záznam se uloží do deníku ${dog.name}.`}
        </p>

        {/* Spacer to push button down on mobile */}
        <div className="min-h-4 flex-1" />

        {/* Submit button */}
        <Button
          type="submit"
          className="h-11 w-full text-sm font-medium"
          disabled={isPending}
        >
          {isPending ? "Ukládám…" : "Uložit záznam"}
        </Button>
      </form>
    </div>
  )
}
