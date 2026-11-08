import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { ROUTES } from "@/app/routes"
import { DesignIcon } from "@/components/DesignIcon"
import { IconInput } from "@/components/IconInput"
import { PasswordInput } from "@/components/PasswordInput"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

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
  defaultEmail?: string
  isInvitation?: boolean
  onStepChange?: (step: number) => void
  onSubmit: (values: SignUpInput) => void | Promise<void>
}

export function SignUpForm({
  isLoading,
  error,
  defaultEmail,
  onSubmit,
  isInvitation,
  onStepChange,
}: SignUpFormProps) {
  const [step, setStep] = useState(1)
  const form = useForm<SignUpInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: defaultEmail ?? "",
      password: "",
      privacyConsent: false,
      isTrainer: false,
    },
  })
  const { setError } = form
  const isTrainer = useWatch({ control: form.control, name: "isTrainer" })
  const password = useWatch({ control: form.control, name: "password" })
  const strength =
    password.length < 8
      ? 0
      : [
          password.length >= 12,
          /[a-z]/.test(password) && /[A-Z]/.test(password),
          /\d/.test(password),
          /[^a-zA-Z0-9]/.test(password),
        ].filter(Boolean).length
  function changeStep(next: number) {
    setStep(next)
    onStepChange?.(next)
  }

  useEffect(() => {
    if (error?.field) {
      setError(error.field, { type: "server", message: error.message }, { shouldFocus: true })
    }
  }, [error, setError])

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={(event) => {
          if (step === 1) {
            event.preventDefault()
            changeStep(2)
          } else {
            void form.handleSubmit(onSubmit)(event)
          }
        }}
        className="space-y-6"
        aria-busy={isLoading}
      >
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              if (step === 2) changeStep(1)
              else window.location.assign("/")
            }}
            disabled={isLoading}
            aria-label="Zpět"
          >
            <DesignIcon name="auth-141-1602-IconChevL" />
          </Button>
          <div className="space-y-2">
            <p className="text-xs font-extrabold text-primary">KROK {step} ZE 2</p>
            <div
              role="progressbar"
              aria-label="Průběh registrace"
              aria-valuenow={step}
              aria-valuemin={0}
              aria-valuemax={2}
              className="h-1.5 w-32 rounded-full bg-secondary"
            >
              <div
                className={cn("h-full rounded-full bg-primary", step === 1 ? "w-1/2" : "w-full")}
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">
            {step === 1 ? "Kdo jsi?" : "Vytvoř si účet"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isInvitation
              ? "Dokonči registraci pro propojení se svým trenérem."
              : "Začni zdarma, s trenérem nebo i bez něj."}
          </p>
        </div>
        {step === 1 ? (
          <div className="space-y-6">
            <RadioGroup
              value={String(isTrainer)}
              onValueChange={(value) => form.setValue("isTrainer", value === "true")}
              aria-label="Role účtu"
              className="gap-6"
            >
              {[false, true]
                .filter((isTrainerOption) => !isInvitation || !isTrainerOption)
                .map((isTrainerOption) => (
                  <label
                    key={String(isTrainerOption)}
                    className={cn(
                      "flex cursor-pointer flex-col gap-2.5 rounded-card border bg-card p-4",
                      isTrainer === isTrainerOption
                        ? "border-primary bg-accent ring-1 ring-primary"
                        : "border-border",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-11 items-center justify-center rounded-field text-dog-foreground",
                          isTrainerOption ? "bg-dog-3" : "bg-dog-2",
                        )}
                      >
                        <DesignIcon
                          name={
                            isTrainerOption ? "auth-141-1602-IconUsers" : "auth-141-1602-IconPaw"
                          }
                        />
                      </span>
                      <span className="flex-1 text-lg font-extrabold">
                        {isTrainerOption ? "Trenér" : "Psovod"}
                      </span>
                      <RadioGroupItem
                        value={String(isTrainerOption)}
                        aria-label={isTrainerOption ? "Trenér" : "Psovod"}
                      />
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {isTrainerOption
                        ? "Navíc máš záložku Klienti: zveš psovody, nastavuješ cíle a tréninky a odpovídáš na záznamy."
                        : "Trénuješ svého psa podle cílů od trenéra – nebo i bez něj."}
                    </span>
                  </label>
                ))}
            </RadioGroup>
            <Button
              type="submit"
              size="lg"
              className="w-full"
            >
              Pokračovat
            </Button>
          </div>
        ) : (
          <>
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
                  <FormLabel>Jméno a příjmení</FormLabel>
                  <FormControl>
                    <IconInput
                      icon="auth-141-1602-IconUser"
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
                    <IconInput
                      icon="auth-141-1602-IconMail"
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
                    <PasswordInput
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
            <div
              className="space-y-1.5"
              aria-live="polite"
            >
              <div
                className="flex gap-1"
                aria-hidden="true"
              >
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      password.length >= 8 && index <= strength
                        ? "bg-success-foreground"
                        : "bg-border",
                    )}
                  />
                ))}
              </div>
              <p className="text-xs font-bold text-muted-foreground">
                {!password
                  ? "Alespoň 8 znaků, nejvýše 128."
                  : password.length < 8
                    ? "Příliš krátké heslo"
                    : strength >= 3
                      ? "Silné heslo"
                      : strength >= 1
                        ? "Středně silné heslo"
                        : "Slabé heslo – zkus delší heslo"}
              </p>
            </div>
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
                  <Link
                    to={ROUTES.privacy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center text-sm underline underline-offset-4"
                  >
                    Zásady zpracování osobních údajů (nová karta)
                  </Link>
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
              {isLoading ? "Registruji…" : "Vytvořit účet"}
            </Button>
          </>
        )}
      </form>
    </Form>
  )
}
