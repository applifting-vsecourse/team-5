import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"

import { useCancelInvitation } from "@/features/client/api/cancelInvitation"
import { clientInvitationsQueryOptions } from "@/features/client/api/clientsQueryOptions"

function formatExpirationDate(date: Date): string {
  const day = date.getDate()
  const month = date.getMonth() + 1
  return `platí do ${day}. ${month}.`
}

export function UnusedInvitations() {
  const { data: invitations } = useQuery(clientInvitationsQueryOptions())
  const cancelMutation = useCancelInvitation()

  if (!invitations || invitations.length === 0) {
    return null
  }

  return (
    <section
      aria-label="Nepoužité pozvánky"
      className="mt-8 flex flex-col gap-2"
    >
      <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Nepoužité pozvánky
      </h2>

      <div className="flex flex-col divide-y divide-border">
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="flex min-h-11 items-center gap-3 py-2"
          >
            <span className="font-mono text-base font-medium text-foreground">{inv.code}</span>
            <span className="flex-1 truncate text-sm text-muted-foreground">
              {inv.email ? (
                <strong className="mr-2 font-normal text-foreground">{inv.email}</strong>
              ) : null}
              {formatExpirationDate(new Date(inv.expiresAt))}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 px-3 text-muted-foreground hover:text-destructive"
              onClick={() => cancelMutation.mutate(inv.id)}
              disabled={cancelMutation.isPending}
              aria-label={`Zrušit pozvánku ${inv.code}`}
            >
              Zrušit
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
