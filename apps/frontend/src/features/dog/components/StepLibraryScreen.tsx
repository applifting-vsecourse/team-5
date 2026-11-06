import { useState } from "react"
import { Target } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import { stepTemplates } from "@/features/dog/api/trainingEditor"

import { EditorIcon } from "./EditorIcon"

const iconSurfaces = {
  whistle: "bg-success-foreground",
  dogs: "bg-info-foreground",
  run: "bg-primary",
  stay: "bg-primary",
  heel: "bg-warning-foreground",
  start: "bg-primary",
  calm: "bg-info-foreground",
} as const

export function StepLibraryScreen({
  selected,
  onSelectedChange,
  isPending,
  error,
  onInsert,
  onBack,
  onCreate,
}: {
  selected: string[]
  onSelectedChange: (ids: string[]) => void
  isPending: boolean
  error: string | null
  onInsert: () => void
  onBack: () => void
  onCreate: () => void
}) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Vše")
  const templates = stepTemplates.filter(
    (t) =>
      (category === "Vše" || t.category === category) &&
      `${t.title} ${t.criterion}`.toLocaleLowerCase("cs").includes(search.toLocaleLowerCase("cs")),
  )
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-gutter pt-6 pb-32">
      <header className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="rounded-field"
          onClick={onBack}
          disabled={isPending}
          aria-label="Zpět do tréninku"
        >
          <EditorIcon name="ChevL" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-page font-extrabold tracking-tight">Knihovna kroků</h1>
          <p className="mt-1 text-label text-muted-foreground">
            {stepTemplates.length} vzorových kroků
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-field"
          aria-label="Vytvořit vlastní krok"
          onClick={onCreate}
          disabled={isPending}
        >
          +
        </Button>
      </header>
      <div className="space-y-2">
        <Label
          htmlFor="step-search"
          className="sr-only"
        >
          Vyhledat krok
        </Label>
        <div className="flex items-center gap-2 rounded-field border border-input bg-card px-4">
          <EditorIcon name="Search" />
          <Input
            id="step-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-field border-0 shadow-none"
            placeholder="např. přivolání"
          />
        </div>
      </div>
      <div
        className="flex flex-wrap gap-2"
        aria-label="Kategorie kroků"
      >
        {["Vše", "Přivolání", "Poslušnost", "Canicross", "Socializace"].map((c) => (
          <Button
            key={c}
            variant="outline"
            aria-pressed={c === category}
            className={cn(
              "rounded-full",
              category === c &&
                "bg-hero text-hero-foreground hover:bg-hero-accent hover:text-hero-foreground",
            )}
            onClick={() => setCategory(c)}
          >
            {c}
          </Button>
        ))}
      </div>
      {!templates.length ? (
        <EmptyState
          icon={Target}
          title="Žádný odpovídající krok"
          description="Zkus jiný název nebo kategorii."
        />
      ) : (
        <ul className="space-y-3">
          {templates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                disabled={isPending}
                aria-pressed={selected.includes(t.id)}
                onClick={() =>
                  onSelectedChange(
                    selected.includes(t.id)
                      ? selected.filter((id) => id !== t.id)
                      : [...selected, t.id],
                  )
                }
                className={cn(
                  "flex min-h-touch w-full items-center gap-3 rounded-card border border-border bg-card p-3 text-left",
                  selected.includes(t.id) && "border-primary bg-accent ring-1 ring-primary",
                )}
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-field",
                    iconSurfaces[t.id],
                  )}
                >
                  <EditorIcon name={t.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{t.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {t.durationMinutes} min · {t.category}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    selected.includes(t.id) ? "bg-primary" : "border border-border",
                  )}
                >
                  <EditorIcon name={selected.includes(t.id) ? "Check" : "Plus1"} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className="fixed right-gutter bottom-tab-bar left-gutter z-20 mx-auto mb-4 flex max-w-2xl flex-wrap items-center justify-between gap-3 rounded-card bg-hero p-4 text-hero-foreground md:bottom-4">
        <span className="text-sm font-bold">{selected.length} vybrané</span>
        <Button
          disabled={isPending || !selected.length}
          onClick={onInsert}
        >
          {isPending ? "Vkládám…" : "+ Přidat do tréninku"}
        </Button>
      </div>
    </main>
  )
}
