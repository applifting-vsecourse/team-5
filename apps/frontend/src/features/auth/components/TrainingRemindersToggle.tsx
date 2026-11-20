import { useId, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { authClient } from "@/features/auth/lib/auth-client"

export function TrainingRemindersToggle({ isEnabled }: { isEnabled: boolean }) {
  const [isPending, setIsPending] = useState(false)
  const [isOptimistic, setIsOptimistic] = useState<boolean | null>(null)
  const queryClient = useQueryClient()
  const labelId = useId()
  const descriptionId = useId()

  const isChecked = isOptimistic ?? isEnabled

  async function handleToggle() {
    if (isPending) return
    const isNextEnabled = !isChecked
    setIsOptimistic(isNextEnabled)
    setIsPending(true)
    try {
      const result = await authClient.updateUser({
        trainingRemindersEnabled: isNextEnabled,
      })
      if (result.error) {
        setIsOptimistic(null)
        toast.error("Nastavení připomínek se nepodařilo uložit. Zkus to prosím znovu.")
        return
      }
      await queryClient.invalidateQueries({ queryKey: authSessionQueryOptions().queryKey })
      setIsOptimistic(null)
      toast.success(
        isNextEnabled
          ? "Ranní připomínky tréninků jsou zapnuté."
          : "Ranní připomínky tréninků jsou vypnuté.",
      )
    } catch {
      setIsOptimistic(null)
      toast.error("Nastavení připomínek se nepodařilo uložit. Zkontroluj připojení k síti.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <p
          id={labelId}
          className="text-sm font-semibold text-foreground"
        >
          Ranní připomínky tréninků
        </p>
        <p
          id={descriptionId}
          className="text-xs text-muted-foreground"
        >
          V den naplánovaného tréninku ti ráno pošleme e-mail s přehledem dnešních jednotek.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        disabled={isPending}
        onClick={() => {
          void handleToggle()
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
          isChecked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none block size-5 rounded-full bg-background shadow-sm transition-transform ${
            isChecked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}
