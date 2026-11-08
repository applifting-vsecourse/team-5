import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatDayLong } from "@/lib/calendarDate"
import { dogColorClass } from "@/lib/dogColors"
import { cn } from "@/lib/utils"

import type { TrainerDashboard } from "@/features/client/api/trainerOverview"

type Client = TrainerDashboard["clients"][number]
export function TrainerDogContext({
  client,
  dogId,
  onSelectDog,
  onConversation,
}: {
  client: Client
  dogId: string | null
  onSelectDog: (id: string) => void
  onConversation: (id: string) => void
}) {
  const dog = client.dogs.find((item) => item.id === dogId) ?? client.dogs[0]
  return (
    <aside
      aria-label={`Detail klienta ${client.name}`}
      className="hidden min-w-0 self-start overflow-hidden rounded-card border border-border bg-card lg:col-start-3 lg:row-span-2 lg:row-start-2 lg:block"
    >
      {dog ? (
        <>
          <div className={cn("space-y-4 p-5 text-dog-foreground", dogColorClass(dog.color))}>
            <p className="text-sm font-semibold">{client.name}</p>
            <h2 className="text-title font-extrabold">{dog.name}</h2>
            {dog.breed && <p className="text-sm">{dog.breed}</p>}
            {client.dogs.length > 1 && (
              <div
                className="flex flex-wrap gap-2"
                aria-label="Vybrat psa"
              >
                {client.dogs.map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    aria-pressed={item.id === dog.id}
                    onClick={() => onSelectDog(item.id)}
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            )}
            <p>
              <strong className="text-3xl font-extrabold">
                {dog.successRate === null ? "—" : `${Math.round(dog.successRate)} %`}
              </strong>
              <span className="block text-xs">Úspěšnost za 8 týdnů</span>
            </p>
            <div
              className="flex h-14 items-end gap-2"
              role="img"
              aria-label={`Týdenní úspěšnost: ${dog.weeks.map((week) => (week.successRate === null ? "bez hodnocení" : `${Math.round(week.successRate)} %`)).join(", ")}`}
            >
              {dog.weeks.map((week) => (
                <span
                  key={week.from}
                  className="flex-1 rounded-sm bg-dog-foreground/30"
                  style={{ height: `${Math.max(4, week.successRate ?? 0)}%` }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-6 p-5">
            <section className="space-y-3">
              <h3 className="font-bold">Aktivní cíle</h3>
              {dog.goals.length ? (
                dog.goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="space-y-2"
                  >
                    <Link
                      to="/dogs/$dogId/goals/$goalId"
                      params={{ dogId: dog.id, goalId: goal.id }}
                      className="inline-flex min-h-touch items-center text-sm font-bold underline-offset-4 hover:underline"
                    >
                      {goal.title}
                    </Link>
                    <Progress
                      value={goal.totalSteps ? (100 * goal.masteredSteps) / goal.totalSteps : 0}
                      aria-label={`${goal.title}: ${goal.masteredSteps} z ${goal.totalSteps} kroků zvládnuto`}
                    />
                    <p className="text-xs text-muted-foreground">
                      {goal.masteredSteps} / {goal.totalSteps} kroků
                      {goal.deadline && ` · do ${formatDayLong(goal.deadline)}`}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Zatím bez aktivního cíle.</p>
              )}
            </section>
            <section className="space-y-2 border-t border-border pt-4">
              <h3 className="font-bold">Poslední trénink</h3>
              {dog.lastTraining ? (
                <>
                  <p className="text-sm font-semibold">{dog.lastTraining.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {dog.lastTraining.completedAt.toLocaleDateString("cs-CZ", {
                      timeZone: "Europe/Prague",
                    })}{" "}
                    ·{" "}
                    {dog.lastTraining.successRate === null
                      ? "bez hodnocení"
                      : `${dog.lastTraining.successRate} %`}
                  </p>
                  {dog.lastTraining.note && (
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {dog.lastTraining.note}
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => onConversation(dog.lastTraining!.id)}
                  >
                    Otevřít konverzaci
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Zatím bez dokončeného tréninku.</p>
              )}
            </section>
            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <Link
                to="/dogs/$dogId"
                params={{ dogId: dog.id }}
              >
                Otevřít profil a plán
              </Link>
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-3 p-5">
          <h2 className="font-bold">{client.name}</h2>
          <p className="text-sm text-muted-foreground">Klient zatím nesdílí žádného psa.</p>
          <Button
            asChild
            variant="outline"
          >
            <Link
              to="/clients/$clientId"
              params={{ clientId: client.id }}
            >
              Detail klienta
            </Link>
          </Button>
        </div>
      )}
    </aside>
  )
}
