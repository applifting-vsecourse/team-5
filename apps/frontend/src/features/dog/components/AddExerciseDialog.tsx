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

import { exerciseFormSchema, type ExerciseFormValues } from "@/features/dog/api/dogSchemas"

const emptyExercise: ExerciseFormValues = { title: "", instruction: "", criterion: "" }

type AddExerciseDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  isPending: boolean
  onSubmit: (values: ExerciseFormValues) => Promise<void>
}

export function AddExerciseDialog({
  isOpen,
  onOpenChange,
  isPending,
  onSubmit,
}: AddExerciseDialogProps) {
  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: emptyExercise,
  })

  const handleOpenChange = (isNextOpen: boolean) => {
    if (!isNextOpen) form.reset(emptyExercise)
    onOpenChange(isNextOpen)
  }

  const handleSubmit = async (values: ExerciseFormValues) => {
    await onSubmit(values)
    form.reset(emptyExercise)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-6"
          >
            <DialogHeader>
              <DialogTitle>Nový cvik</DialogTitle>
              <DialogDescription>
                Co přesně cvičit a podle čeho poznáte, že je hotovo.
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název cviku</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="např. Sedni u nohy"
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
              name="instruction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrukce</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="např. Pes sedí u levé nohy, odměna z levé ruky."
                      className="min-h-20"
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
                  <FormLabel>Kritérium zvládnutí</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="např. Sedí 5 s, i když kolem letí míček."
                      className="min-h-16"
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
                onClick={() => handleOpenChange(false)}
              >
                Zrušit
              </Button>
              <Button
                type="submit"
                className="min-h-11"
                disabled={isPending}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Přidat cvik
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
