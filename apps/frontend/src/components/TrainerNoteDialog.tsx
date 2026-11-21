import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Lock } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { todayCalendarDate } from "@/lib/calendarDate"
import {
  GENERAL_NOTE_TARGET,
  trainerNoteFormSchema,
  type TrainerNote,
  type TrainerNoteDog,
  type TrainerNoteFormValues,
} from "@/lib/trainerNotes"

export type TrainerNoteDialogMode = { kind: "create" } | { kind: "edit"; note: TrainerNote }

type TrainerNoteDialogProps = {
  mode: TrainerNoteDialogMode | null
  dogs: TrainerNoteDog[]
  lockedDog?: TrainerNoteDog
  onClose: () => void
  isPending: boolean
  onSubmit: (values: TrainerNoteFormValues) => Promise<void>
}

const valuesFor = (
  mode: TrainerNoteDialogMode | null,
  lockedDog?: TrainerNoteDog,
): TrainerNoteFormValues =>
  mode?.kind === "edit"
    ? {
        date: mode.note.date,
        dogId: lockedDog ? lockedDog.id : (mode.note.dogId ?? GENERAL_NOTE_TARGET),
        title: mode.note.title,
        text: mode.note.text,
      }
    : {
        date: todayCalendarDate(),
        dogId: lockedDog ? lockedDog.id : GENERAL_NOTE_TARGET,
        title: "",
        text: "",
      }

export function TrainerNoteDialog({
  mode,
  dogs,
  lockedDog,
  onClose,
  isPending,
  onSubmit,
}: TrainerNoteDialogProps) {
  const form = useForm<TrainerNoteFormValues>({
    resolver: zodResolver(trainerNoteFormSchema),
    defaultValues: valuesFor(mode, lockedDog),
  })

  useEffect(() => {
    if (mode) form.reset(valuesFor(mode, lockedDog))
  }, [mode, lockedDog, form])

  const isEdit = mode?.kind === "edit"

  return (
    <Dialog
      open={mode !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <DialogHeader>
              <DialogTitle>{isEdit ? "Upravit poznámku" : "Nová poznámka"}</DialogTitle>
              <DialogDescription className="flex items-center gap-1.5">
                <Lock
                  className="size-3.5 shrink-0"
                  aria-hidden
                />
                <span>Soukromá poznámka trenéra. Klient ani jiný trenér ji nevidí.</span>
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Datum</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {lockedDog ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Týká se</p>
                <p className="rounded-field border border-border bg-secondary px-3 py-2.5 text-sm font-medium text-secondary-foreground">
                  {lockedDog.name}
                </p>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="dogId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Týká se</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="min-h-11 w-full">
                          <SelectValue placeholder="Vyberte, čeho se poznámka týká" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={GENERAL_NOTE_TARGET}>Obecné ke klientovi</SelectItem>
                        {dogs.map((dog) => (
                          <SelectItem
                            key={dog.id}
                            value={dog.id}
                          >
                            {dog.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="např. Citlivost na hluk"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="např. Zkrátit úseky a odměňovat za oční kontakt."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={onClose}
              >
                Zrušit
              </Button>
              <Button
                type="submit"
                className="min-h-11"
                disabled={isPending}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEdit ? "Uložit" : "Přidat poznámku"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
