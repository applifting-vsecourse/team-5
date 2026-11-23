import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { addCalendarDays } from "@/lib/calendarDate"
import { dogsListSummaryKey } from "@/lib/dogsListQueryOptions"

import { weekKeys, type WeekTraining } from "@/features/week/api/weekQueryOptions"

import { TodayView } from "./TodayView"

vi.mock("@/lib/calendarDate", async () => {
  const actual = await vi.importActual("@/lib/calendarDate")
  return {
    ...actual,
    todayCalendarDate: () => "2026-11-05",
  }
})

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof Router>("@tanstack/react-router")
  return {
    ...actual,
    Link: ({
      to,
      params,
      children,
      ...props
    }: {
      to?: string
      params?: Record<string, string>
      children?: React.ReactNode
      [key: string]: unknown
    }) => {
      let href = to ?? "#"
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          href = href.replace(`$${key}`, value)
        })
      }
      return (
        <a
          href={href}
          {...props}
        >
          {children}
        </a>
      )
    },
  }
})

const aTraining = (overrides: Partial<WeekTraining> = {}): WeekTraining => ({
  id: "t1",
  date: "2026-11-05",
  status: "PLANNED",
  dog: { id: "d1", name: "Rex", color: 1 },
  goal: { id: "g1", title: "Přivolání v parku" },
  exercises: [
    { id: "e1", title: "Přivolání na píšťalku" },
    { id: "e2", title: "Sedni – zůstaň" },
  ],
  ...overrides,
})

const renderToday = (trainings: WeekTraining[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  const weekStart = "2026-11-02"
  const upcomingFrom = addCalendarDays(weekStart, -7)
  const upcomingTo = addCalendarDays(upcomingFrom, 41)
  queryClient.setQueryData(weekKeys.week(weekStart), trainings)
  queryClient.setQueryData(weekKeys.range(upcomingFrom, upcomingTo), trainings)
  const dogs = [...new Map(trainings.map((training) => [training.dog.id, training.dog])).values()]
  queryClient.setQueryData(dogsListSummaryKey, dogs)
  queryClient.setQueryData(["training-updates"], [])
  queryClient.setQueryData([...weekKeys.all, "owner-metrics"], {
    timeZone: "Europe/Prague",
    asOf: "2026-11-05",
    weeklyTarget: 6,
    weeklyPlannedSessions: 6,
    weeklyCompletedSessions: 3,
    weeklySkippedSessions: 0,
    weeklyTrainedDays: 3,
    weeklyTargetReached: false,
    streak: 2,
    successRate: 75,
    ratedSessions: 4,
    weeklyChange: 5,
    weeks: [],
  })
  render(
    <QueryClientProvider client={queryClient}>
      <TodayView userName="Jan Novák" />
    </QueryClientProvider>,
  )
}

describe("TodayView", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows the owner summary independently of the dog in the hero", () => {
    renderToday([
      aTraining(),
      aTraining({ id: "other", dog: { id: "d2", name: "Bára", color: 2 } }),
    ])
    expect(screen.getByRole("progressbar", { name: "Týdenní plán" })).toHaveAttribute(
      "aria-valuenow",
      "3",
    )
    expect(screen.getByText("3/6")).toBeInTheDocument()
    expect(screen.getByText("75 %")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Všichni psi" })).toHaveAttribute("href", "/dogs")
  })

  it("greets the handler and offers Začít trénink for today's plan", () => {
    renderToday([aTraining()])

    expect(screen.getByRole("heading", { name: "Ahoj Jan", level: 1 })).toBeInTheDocument()
    expect(screen.getByText("Dnešní trénink")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Přivolání v parku" })).toBeInTheDocument()
    // Hero is the dog colour fill (fidelity), not the generic dark bg-hero.
    expect(screen.getByRole("region", { name: "Dnešní trénink" })).toHaveClass("bg-dog-1")
    expect(screen.getByRole("link", { name: /Začít trénink/i })).toHaveAttribute(
      "href",
      "/trainings/t1",
    )
    expect(screen.getByText("Přivolání na píšťalku").closest("li")).toHaveTextContent(
      "1Přivolání na píšťalku",
    )
    expect(screen.getByText("Sedni – zůstaň").closest("li")).toHaveTextContent("2Sedni – zůstaň")
  })

  it("shows empty state when the week has no trainings", () => {
    renderToday([])

    expect(screen.getByText("Na dnes nic naplánováno")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Přejít na psy" })).toHaveAttribute("href", "/dogs")
  })

  it("shows free-day empty when only completed trainings remain", () => {
    renderToday([aTraining({ status: "COMPLETED" })])

    expect(screen.getByText("Dnes máte volno")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Otevřít týden" })).toHaveAttribute("href", "/week")
  })

  it("surfaces overdue planned training instead of claiming volno", () => {
    renderToday([
      aTraining({
        id: "overdue",
        date: "2026-11-03",
        goal: { id: "g0", title: "Zmeškané áčko" },
      }),
      aTraining({
        id: "later",
        date: "2026-11-07",
        dog: { id: "d2", name: "Bára", color: 2 },
        goal: { id: "g2", title: "Pozítří" },
      }),
    ])

    expect(screen.queryByText("Dnes máte volno")).not.toBeInTheDocument()
    expect(screen.getByText("Zmeškaný trénink")).toBeInTheDocument()
    expect(screen.getByText(/Zmeškaný úterý 3\. 11\./)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Zmeškané áčko" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Začít trénink/i })).toHaveAttribute(
      "href",
      "/trainings/overdue",
    )
  })

  it("shows volno in the hero when only a future plan exists, and keeps it on the dog card", () => {
    renderToday([
      aTraining({
        id: "t2",
        date: "2026-11-07",
        dog: { id: "d2", name: "Bára", color: 2 },
        goal: { id: "g2", title: "Áčko" },
      }),
    ])

    expect(screen.getByText("Dnes máte volno")).toBeInTheDocument()
    expect(
      screen.getByText("Dnes nemáte trénink. Další je na kartě psa nebo v týdnu."),
    ).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Začít trénink/i })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /detail psa bára/i })).toHaveAttribute(
      "href",
      "/dogs/d2",
    )
    expect(screen.getByText(/Další trénink sobota 7\. 11\./)).toBeInTheDocument()
  })

  it("renders the desktop week strip with Tento týden and Celý týden", () => {
    renderToday([aTraining()])

    expect(screen.getByRole("heading", { name: "Tento týden" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Celý týden" })).toHaveAttribute("href", "/week")
    expect(screen.getByRole("link", { name: "Otevřít celý týden →" })).toHaveAttribute(
      "href",
      "/week",
    )
  })
})
