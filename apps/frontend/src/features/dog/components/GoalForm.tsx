import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { goalFormSchema, type GoalFormValues } from "@/features/dog/api/dogSchemas"

type GoalFormProps = {
  submitLabel?: string
  disciplines: string[]
  defaultValues?: Partial<GoalFormValues>
  isPending: boolean
  onAddDiscipline?: (name: string) => void | Promise<void>
  onSubmit: (values: GoalFormValues) => void | Promise<void>
  // When given, the form offers "Uložit a naplánovat" as its main action (#71).
  onSubmitAndSchedule?: (values: GoalFormValues) => void | Promise<void>
}

// Radix Select rejects an empty item value, so "none" gets a stand-in that
// is mapped back to "" (the API's "no discipline") on change.
const NO_DISCIPLINE = "__none__"

export function GoalForm({
  disciplines,
  defaultValues,
  isPending,
  onAddDiscipline,
  onSubmit,
  onSubmitAndSchedule,
  submitLabel = "Uložit",
}: GoalFormProps) {
  const [addedDisciplines, setAddedDisciplines] = useState<string[]>([])
  const [isAddingDiscipline, setIsAddingDiscipline] = useState(false)
  const [newDiscipline, setNewDiscipline] = useState("")
  const [isSavingDiscipline, setIsSavingDiscipline] = useState(false)
  const [disciplineError, setDisciplineError] = useState<string | null>(null)

  // Keep a discipline the goal already has selectable even if the dog no
  // longer lists it, so opening the form never silently changes the goal.
  // An empty discipline means "none".
  const current = defaultValues?.discipline === "" ? undefined : defaultValues?.discipline
  const mergedDisciplines = [
    ...disciplines,
    ...addedDisciplines.filter(
      (item) => !disciplines.some((existing) => existing.toLowerCase() === item.toLowerCase()),
    ),
  ]
  const disciplineOptions =
    current && !mergedDisciplines.includes(current)
      ? [...mergedDisciplines, current]
      : mergedDisciplines

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      // The first discipline is only a convenience for a new goal. An existing
      // goal keeps what it has, including "" (no discipline).
      discipline: defaultValues?.discipline ?? disciplineOptions[0] ?? "",
      principle: defaultValues?.principle ?? "",
      criterion: defaultValues?.criterion,
      deadline: defaultValues?.deadline,
    },
  })

  const handleAddDiscipline = async () => {
    if (!onAddDiscipline || isPending || isSavingDiscipline) return
    const trimmed = newDiscipline.trim()
    if (!trimmed) {
      setDisciplineError("Zadej název disciplíny.")
      return
    }
    if (trimmed.length > 40) {
      setDisciplineError("Název disciplíny může mít nejvýš 40 znaků.")
      return
    }
    const existing = disciplineOptions.find((item) => item.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      form.setValue("discipline", existing, { shouldDirty: true })
      setNewDiscipline("")
      setDisciplineError(null)
      setIsAddingDiscipline(false)
      return
    }
    setIsSavingDiscipline(true)
    setDisciplineError(null)
    try {
      await onAddDiscipline(trimmed)
      setAddedDisciplines((prev) => [...prev, trimmed])
      form.setValue("discipline", trimmed, { shouldDirty: true })
      setNewDiscipline("")
      setIsAddingDiscipline(false)
    } catch {
      setDisciplineError("Disciplínu se nepodařilo přidat. Zkus to znovu.")
    } finally {
      setIsSavingDiscipline(false)
    }
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={(event) => {
          if (isPending || isSavingDiscipline) {
            event.preventDefault()
            return
          }
          void form.handleSubmit(onSubmit)(event)
        }}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Název cíle</FormLabel>
              <FormControl>
                <Input
                  placeholder="např. Spolehlivá chůze u nohy"
                  className="min-h-field rounded-field"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {disciplineOptions.length > 0 || onAddDiscipline ? (
          <FormField
            control={form.control}
            name="discipline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Disciplína</FormLabel>
                {disciplineOptions.length > 0 && (
                  <Select
                    value={field.value || NO_DISCIPLINE}
                    onValueChange={(value) => field.onChange(value === NO_DISCIPLINE ? "" : value)}
                  >
                    <FormControl>
                      <SelectTrigger className="min-h-field w-full rounded-field">
                        <SelectValue placeholder="Vyberte disciplínu" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_DISCIPLINE}>Bez disciplíny</SelectItem>
                      {disciplineOptions.map((discipline) => (
                        <SelectItem
                          key={discipline}
                          value={discipline}
                        >
                          {discipline}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {onAddDiscipline &&
                  (isAddingDiscipline ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-2">
                        <Input
                          aria-label="Nová disciplína"
                          placeholder="např. Agility"
                          value={newDiscipline}
                          maxLength={40}
                          disabled={isPending || isSavingDiscipline}
                          className="min-h-field rounded-field"
                          onChange={(e) => {
                            setNewDiscipline(e.target.value)
                            setDisciplineError(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              void handleAddDiscipline()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-field shrink-0 rounded-field"
                          disabled={isPending || isSavingDiscipline}
                          onClick={() => void handleAddDiscipline()}
                        >
                          {isSavingDiscipline ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            "Přidat"
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="min-h-field shrink-0 rounded-field"
                          disabled={isPending || isSavingDiscipline}
                          onClick={() => {
                            setIsAddingDiscipline(false)
                            setNewDiscipline("")
                            setDisciplineError(null)
                          }}
                        >
                          Zrušit
                        </Button>
                      </div>
                      {disciplineError && (
                        <p className="text-sm font-medium text-destructive">{disciplineError}</p>
                      )}
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-touch w-fit rounded-field"
                      disabled={isPending || isSavingDiscipline}
                      onClick={() => setIsAddingDiscipline(true)}
                    >
                      <Plus className="size-4" />
                      Nová disciplína
                    </Button>
                  ))}
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Pes zatím nemá žádnou disciplínu, cíl se uloží bez ní.
          </p>
        )}

        <FormField
          control={form.control}
          name="principle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Princip</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="např. Pes jde u levé nohy s hlavou u kolena. Pozor na předbíhání v zatáčkách."
                  className="min-h-field rounded-field"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="criterion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hotovo, když…</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Pes udrží pozici 30 s mezi psy a lidmi."
                  className="min-h-20 rounded-field"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Termín (nepovinný)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="date"
                  className="min-h-field rounded-field"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {onSubmitAndSchedule ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="submit"
              size="lg"
              variant="outline"
              className="min-h-11"
              disabled={isPending || isSavingDiscipline}
            >
              Uložit
            </Button>
            <Button
              type="button"
              size="lg"
              className="min-h-11"
              disabled={isPending || isSavingDiscipline}
              onClick={(event) => {
                if (isPending || isSavingDiscipline) return
                void form.handleSubmit(onSubmitAndSchedule)(event)
              }}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Uložit a naplánovat
            </Button>
          </div>
        ) : (
          <Button
            type="submit"
            size="lg"
            className="min-h-11 w-full"
            disabled={isPending || isSavingDiscipline}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
        )}
      </form>
    </Form>
  )
}
