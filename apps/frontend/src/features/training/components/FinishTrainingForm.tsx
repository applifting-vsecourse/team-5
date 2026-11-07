import { useRef, useState } from "react"

import { DesignIcon } from "@/components/DesignIcon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

import type {
  CompleteTrainingInput,
  FocusLevel,
  MistakeLevel,
} from "@/features/training/api/trainingSchemas"
import { useCompleteTraining } from "@/features/training/hooks/useCompleteTraining"

export type FinishTrainingDog = { id: string; name: string; color?: number; hasTrainer?: boolean }
export type FinishTrainingGoal = { id: string; title: string }
export type FinishTrainingFormProps = {
  trainingId: string
  dog: FinishTrainingDog
  goal: FinishTrainingGoal
  plannedDurationMinutes?: number
  stepCount?: number
  onSubmit?: (data: CompleteTrainingInput) => void | Promise<void>
  isPending?: boolean
}
const mistakeSuggestions = ["Předbíhal", "Čichal po zemi", "Nereagoval napoprvé"]
const selectedClass =
  "min-h-touch flex-1 rounded-control text-sm font-bold data-[state=on]:bg-hero data-[state=on]:text-hero-foreground"

export function FinishTrainingForm({
  trainingId,
  dog,
  goal,
  plannedDurationMinutes,
  stepCount,
  onSubmit: customOnSubmit,
  isPending: isPendingProp,
}: FinishTrainingFormProps) {
  const complete = useCompleteTraining(trainingId, dog.id)
  const isPending = isPendingProp ?? complete.isPending
  const submissionLock = useRef(false)
  const [successRate, setRate] = useState<number | null>(null)
  const [focus, setFocus] = useState<FocusLevel | null>(null)
  const [repeatedMistakes, setMistakes] = useState<MistakeLevel | null>(null)
  const [mistakeDetails, setDetails] = useState<string[]>([])
  const [customMistakes, setCustomMistakes] = useState<string[]>([])
  const [shouldAddCustom, setAddCustom] = useState(false)
  const [customMistake, setCustomMistake] = useState("")
  const [videoUrl, setVideo] = useState("")
  const [note, setNote] = useState("")
  const addCustom = () => {
    const value = customMistake.trim()
    if (!value || value.length > 60 || mistakeDetails.length >= 10) return
    const existing = [...mistakeSuggestions, ...customMistakes].find(
      (item) => item.toLocaleLowerCase("cs-CZ") === value.toLocaleLowerCase("cs-CZ"),
    )
    const next = existing ?? value
    if (!existing) setCustomMistakes((items) => [...items, value])
    setDetails((items) => (items.includes(next) ? items : [...items, next]))
    setCustomMistake("")
    setAddCustom(false)
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submissionLock.current || isPending) return
    const payload: CompleteTrainingInput = {}
    if (successRate !== null) payload.successRate = successRate
    if (focus) payload.focus = focus
    if (repeatedMistakes) payload.repeatedMistakes = repeatedMistakes
    if (repeatedMistakes === "YES" && mistakeDetails.length) payload.mistakeDetails = mistakeDetails
    if (videoUrl.trim()) payload.videoUrl = videoUrl.trim()
    if (note.trim()) payload.note = note.trim()
    submissionLock.current = true
    try {
      if (customOnSubmit) await customOnSubmit(payload)
      else await complete.mutateAsync(payload)
    } catch {
      // The mutation reports failure; retain every field for a retry.
    } finally {
      submissionLock.current = false
    }
  }
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-gutter py-5">
      <header className="space-y-3 rounded-hero bg-success-foreground p-5 text-primary-foreground">
        <span className="flex size-12 items-center justify-center rounded-full bg-card">
          <DesignIcon name="finish-Check" />
        </span>
        <h1 className="text-page font-extrabold tracking-tight">Odcvičeno!</h1>
        <p className="text-sm">
          {dog.name} · {goal.title}
          {plannedDurationMinutes != null && plannedDurationMinutes > 0
            ? ` · plán ${plannedDurationMinutes} min`
            : ""}
          {stepCount != null
            ? ` · ${stepCount} ${stepCount === 1 ? "krok plánu" : stepCount < 5 ? "kroky plánu" : "kroků plánu"}`
            : ""}
        </p>
      </header>
      <form onSubmit={(event) => void submit(event)}>
        <fieldset
          disabled={isPending}
          className="space-y-6"
        >
          <section className="space-y-4 rounded-card border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <Label
                htmlFor="success-rate-slider"
                className="font-bold"
              >
                Úspěšnost
              </Label>
              <span
                className="text-2xl font-extrabold text-primary"
                data-testid="success-rate-value"
              >
                {successRate == null ? "— %" : `${successRate} %`}
              </span>
            </div>
            <Slider
              id="success-rate-slider"
              min={0}
              max={100}
              step={10}
              value={[successRate ?? 50]}
              onValueChange={(values) => setRate(values[0] ?? null)}
              aria-label="Úspěšnost"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0 %</span>
              {successRate != null && (
                <Button
                  type="button"
                  variant="link"
                  className="min-h-touch px-2 text-xs"
                  onClick={() => setRate(null)}
                  aria-label="Zrušit nastavení úspěšnosti"
                >
                  Zrušit
                </Button>
              )}
              <span>100 %</span>
            </div>
          </section>
          <section className="space-y-3 rounded-card border border-border bg-card p-4">
            <Label className="font-bold">Soustředění</Label>
            <ToggleGroup
              type="single"
              spacing={1}
              value={focus ?? ""}
              onValueChange={(value) => setFocus(value ? (value as FocusLevel) : null)}
              aria-label="Soustředění"
              className="flex w-full rounded-control bg-secondary p-1"
            >
              {(
                [
                  ["YES", "Ano"],
                  ["PARTIALLY", "Částečně"],
                  ["NO", "Ne"],
                ] as const
              ).map(([value, label]) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  className={selectedClass}
                >
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </section>
          <section className="space-y-3 rounded-card border border-border bg-card p-4">
            <Label className="font-bold">Opakoval chyby?</Label>
            <ToggleGroup
              type="single"
              spacing={1}
              value={repeatedMistakes ?? ""}
              onValueChange={(value) => setMistakes(value ? (value as MistakeLevel) : null)}
              aria-label="Opakované chyby"
              className="flex w-full rounded-control bg-secondary p-1"
            >
              {(
                [
                  ["YES", "Ano"],
                  ["NO", "Ne"],
                ] as const
              ).map(([value, label]) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  className={selectedClass}
                >
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {repeatedMistakes === "YES" && (
              <>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Podrobnosti opakovaných chyb"
                >
                  {[...mistakeSuggestions, ...customMistakes].map((detail) => {
                    const isSelected = mistakeDetails.includes(detail)
                    return (
                      <Button
                        key={detail}
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-pressed={isSelected}
                        disabled={!isSelected && mistakeDetails.length >= 10}
                        onClick={() =>
                          setDetails((items) =>
                            items.includes(detail)
                              ? items.filter((item) => item !== detail)
                              : [...items, detail],
                          )
                        }
                        className={cn(
                          "rounded-full text-xs",
                          isSelected && "border-primary bg-accent text-primary",
                        )}
                      >
                        {isSelected && <DesignIcon name="finish-Check1" />}
                        {detail}
                      </Button>
                    )
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => setAddCustom(!shouldAddCustom)}
                    disabled={mistakeDetails.length >= 10}
                  >
                    + vlastní
                  </Button>
                </div>
                {shouldAddCustom && (
                  <div className="flex items-end gap-2">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Label htmlFor="custom-mistake">Vlastní chyba</Label>
                      <Input
                        id="custom-mistake"
                        value={customMistake}
                        onChange={(event) => setCustomMistake(event.target.value)}
                        maxLength={60}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault()
                            addCustom()
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={addCustom}
                      disabled={!customMistake.trim()}
                    >
                      Přidat
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
          <div className="space-y-2">
            <Label
              htmlFor="training-video-url"
              className="font-bold"
            >
              Odkaz na video
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                <DesignIcon name="finish-Link" />
              </span>
              <Input
                id="training-video-url"
                type="url"
                inputMode="url"
                value={videoUrl}
                onChange={(event) => setVideo(event.target.value)}
                placeholder="https://youtube.com/watch?v=…"
                maxLength={500}
                className="pl-10"
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Video se nenahrává, stačí odkaz (YouTube neveřejné, Google Disk).
            </p>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="training-note"
              className="font-bold"
            >
              {dog.hasTrainer ? "Poznámka pro trenéra" : "Poznámka"}
            </Label>
            <Textarea
              id="training-note"
              aria-label="Poznámka"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={2000}
              placeholder="Jak trénink probíhal, co šlo a co zlepšit…"
              className="min-h-24 resize-y"
            />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {dog.hasTrainer
              ? `Všechna pole jsou volitelná. Záznam uvidí váš trenér u ${dog.name}.`
              : `Všechna pole jsou volitelná. Záznam se uloží do deníku ${dog.name}.`}
          </p>
          {complete.isError && (
            <p
              role="alert"
              className="text-sm text-destructive"
            >
              Záznam se nepodařilo uložit. Vyplněné údaje zůstaly zachované.
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full text-action font-bold"
            disabled={isPending}
          >
            <DesignIcon name="finish-Check2" />
            {isPending ? "Ukládám…" : "Uložit záznam"}
          </Button>
        </fieldset>
      </form>
    </div>
  )
}
