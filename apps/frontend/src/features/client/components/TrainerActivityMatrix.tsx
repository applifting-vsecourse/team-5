import { PerformanceLegend } from "@/components/PerformanceLegend"
import { Button } from "@/components/ui/button"
import { formatDayLong, formatDayOfMonth, formatWeekdayShort } from "@/lib/calendarDate"
import { performanceBandClass, performanceBandForRate } from "@/lib/performanceBands"
import { cn } from "@/lib/utils"

import type { TrainerDashboard } from "@/features/client/api/trainerOverview"

type Client = TrainerDashboard["clients"][number]

export function TrainerActivityMatrix({
  clients,
  selectedClientId,
  onSelect,
}: {
  clients: Client[]
  selectedClientId: string | null
  onSelect: (client: Client) => void
}) {
  const days = clients[0]?.activity.days ?? []
  return (
    <section
      aria-labelledby="trainer-activity-heading"
      className="hidden min-w-0 space-y-4 rounded-card border border-border bg-card p-5 lg:col-span-2 lg:block"
    >
      <h2
        id="trainer-activity-heading"
        className="text-section font-extrabold"
      >
        Aktivita klientů · 2 týdny
      </h2>
      <p className="text-xs text-muted-foreground">
        Úspěšnost dokončených tréninků. Vyberte klienta pro detail jeho psů.
      </p>
      <div
        className="overflow-x-auto pb-2"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard users must be able to scroll the wide table.
        tabIndex={0}
        role="region"
        aria-label="Denní aktivita klientů"
      >
        <table className="w-full min-w-2xl border-separate border-spacing-1 text-xs">
          <caption className="sr-only">
            Aktivita za posledních 14 dní, průměr vážený počtem hodnocených tréninků
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="text-left"
              >
                Klient
              </th>
              {days.map(({ date }) => (
                <th
                  scope="col"
                  key={date}
                  className="font-medium text-muted-foreground"
                  aria-label={formatDayLong(date)}
                >
                  <span className="block">{formatWeekdayShort(date)}</span>
                  {formatDayOfMonth(date)}
                </th>
              ))}
              <th scope="col">Průměr</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr
                key={client.id}
                className={cn(selectedClientId === client.id && "bg-accent/40")}
              >
                <th
                  scope="row"
                  className="text-left"
                >
                  <Button
                    variant="ghost"
                    className="h-auto max-w-40 justify-start px-2 py-2 text-left whitespace-normal"
                    aria-pressed={selectedClientId === client.id}
                    onClick={() => onSelect(client)}
                  >
                    {client.name}
                  </Button>
                </th>
                {client.activity.days.map((day) => (
                  <td
                    key={day.date}
                    className="text-center"
                  >
                    <span
                      className={cn(
                        "flex min-h-8 items-center justify-center rounded-sm px-1 font-semibold",
                        performanceBandClass(performanceBandForRate(day.successRate)),
                        performanceBandForRate(day.successRate) === "top"
                          ? "text-primary-foreground"
                          : "text-foreground",
                      )}
                      title={`${formatDayLong(day.date)}: ${day.completedSessions} dokončených, ${day.ratedSessions} hodnocených`}
                      aria-label={`${formatDayLong(day.date)}: ${day.completedSessions === 0 ? "bez tréninku" : day.successRate === null ? "trénink bez hodnocení" : `${Math.round(day.successRate)} %`}`}
                    >
                      {day.completedSessions === 0
                        ? "–"
                        : day.successRate === null
                          ? "•"
                          : Math.round(day.successRate)}
                    </span>
                  </td>
                ))}
                <td className="text-center font-extrabold">
                  {client.activity.successRate === null
                    ? "—"
                    : `${Math.round(client.activity.successRate)} %`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PerformanceLegend />
      <p className="text-xs text-muted-foreground">
        – bez tréninku · • bez hodnocení · data v českém časovém pásmu
      </p>
    </section>
  )
}
