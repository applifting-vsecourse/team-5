import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { CheckboxField } from "@/components/CheckboxField"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { authClient } from "@/features/auth/lib/auth-client"

type EmailNotificationsToggleProps = {
  isEnabled: boolean
  isTrainer: boolean
}

export function EmailNotificationsToggle({ isEnabled, isTrainer }: EmailNotificationsToggleProps) {
  const queryClient = useQueryClient()
  const [isPending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function handleChange(isNextEnabled: boolean) {
    if (isPending) return
    setPending(true)
    setError("")
    try {
      const result = await authClient.updateUser({
        emailNotificationsEnabled: isNextEnabled,
      })
      if (result.error) {
        setError("Nastavení upozornění se nepodařilo uložit. Zkus to prosím znovu.")
        return
      }
      await queryClient.invalidateQueries({ queryKey: authSessionQueryOptions().queryKey })
      toast.success(
        isNextEnabled ? "E-mailová upozornění byla zapnuta." : "E-mailová upozornění byla vypnuta.",
      )
    } catch {
      setError("Nastavení upozornění se nepodařilo uložit. Zkontroluj připojení a zkus to znovu.")
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      className="space-y-2 rounded-card border border-border bg-card p-4"
      aria-labelledby="account-notifications"
    >
      <h2
        id="account-notifications"
        className="text-sm font-bold text-muted-foreground"
      >
        Upozornění
      </h2>
      <CheckboxField
        id="email-notifications-enabled"
        name="emailNotificationsEnabled"
        label={isPending ? "E-mailová upozornění (ukládám…)" : "E-mailová upozornění"}
        isChecked={isEnabled}
        isDisabled={isPending}
        onCheckedChange={(isChecked) => {
          void handleChange(isChecked)
        }}
      />
      <p className="text-xs leading-relaxed text-muted-foreground">
        {isTrainer
          ? "Pošleme ti e-mail při novém záznamu tréninku nebo zprávě od klienta (nejvýš 1× za hodinu k jednomu vláknu)."
          : "Pošleme ti e-mail při nové odpovědi od trenéra (nejvýš 1× za hodinu k jednomu vláknu)."}
      </p>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </section>
  )
}
