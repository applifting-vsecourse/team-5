import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

import { DeleteAccountError, useDeleteAccount } from "@/features/auth/hooks/useDeleteAccount"

const schema = z.object({ password: z.string().min(1, "Pro smazání účtu zadejte heslo.") })

export function DeleteAccountDialog({ isTrainer }: { isTrainer: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const deletion = useDeleteAccount()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
  })

  function changeOpen(isNextOpen: boolean) {
    if (deletion.isPending) return
    form.reset()
    deletion.reset()
    setError(null)
    setIsOpen(isNextOpen)
  }

  async function submit({ password }: z.infer<typeof schema>) {
    setError(null)
    try {
      await deletion.mutateAsync(password)
      form.reset()
      setIsOpen(false)
    } catch (cause) {
      if (cause instanceof DeleteAccountError && cause.field) {
        form.setError(cause.field, { message: cause.message }, { shouldFocus: true })
      } else {
        setError(
          cause instanceof DeleteAccountError
            ? cause.message
            : "Účet se nepodařilo smazat. Zkontrolujte připojení a zkuste to znovu.",
        )
      }
    } finally {
      deletion.reset()
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={changeOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="min-h-12 w-full justify-start gap-2 text-destructive hover:text-destructive"
        >
          <Trash2
            aria-hidden="true"
            className="size-4"
          />{" "}
          Smazat účet
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="tracking-tight">Smazat účet</DialogTitle>
          <DialogDescription>
            {isTrainer
              ? "Ukončíte spolupráci se všemi klienty. Vaše zprávy a zadání u klientů zůstanou pod jménem „smazaný uživatel“. Smažou se také vaši vlastní psi a jejich data."
              : "Trvale smažete své psy, cíle, plány, tréninky, záznamy, poznámky a zprávy. Ukončí se také propojení s trenéry."}{" "}
            Účet nelze obnovit. Smazání potvrďte svým heslem.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit(submit)}
            className="space-y-4"
            aria-busy={deletion.isPending}
          >
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heslo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      className="min-h-12"
                      autoComplete="current-password"
                      required
                      disabled={deletion.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="min-h-12"
                disabled={deletion.isPending}
                onClick={() => changeOpen(false)}
              >
                Zrušit
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="min-h-12"
                disabled={deletion.isPending}
              >
                {deletion.isPending && (
                  <Loader2
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                )}
                {deletion.isPending ? "Mažu účet…" : "Trvale smazat účet"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
