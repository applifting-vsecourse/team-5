import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { weekKeys, type WeekTraining } from "@/features/week/api/weekQueryOptions"

import { WeekView } from "./WeekView"

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof Router>("@tanstack/react-router")
  return {
    ...actual,
    Link: ({ to, children }: { to?: string; children?: React.ReactNode }) => (
      <a href={to ?? "#"}>{children}</a>
    ),
  }
})

const aTraining = (overrides: Partial<WeekTraining> = {}): WeekTraining => ({
  id: "t1",
  date: "2026-10-21",
  status: "COMPLETED",
  dog: { id: "d1", name: "Rex", color: 1 },
  goal: { id: "g1", title: "Chůze u nohy" },
  exercises: [
    { id: "b1", title: "Sedni u nohy" },
    { id: "b2", title: "Krok vpřed" },
  ],
  ...overrides,
})

// Seed the cache so the week renders without hitting the API.
const renderWeek = (trainings: WeekTraining[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(weekKeys.week("2026-10-19"), trainings)
  return render(
    <QueryClientProvider client={queryClient}>
      <WeekView
        weekStart="2026-10-19"
        today="2026-10-21"
      />
    </QueryClientProvider>,
  )
}

describe("WeekView", () => {
  it("shows today's trainings with dog, goal, status and exercises", () => {
    renderWeek([
      aTraining(),
      aTraining({
        id: "t2",
        status: "PLANNED",
        dog: { id: "d2", name: "Bella", color: 3 },
        goal: { id: "g2", title: "Hledání pamlsků" },
        exercises: [{ id: "b3", title: "Čuchej" }],
      }),
    ])

    expect(screen.getByText("19.–25. října")).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /^středa 21\. 10\., dnes/ })).toBeChecked()
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("středa 21. 10. · dnes")

    const [rex, bella] = screen.getAllByRole("listitem")
    if (!rex || !bella) throw new Error("expected two training cards")
    expect(within(rex).getByRole("heading", { name: "Rex · Chůze u nohy" })).toBeInTheDocument()
    expect(within(rex).getByText("Odcvičeno")).toBeInTheDocument()
    expect(within(rex).getByText("2 cviky · Sedni u nohy, Krok vpřed")).toBeInTheDocument()
    expect(within(bella).getByText("Naplánováno")).toBeInTheDocument()
    expect(within(bella).getByText("1 cvik · Čuchej")).toBeInTheDocument()
  })

  it("marks the days that have a training", () => {
    renderWeek([aTraining(), aTraining({ id: "t2", date: "2026-10-24" })])

    expect(screen.getByRole("radio", { name: /sobota 24\. 10\., tréninků: 1/ })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "čtvrtek 22. 10." })).toBeInTheDocument()
  })

  it("switches to another day", async () => {
    const user = userEvent.setup()
    renderWeek([aTraining()])

    await user.click(screen.getByRole("radio", { name: "čtvrtek 22. 10." }))

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("čtvrtek 22. 10.")
    expect(screen.getByText("Na tento den nemáte nic naplánováno.")).toBeInTheDocument()
  })

  it("says what to do when the whole week is empty", () => {
    renderWeek([])

    expect(screen.getByText(/Na tento týden nemáte nic naplánováno/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Přejít na psy" })).toHaveAttribute("href", "/dogs")
  })
})
