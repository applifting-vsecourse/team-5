import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Heslo musí mít alespoň 8 znaků.")
      .max(128, "Heslo může mít nejvýše 128 znaků."),
    confirmPassword: z.string().min(1, "Potvrďte nové heslo."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hesla se neshodují.",
    path: ["confirmPassword"],
  })

export type ResetPasswordFormValues = z.infer<typeof schema>

const defaultValues: ResetPasswordFormValues = { password: "", confirmPassword: "" }

type ResetPasswordFormProps = {
  isLoading: boolean
  errorMessage?: string | null
  onSubmit: (values: ResetPasswordFormValues) => void | Promise<void>
}

export function ResetPasswordForm({ isLoading, errorMessage, onSubmit }: ResetPasswordFormProps) {
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        aria-busy={isLoading}
      >
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nové heslo</FormLabel>
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Potvrzení nového hesla</FormLabel>
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
          ) : (
            "Uložit heslo a přihlásit se"
          )}
        </Button>
      </form>
    </Form>
  )
}
