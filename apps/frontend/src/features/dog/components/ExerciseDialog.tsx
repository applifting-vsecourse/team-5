import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

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

import { exerciseFormSchema, type PlanBlock } from "@/features/dog/api/dogSchemas"
import type { NewExercise } from "@/features/dog/api/savePlanBlock"

// "end", or the plan index the new exercise takes (0 = first).
const AT_END = "end"
const dialogSchema = exerciseFormSchema.extend({ placement: z.string() })
type DialogValues = z.infer<typeof dialogSchema>

export type ExerciseDialogMode =
  { kind: "create"; blocks: PlanBlock[] } | { kind: "edit"; block: PlanBlock }

type ExerciseDialogProps = {
  mode: ExerciseDialogMode | null
  onClose: () => void
  isPending: boolean
  onSubmit: (exercise: NewExercise) => Promise<void>
}

const valuesFor = (mode: ExerciseDialogMode | null): DialogValues =>
  mode?.kind === "edit"
    ? {
        title: mode.block.title,
        instruction: mode.block.instruction ?? "",
        criterion: mode.block.criterion ?? "",
        placement: AT_END,
      }
    : { title: "", instruction: "", criterion: "", placement: AT_END }

// One dialog for adding an exercise (#63, optionally between two existing
// ones, #65) and for editing one (#65).
export function ExerciseDialog({ mode, onClose, isPending, onSubmit }: ExerciseDialogProps) {
  const form = useForm<DialogValues>({
    resolver: zodResolver(dialogSchema),
    defaultValues: valuesFor(mode),
  })

  useEffect(() => {
    if (mode) form.reset(valuesFor(mode))
  }, [mode, form])

  const isEdit = mode?.kind === "edit"
  const existing = mode?.kind === "create" ? mode.blocks : []

  const handleSubmit = async ({ placement, ...values }: DialogValues) => {
    await onSubmit({
      ...values,
      insertAt: placement === AT_END ? undefined : Number(placement),
    })
  }

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
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-6"
          >
            <DialogHeader>
              <DialogTitle>{isEdit ? "Upravit cvik" : "Nový cvik"}</DialogTitle>
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

            {existing.length > 0 ? (
              <FormField
                control={form.control}
                name="placement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zařadit</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full data-[size=default]:h-11">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AT_END}>Na konec plánu</SelectItem>
                        <SelectItem value="0">Na začátek</SelectItem>
                        {existing.slice(0, -1).map((block, index) => (
                          <SelectItem
                            key={block.id}
                            value={String(index + 1)}
                          >
                            Za {index + 1}. {block.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

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
                {isEdit ? "Uložit" : "Přidat cvik"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
