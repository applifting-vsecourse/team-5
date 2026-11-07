import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { DesignIcon } from "@/components/DesignIcon"
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useDesktop } from "@/hooks/useDesktop"

import { DeleteAccountError, useDeleteAccount } from "@/features/auth/hooks/useDeleteAccount"

const schema = z.object({ password: z.string().min(1, "Pro smazání účtu zadejte heslo.") })

export function DeleteAccountDialog({ isTrainer }: { isTrainer: boolean }) {
  const isDesktop = useDesktop()
  const Root = isDesktop ? Dialog : Drawer
  const Content = isDesktop ? DialogContent : DrawerContent
  const Header = isDesktop ? DialogHeader : DrawerHeader
  const Title = isDesktop ? DialogTitle : DrawerTitle
  const Description = isDesktop ? DialogDescription : DrawerDescription
  const Trigger = isDesktop ? DialogTrigger : DrawerTrigger
  const Footer = isDesktop ? DialogFooter : DrawerFooter
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
    <Root
      open={isOpen}
      onOpenChange={changeOpen}
    >
      <Trigger asChild>
        <Button
          variant="ghost"
          className="min-h-12 w-full justify-start gap-2 text-destructive hover:text-destructive"
        >
          <Trash2
            aria-hidden="true"
            className="size-4"
          />{" "}
          Smazat účet
        </Button>
      </Trigger>
      <Content
        className="public-flow overflow-y-auto rounded-sheet"
        {...(isDesktop ? { showCloseButton: false } : {})}
      >
        <Header className="flex-row items-start gap-3 text-left">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-field bg-danger-surface">
            <DesignIcon name="auth-235-1151-IconTrash1" />
          </span>
          <div className="space-y-1">
            <Title className="text-2xl font-extrabold tracking-tight">Smazat účet?</Title>
            <Description>Tohle nejde vrátit.</Description>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="ml-auto"
            aria-label="Zavřít potvrzení smazání účtu"
            disabled={deletion.isPending}
            onClick={() => changeOpen(false)}
          >
            <DesignIcon name="auth-235-1151-IconX" />
          </Button>
        </Header>
        <div className="mx-5 space-y-4 rounded-card border border-border bg-card p-4 md:mx-0">
          <h3 className="text-sm font-bold text-muted-foreground">Co se smaže</h3>
          <ul className="space-y-3 text-sm">
            {(isTrainer
              ? [
                  "Vlastní psi, cíle a tréninky",
                  "Propojení se všemi klienty a pozvánky",
                  "Osobní účet a nastavení",
                ]
              : [
                  "Psi, cíle, tréninky a jejich záznamy",
                  "Soukromé poznámky a zprávy u záznamů",
                  "Propojení se všemi trenéry",
                ]
            ).map((text) => (
              <li
                key={text}
                className="flex items-start gap-3"
              >
                <span className="pt-1">
                  <DesignIcon name="auth-235-1151-IconMinus" />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <p className="border-t border-border pt-3 text-sm text-muted-foreground">
            {isTrainer
              ? "Zprávy a zadání u klientů zůstanou pod jménem „smazaný uživatel“."
              : "Účet nelze obnovit. Smazání potvrď svým heslem."}
          </p>
        </div>
        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit(submit)}
            className="space-y-6 px-5 pt-6 pb-5 md:px-0 md:pb-0"
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
                      className="min-h-action w-full"
                      autoComplete="current-password"
                      required
                      disabled={deletion.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Footer className="flex-col-reverse p-0 sm:flex-col-reverse">
              <Button
                type="button"
                variant="outline"
                className="min-h-action w-full"
                disabled={deletion.isPending}
                onClick={() => changeOpen(false)}
              >
                Zrušit
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="min-h-action w-full"
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
            </Footer>
          </form>
        </Form>
      </Content>
    </Root>
  )
}
