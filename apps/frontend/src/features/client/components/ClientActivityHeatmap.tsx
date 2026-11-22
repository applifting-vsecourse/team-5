import { Link } from "@tanstack/react-router"

import { PerformanceLegend } from "@/components/PerformanceLegend"
import { dogColorClass } from "@/lib/dogColors"
import { performanceBandClass, performanceBandForRate } from "@/lib/performanceBands"
import { cn } from "@/lib/utils"

import type { TrainerDashboard } from "@/features/client/api/trainerOverview"

type Matrix = NonNullable<TrainerDashboard["activityMatrix"]>
type Row = Matrix["rows"][number]
type Cell = Row["cells"][number]

const DAY_LABELS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"] as const

function dayLabel(date: string): string {
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay()
  return DAY_LABELS[(weekday + 6) % 7] ?? "?"
}

function cellLabel(cell: Cell): string {
  if (cell.successRate === null) {
    return cell.activityId ? "bez hodnocení" : "bez tréninku"
  }
  return `${Math.round(cell.successRate)} %`
}

function cellSquareClass(cell: Cell): string {
  if (cell.activityId && cell.successRate === null) {
    return "bg-muted ring-1 ring-inset ring-muted-foreground/40"
  }
  return performanceBandClass(performanceBandForRate(cell.successRate))
}

type ClientActivityHeatmapProps = {
  matrix: Matrix
  today: string
  selectedClientId: string | null
  onSelectRow: (row: Row) => void
}

/** Desktop trainer heatmap: client × day for two weeks (Figma 128:1459). */
export function ClientActivityHeatmap({
  matrix,
  today,
  selectedClientId,
  onSelectRow,
}: ClientActivityHeatmapProps) {
  if (!matrix.rows.length) return null

  return (
    <section
      aria-labelledby="overview-heatmap-heading"
      className="flex min-w-0 flex-col gap-3 rounded-card border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2
            id="overview-heatmap-heading"
            className="text-section font-extrabold"
          >
            Aktivita klientů · 2 týdny
          </h2>
          <p className="text-xs font-medium text-muted-foreground">
            Každý čtvereček = den, barva = úspěšnost tréninku
          </p>
        </div>
        <PerformanceLegend className="justify-end" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-separate border-spacing-y-1.5 text-left">
          <thead>
            <tr className="text-[0.65rem] font-bold tracking-wide text-muted-foreground uppercase">
              <th
                scope="col"
                className="pr-3 font-bold"
              >
                Klient
              </th>
              {matrix.days.map((day) => (
                <th
                  key={day}
                  scope="col"
                  className={cn("px-0.5 text-center font-bold", day === today && "text-primary")}
                >
                  {day === today ? "Dnes" : dayLabel(day)}
                </th>
              ))}
              <th
                scope="col"
                className="pl-2 text-center font-bold"
              >
                Ø
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row) => {
              const isSelected = row.clientId === selectedClientId
              return (
                <tr key={row.clientId}>
                  <th
                    scope="row"
                    className="pr-3"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectRow(row)}
                      aria-label={`Vybrat klienta ${row.clientName}`}
                      className={cn(
                        "flex min-h-touch w-full min-w-0 items-center gap-2 rounded-field px-1.5 py-1 text-left outline-hidden",
                        "hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected && "bg-accent/60",
                      )}
                      aria-pressed={isSelected}
                    >
                      <span className="flex shrink-0">
                        {row.dogs.slice(0, 2).map((dog, index) => (
                          <span
                            key={dog.id}
                            aria-hidden
                            className={cn(
                              "flex size-6 items-center justify-center rounded-full border-2 border-card text-[0.65rem] font-extrabold text-dog-foreground",
                              dogColorClass(dog.color),
                              index > 0 && "-ml-1.5",
                            )}
                          >
                            {dog.name.trim().charAt(0).toUpperCase()}
                          </span>
                        ))}
                      </span>
                      <span className="min-w-0 truncate text-sm font-bold">{row.clientName}</span>
                    </button>
                  </th>
                  {row.cells.map((cell) => {
                    const label = `${row.clientName}, ${cell.date}: ${cellLabel(cell)}`
                    const square = (
                      <span
                        role="img"
                        aria-label={label}
                        className={cn("mx-auto block size-[26px] rounded-sm", cellSquareClass(cell))}
                        title={`${cell.date}: ${cellLabel(cell)}`}
                      />
                    )
                    return (
                      <td
                        key={cell.date}
                        className="px-0.5 text-center"
                      >
                        {cell.activityId && cell.dogId ? (
                          <Link
                            to="/dogs/$dogId/activities/$activityId"
                            params={{
                              dogId: cell.dogId,
                              activityId: cell.activityId,
                            }}
                            aria-label={label}
                            className="inline-flex rounded-sm outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {square}
                          </Link>
                        ) : (
                          <span className="inline-flex">{square}</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="pl-2 text-center text-sm font-extrabold tabular-nums">
                    {row.averageSuccessRate === null
                      ? "—"
                      : `${Math.round(row.averageSuccessRate)} %`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
