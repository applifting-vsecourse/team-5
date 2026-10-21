import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
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
  disciplines: string[]
  defaultValues?: Partial<GoalFormValues>
  isPending: boolean
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
  onSubmit,
  onSubmitAndSchedule,
}: GoalFormProps) {
  // Keep a discipline the goal already has selectable even if the dog no
  // longer lists it, so opening the form never silently changes the goal.
  // An empty discipline means "none".
  const current = defaultValues?.discipline === "" ? undefined : defaultValues?.discipline
  const disciplineOptions =
    current && !disciplines.includes(current) ? [...disciplines, current] : disciplines

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      // The first discipline is only a convenience for a new goal. An existing
      // goal keeps what it has, including "" (no discipline).
      discipline: defaultValues?.discipline ?? disciplineOptions[0] ?? "",
      principle: defaultValues?.principle ?? "",
    },
  })

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
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
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {disciplineOptions.length > 0 ? (
          <FormField
            control={form.control}
            name="discipline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Disciplína</FormLabel>
                <Select
                  value={field.value || NO_DISCIPLINE}
                  onValueChange={(value) => field.onChange(value === NO_DISCIPLINE ? "" : value)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full data-[size=default]:h-11">
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
                  className="min-h-24"
                  {...field}
                />
              </FormControl>
              <FormDescription>Čeho docílit a na co si dát pozor.</FormDescription>
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
              disabled={isPending}
            >
              Uložit
            </Button>
            <Button
              type="button"
              size="lg"
              className="min-h-11"
              disabled={isPending}
              onClick={form.handleSubmit(onSubmitAndSchedule)}
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
            disabled={isPending}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Uložit
          </Button>
        )}
      </form>
    </Form>
  )
}
