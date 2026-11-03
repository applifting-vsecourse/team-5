import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { todayCalendarDate } from "@/lib/calendarDate"

import {
  dogNoteFormSchema,
  type DogNote,
  type DogNoteFormValues,
} from "@/features/dog/api/dogSchemas"

export type DogNoteDialogMode = { kind: "create" } | { kind: "edit"; note: DogNote }

type DogNoteDialogProps = {
  mode: DogNoteDialogMode | null
  onClose: () => void
  isPending: boolean
  onSubmit: (values: DogNoteFormValues) => Promise<void>
}

const valuesFor = (mode: DogNoteDialogMode | null): DogNoteFormValues =>
  mode?.kind === "edit"
    ? {
        date: mode.note.date,
        title: mode.note.title,
        text: mode.note.text,
      }
    : {
        date: todayCalendarDate(),
        title: "",
        text: "",
      }

export function DogNoteDialog({ mode, onClose, isPending, onSubmit }: DogNoteDialogProps) {
  const form = useForm<DogNoteFormValues>({
    resolver: zodResolver(dogNoteFormSchema),
    defaultValues: valuesFor(mode),
  })

  useEffect(() => {
    if (mode) form.reset(valuesFor(mode))
  }, [mode, form])

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
            className="flex flex-col gap-6"
          >
            <DialogHeader>
              <DialogTitle>{isEdit ? "Upravit poznámku" : "Nová poznámka"}</DialogTitle>
              <DialogDescription>
                Zapište si, co zaznělo na lekci nebo semináři. Poznámky vidíte jen vy.
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

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="např. Seminář poslušnosti"
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
                      placeholder="např. Více odměňovat u levé nohy, kratší úseky."
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
