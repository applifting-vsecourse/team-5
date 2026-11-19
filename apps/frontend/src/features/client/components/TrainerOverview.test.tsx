import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import type { Invitation } from "@/features/client/api/clientSchemas"
import type { TrainerDashboard } from "@/features/client/api/trainerOverview"

import { TrainerOverview } from "./TrainerOverview"

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
      let href = typeof to === "string" ? to : "#"
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

vi.mock("@/lib/api-client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock("./InviteClientDialog", () => ({
  InviteClientDialog: () => null,
}))

const dog = { id: "d-1", name: "Rex", color: 1 }
const jan = { id: "c-1", name: "Jan Novák" }

const overview: TrainerDashboard = {
  metrics: {
    activeClients: 3,
    newClientsThisMonth: 1,
    completedThisWeek: 7,
    weeklySessionChange: -2,
    successRate: 76.4,
    weeklyRateChange: 4,
    unreadNotes: 1,
  },
  clients: [
    {
      ...jan,
      dogs: [dog],
      successRate: 80,
      weeks: [
        { from: "2026-10-12", successRate: 70 },
        { from: "2026-10-19", successRate: null },
        { from: "2026-10-26", successRate: 80 },
      ],
      lastTraining: { id: "a-1", title: "Přivolání v parku", completedAt: new Date() },
    },
  ],
  activityMatrix: {
    days: ["2026-10-20", "2026-10-21"],
    rows: [
      {
        clientId: jan.id,
        clientName: jan.name,
        dogs: [dog],
        cells: [
          { date: "2026-10-20", successRate: 80, activityId: "a-1", dogId: dog.id },
          { date: "2026-10-21", successRate: null, activityId: null, dogId: null },
        ],
        averageSuccessRate: 80,
      },
    ],
  },
  attention: [
    {
      id: "reply-d-1",
      kind: "reply",
      dog,
      client: jan,
      label: "Nová zpráva u tréninku",
      activityId: "a-1",
      goalId: "g-1",
    },
    {
      id: "low-success-d-2",
      kind: "low-success",
      dog: { id: "d-2", name: "Baryk", color: 3 },
      client: jan,
      label: "Úspěšnost 48 % (−20 b.)",
      activityId: "a-2",
      goalId: "g-2",
    },
  ],
}

const invitations: Invitation[] = [
  {
    id: "inv-1",
    code: "ABCD12",
    email: null,
    expiresAt: new Date("2026-12-01T00:00:00Z"),
    createdAt: new Date("2026-11-01T00:00:00Z"),
  },
]

