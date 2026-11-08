import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { DesignIcon } from "@/components/DesignIcon"
import { PasswordInput } from "@/components/PasswordInput"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { authClient } from "@/features/auth/lib/auth-client"

type Mode = "name" | "email" | "password"
const titles = { name: "Upravit profil", email: "Změnit e-mail", password: "Změnit heslo" }

export function EditAccountDialog({ mode, name }: { mode: Mode; name: string }) {
  const [isOpen, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const queryClient = useQueryClient()
  const schema = z
    .object({
      value:
        mode === "name"
          ? z.string().trim().min(1, "Vyplň jméno.").max(100, "Jméno může mít nejvýše 100 znaků.")
          : mode === "email"
            ? z.string().trim().email("Zadej platný e-mail.")
            : z
                .string()
                .min(8, "Heslo musí mít alespoň 8 znaků.")
                .max(128, "Heslo může mít nejvýše 128 znaků."),
      currentPassword: z.string(),
      confirmPassword: z.string(),
    })
    .superRefine((values, ctx) => {
      if (mode !== "password") return
      if (!values.currentPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["currentPassword"],
          message: "Zadej současné heslo.",
        })
      }
      if (values.value !== values.confirmPassword) {
        ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Hesla se neshodují." })
      }
    })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { value: mode === "name" ? name : "", currentPassword: "", confirmPassword: "" },
  })
  const isPending = form.formState.isSubmitting
  function changeOpen(isNextOpen: boolean) {
    if (isPending) return
    setOpen(isNextOpen)
    setError("")
    setMessage("")
    form.reset({ value: mode === "name" ? name : "", currentPassword: "", confirmPassword: "" })
  }
  async function submit(values: z.infer<typeof schema>) {
    setError("")
    try {
      const result =
        mode === "name"
          ? await authClient.updateUser({ name: values.value })
          : mode === "email"
            ? await authClient.changeEmail({
                newEmail: values.value,
                callbackURL: `${window.location.origin}/account`,
              })
            : await authClient.changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.value,
                revokeOtherSessions: true,
              })
      if (result.error) {
        const code = result.error.code
        if (code === "INVALID_PASSWORD") {
          form.setError(
            "currentPassword",
            { message: "Zadej správné současné heslo." },
            { shouldFocus: true },
          )
          return
        }
        setError(
          code === "SESSION_EXPIRED" || code === "SESSION_NOT_FRESH"
            ? "Pro tuto změnu se znovu přihlas a akci zopakuj."
            : "Změnu se nepodařilo uložit. Zkontroluj údaje a zkus to znovu.",
        )
        return
      }
      await queryClient.invalidateQueries({ queryKey: authSessionQueryOptions().queryKey })
      if (mode === "email") {
        setMessage(
          "Pokud je nová adresa dostupná, poslali jsme na ni potvrzovací odkaz. E-mail se změní až po potvrzení odkazu.",
        )
      } else {
        setOpen(false)
        form.reset()
      }
    } catch {
      setError("Změnu se nepodařilo uložit. Zkontroluj připojení a zkus to znovu.")
    }
  }
  return (
    <Dialog
      open={isOpen}
      onOpenChange={changeOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant={mode === "name" ? "secondary" : "ghost"}
          className={mode === "name" ? "w-full justify-center" : "w-full justify-start"}
        >
          <span
            className={
              mode === "name"
                ? ""
                : "flex size-8 items-center justify-center rounded-xl bg-secondary"
            }
          >
            <DesignIcon
              name={
                mode === "name"
                  ? "auth-120-1291-IconEdit"
                  : mode === "email"
                    ? "auth-120-1291-IconMail"
                    : "auth-120-1291-IconLock"
              }
            />
          </span>
          {titles[mode]}
          {mode !== "name" && (
            <span className="ml-auto">
              <DesignIcon name="auth-120-1291-IconChevR" />
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="public-flow">
        <DialogHeader>
          <DialogTitle>{titles[mode]}</DialogTitle>
          <DialogDescription>
            {mode === "email"
              ? "Novou adresu potvrdíš odkazem v e-mailu."
              : mode === "password"
                ? "Alespoň 8 znaků. Ostatní zařízení se po změně odhlásí."
                : "Tvoje jméno uvidí lidé, se kterými spolupracuješ."}
          </DialogDescription>
        </DialogHeader>
        {message ? (
          <div className="space-y-4">
            <p role="status">{message}</p>
            <Button
              className="w-full"
              onClick={() => changeOpen(false)}
            >
              Hotovo
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              className="space-y-6"
              noValidate
              aria-busy={isPending}
              onSubmit={form.handleSubmit(submit)}
            >
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {mode === "password" && (
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Současné heslo</FormLabel>
                      <FormControl>
                        <PasswordInput
                          {...field}
                          autoComplete="current-password"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {mode === "name"
                        ? "Jméno a příjmení"
                        : mode === "email"
                          ? "Nový e-mail"
                          : "Nové heslo"}
                    </FormLabel>
                    <FormControl>
                      {mode === "password" ? (
                        <PasswordInput
                          {...field}
                          autoComplete="new-password"
                          disabled={isPending}
                        />
                      ) : (
                        <Input
                          {...field}
                          type={mode === "email" ? "email" : "text"}
                          autoComplete={mode === "email" ? "email" : "name"}
                          disabled={isPending}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {mode === "password" && (
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zopakovat nové heslo</FormLabel>
                      <FormControl>
                        <PasswordInput
                          {...field}
                          autoComplete="new-password"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="flex flex-col gap-2.5">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isPending}
                >
                  {isPending ? "Ukládám…" : mode === "email" ? "Poslat potvrzení" : "Uložit změny"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => changeOpen(false)}
                >
                  Zrušit
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
