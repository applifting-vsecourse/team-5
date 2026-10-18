import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { ROUTES } from "@/app/routes"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import type { SignUpInput } from "@/features/auth/hooks/useSignUp"
import type { RegistrationError } from "@/features/auth/lib/registration-errors"

const schema = z.object({
  isTrainer: z.boolean(),
  name: z.string().trim().min(1, "Vyplňte jméno."),
  email: z.string().trim().min(1, "Vyplňte e-mail.").email("Zadejte platný e-mail."),
  password: z
    .string()
    .min(8, "Heslo musí mít alespoň 8 znaků.")
    .max(128, "Heslo může mít nejvýše 128 znaků."),
  privacyConsent: z
    .boolean()
    .refine(
      (isAccepted) => isAccepted,
      "Pro registraci je nutný souhlas se zpracováním osobních údajů.",
    ),
})

type SignUpFormProps = {
  isLoading: boolean
  error?: RegistrationError | null
  onSubmit: (values: SignUpInput) => void | Promise<void>
}

export function SignUpForm({ isLoading, error, onSubmit }: SignUpFormProps) {
  const form = useForm<SignUpInput>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", privacyConsent: false, isTrainer: false },
  })
  const { setError } = form

  useEffect(() => {
    if (error?.field) {
      setError(error.field, { type: "server", message: error.message }, { shouldFocus: true })
    }
  }, [error, setError])

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        aria-busy={isLoading}
      >
        {error && !error.field ? (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : null}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jméno</FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  required
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              {error?.isDuplicateEmail ? (
                <Link
                  to={ROUTES.login}
                  className="text-sm font-medium underline underline-offset-4"
                >
                  Přihlásit se
                </Link>
              ) : null}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heslo</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isTrainer"
          render={({ field }) => (
            <FormItem>
              <div className="flex min-h-12 items-center gap-3">
                <FormControl>
                  <Checkbox
                    name={field.name}
                    ref={field.ref}
                    checked={field.value}
                    onCheckedChange={(value) => field.onChange(value === true)}
                    onBlur={field.onBlur}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormLabel className="min-h-12 flex-1 cursor-pointer py-3 leading-normal">
                  Jsem trenér
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="privacyConsent"
          render={({ field }) => (
            <FormItem>
              <div className="flex min-h-12 items-center gap-3">
                <FormControl>
                  <Checkbox
                    name={field.name}
                    ref={field.ref}
                    checked={field.value}
                    onCheckedChange={(value) => field.onChange(value === true)}
                    onBlur={field.onBlur}
                    required
                    disabled={isLoading}
                  />
                </FormControl>
                <FormLabel className="min-h-12 flex-1 cursor-pointer py-3 leading-normal">
                  Souhlasím se zpracováním osobních údajů.
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2
              aria-hidden="true"
              className="size-4 animate-spin"
            />
          ) : null}
          {isLoading ? "Registruji…" : "Zaregistrovat se"}
        </Button>
      </form>
    </Form>
  )
}