function respond(routes: Record<string, () => Promise<unknown>>) {
  vi.mocked(api.get).mockImplementation((url: unknown) => {
    const path = String(url)
    const handler = routes[path]
    if (!handler) throw new Error(`Unexpected path ${path}`)
    return { json: handler } as unknown as ReturnType<typeof api.get>
  })
}

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe("TrainerOverview", () => {
  beforeEach(() => {
    respond({
      "overview/trainer": () => Promise.resolve(overview),
      "clients/invitations": () => Promise.resolve(invitations),
      updates: () => Promise.resolve([]),
    })
  })

  it("shows the Figma KPIs from the overview API", async () => {
    render(<TrainerOverview userName="Marek Dvořák" />, { wrapper: createWrapper() })

    expect(await screen.findByText("aktivních klientů")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/, Marek$/)
    expect(screen.queryByRole("button", { name: "Oznámení" })).not.toBeInTheDocument()
    expect(screen.queryByRole("img", { name: "Marek Dvořák" })).not.toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("+1 za měsíc")).toBeInTheDocument()
    expect(screen.getByText("7")).toBeInTheDocument()
    expect(screen.getByText("−2")).toBeInTheDocument()
    expect(screen.getByText("76 %")).toBeInTheDocument()
    expect(screen.getByText("+4 b.")).toBeInTheDocument()
    expect(screen.getByText("čeká na odpověď")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  it("opens the dog panel from the activity heatmap row", async () => {
    const user = userEvent.setup()
    respond({
      "overview/trainer": () => Promise.resolve(overview),
      "clients/invitations": () => Promise.resolve(invitations),
      updates: () => Promise.resolve([]),
      "dogs/d-1/metrics": () =>
        Promise.resolve({
          timeZone: "Europe/Prague",
          asOf: "2026-10-28",
          weeklyTarget: 4,
          weeklyPlannedSessions: 4,
          weeklyCompletedSessions: 2,
          weeklySkippedSessions: 0,
          weeklyTrainedDays: 2,
          weeklyTargetReached: false,
          streak: 1,
          successRate: 82,
          ratedSessions: 3,
          weeklyChange: 2,
          weeks: [
            {
              from: "2026-10-20",
              to: "2026-10-26",
              completedSessions: 2,
              trainedDays: 2,
              ratedSessions: 2,
              successRate: 82,
            },
          ],
        }),
      history: () =>
        Promise.resolve({
          items: [
            {
              id: "a-1",
              dog: { id: dog.id, name: dog.name, color: dog.color },
              title: "Přivolání v parku",
              status: "COMPLETED",
              completedAt: new Date().toISOString(),
              successRate: 80,
              note: "Šlo to dobře",
              plannedDurationMinutes: 25,
              messageCount: 0,
              lastMessage: null,
            },
          ],
          total: 1,
          page: 1,
          pageSize: 5,
          firstRecordedAt: new Date().toISOString(),
          summary: {
            month: "2026-10",
            completedSessions: 1,
            trainedDays: 1,
            successRate: 80,
          },
        }),
      "dogs/d-1/goals": () =>
        Promise.resolve([
          {
            id: "g-1",
            title: "Přivolání",
            discipline: "Poslušnost",
            status: "ACTIVE",
            criterion: null,
          },
        ]),
    })

    render(<TrainerOverview />, { wrapper: createWrapper() })

    expect(await screen.findByRole("heading", { name: /Aktivita klientů/ })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Vybrat klienta Jan Novák" }))
    expect(await screen.findByRole("complementary", { name: "Panel psa Rex" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Rex" })).toBeInTheDocument()
    expect(await screen.findByText("Přivolání")).toBeInTheDocument()
  })

  it("switches the panel dog when the client has more than one dog", async () => {
    const user = userEvent.setup()
    const baryk = { id: "d-2", name: "Baryk", color: 3 }
    const multiDogOverview: TrainerDashboard = {
      ...overview,
      activityMatrix: {
        days: overview.activityMatrix.days,
        rows: [
          {
            ...overview.activityMatrix.rows[0],
            dogs: [dog, baryk],
          },
        ],
      },
    }
    respond({
      "overview/trainer": () => Promise.resolve(multiDogOverview),
      "clients/invitations": () => Promise.resolve(invitations),
      updates: () => Promise.resolve([]),
      "dogs/d-1/metrics": () =>
        Promise.resolve({
          timeZone: "Europe/Prague",
          asOf: "2026-10-28",
          weeklyTarget: 4,
          weeklyTrainedDays: 1,
          weeklyTargetReached: false,
          streak: 0,
          successRate: 82,
          ratedSessions: 1,
          weeklyChange: null,
          weeks: [],
        }),
      "dogs/d-2/metrics": () =>
        Promise.resolve({
          timeZone: "Europe/Prague",
          asOf: "2026-10-28",
          weeklyTarget: 4,
          weeklyTrainedDays: 1,
          weeklyTargetReached: false,
          streak: 0,
          successRate: 48,
          ratedSessions: 1,
          weeklyChange: null,
          weeks: [],
        }),
      history: () =>
        Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: 5,
          firstRecordedAt: null,
          summary: {
            month: "2026-10",
            completedSessions: 0,
            trainedDays: 0,
            successRate: null,
          },
        }),
      "dogs/d-1/goals": () => Promise.resolve([]),
      "dogs/d-2/goals": () =>
        Promise.resolve([
          { id: "g-2", title: "Áčko", discipline: "Poslušnost", status: "ACTIVE", criterion: null },
        ]),
    })

    render(<TrainerOverview />, { wrapper: createWrapper() })
    await user.click(await screen.findByRole("button", { name: "Vybrat klienta Jan Novák" }))
    expect(await screen.findByRole("complementary", { name: "Panel psa Rex" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Baryk" }))
    expect(
      await screen.findByRole("complementary", { name: "Panel psa Baryk" }),
    ).toBeInTheDocument()
    expect(await screen.findByText("Áčko")).toBeInTheDocument()
  })

  it("lists attention reasons with their own actions", async () => {
    render(<TrainerOverview />, { wrapper: createWrapper() })

    expect(await screen.findByText("Nová zpráva u tréninku")).toBeInTheDocument()
    expect(screen.getByText("Rex · Jan Novák")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Upravit – Baryk" })).toHaveAttribute(
      "href",
      "/dogs/d-2/goals/g-2",
    )
    expect(screen.getByRole("link", { name: "Odpovědět – Rex" })).toHaveAttribute(
      "href",
      "/dogs/d-1/activities/a-1",
    )
  })

  it("shows clients with their last training and real trend", async () => {
    render(<TrainerOverview />, { wrapper: createWrapper() })

    expect(await screen.findByText("Dnes · Přivolání v parku")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Všech 1" })).toHaveAttribute("href", "/clients")
    expect(screen.getByRole("img", { name: /70 %, bez hodnocení, 80 %/ })).toBeInTheDocument()
  })

  it("keeps pending invitations in their own section", async () => {
    render(<TrainerOverview />, { wrapper: createWrapper() })

    expect(await screen.findByRole("heading", { name: "Čekající pozvánky" })).toBeInTheDocument()
    expect(screen.getByText("ABCD12")).toBeInTheDocument()
    expect(screen.queryByText(/Čekající pozvánka$/)).not.toBeInTheDocument()
  })

  it("shows an empty state when the trainer has no clients", async () => {
    respond({
      "overview/trainer": () =>
        Promise.resolve({
          ...overview,
          clients: [],
          attention: [],
          activityMatrix: { days: overview.activityMatrix.days, rows: [] },
          metrics: { ...overview.metrics, unreadNotes: 0, activeClients: 0 },
        }),
      "clients/invitations": () => Promise.resolve([]),
      updates: () => Promise.resolve([]),
    })

    render(<TrainerOverview />, { wrapper: createWrapper() })

    expect(await screen.findByText("Zatím nemáte žádné klienty")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /pozvat klienta/i }).length).toBeGreaterThan(0)
    expect(screen.queryByRole("heading", { name: "Čekající pozvánky" })).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /Aktivita klientů/ })).not.toBeInTheDocument()
  })

  it("keeps the shortcuts when the overview fails to load", async () => {
    respond({
      "overview/trainer": () => Promise.reject(new Error("network")),
      "clients/invitations": () => Promise.resolve([]),
      updates: () => Promise.resolve([]),
    })

    render(<TrainerOverview />, { wrapper: createWrapper() })

    expect(await screen.findByText("Přehled se nepodařilo načíst")).toBeInTheDocument()
    expect(screen.queryByText("aktivních klientů")).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /kalendář/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /moji psi/i })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /^klienti$/i })).toHaveAttribute("href", "/clients")
  })

  it("keeps the overview when invitations fail, without inventing zero", async () => {
    respond({
      "overview/trainer": () => Promise.resolve(overview),
      "clients/invitations": () => Promise.reject(new Error("down")),
      updates: () => Promise.resolve([]),
    })

    render(<TrainerOverview />, { wrapper: createWrapper() })

    expect(await screen.findByText(/pozvánky teď nejde načíst/i)).toBeInTheDocument()
    expect(screen.getByText("aktivních klientů")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Čekající pozvánky" })).not.toBeInTheDocument()
  })
})
