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

const schema = z.object({
  email: z.string().trim().min(1, "Vyplňte e-mail.").email("Zadejte platný e-mail."),
})

type FormValues = z.infer<typeof schema>

const defaultValues: FormValues = { email: "" }

type ForgotPasswordFormProps = {
  isLoading: boolean
  errorMessage?: string | null
  onSubmit: (values: FormValues) => void | Promise<void>
}

export function ForgotPasswordForm({ isLoading, errorMessage, onSubmit }: ForgotPasswordFormProps) {
  const form = useForm<FormValues>({
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
            "Odeslat odkaz pro obnovu"
          )}
        </Button>
      </form>
    </Form>
  )
}
