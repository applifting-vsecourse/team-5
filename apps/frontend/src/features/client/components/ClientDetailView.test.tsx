import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import type { Client } from "@/features/client/api/clientSchemas"

import { ClientDetailView } from "./ClientDetailView"

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
      params?: { clientId?: string; dogId?: string; activityId?: string; goalId?: string }
      children?: React.ReactNode
      [key: string]: unknown
    }) => {
      let resolvedTo = typeof to === "string" ? to : "#"
      if (params?.dogId) resolvedTo = resolvedTo.replace("$dogId", params.dogId)
      if (params?.clientId) resolvedTo = resolvedTo.replace("$clientId", params.clientId)
      if (params?.activityId) resolvedTo = resolvedTo.replace("$activityId", params.activityId)
      if (params?.goalId) resolvedTo = resolvedTo.replace("$goalId", params.goalId)
      return (
        <a
          href={resolvedTo}
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
  },
}))

const aClient: Client = {
  id: "c-123",
  name: "Jan Novák",
  email: "jan.novak@seznam.cz",
  dogs: [
    {
      id: "dog-rex-1",
      name: "Rex",
      breed: "Border kolie",
      color: 1,
      disciplines: ["Poslušnost", "Canicross"],
    },
    {
      id: "dog-baryk-1",
      name: "Baryk",
      breed: "Německý ovčák",
      color: 3,
      disciplines: ["Agility"],
    },
  ],
  createdAt: new Date("2026-10-21T10:00:00Z"),
}

const metrics = {
  timeZone: "Europe/Prague",
  asOf: "2026-11-07",
  weeklyTarget: 3,
  weeklyTrainedDays: 2,
  weeklyTargetReached: false,
  streak: 1,
  successRate: 82,
  ratedSessions: 4,
  weeklyChange: null,
  weeks: [],
}

const emptyHistory = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 5,
  firstRecordedAt: null,
  summary: {
    month: "2026-11",
    completedSessions: 0,
    trainedDays: 0,
    successRate: null,
  },
}

function respond(routes: Record<string, () => Promise<unknown>>) {
  vi.mocked(api.get).mockImplementation((url: unknown) => {
    const path = String(url)
    const handler = routes[path]
    if (!handler) throw new Error(`Unexpected path ${path}`)
    return { json: handler } as unknown as ReturnType<typeof api.get>
  })
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe("ClientDetailView", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    respond({
      "overview/trainer": () =>
        Promise.resolve({
          metrics: {
            activeClients: 1,
            newClientsThisMonth: 0,
            completedThisWeek: 0,
            weeklySessionChange: 0,
            successRate: null,
            weeklyRateChange: null,
          },
          clients: [],
          attention: [
            {
              id: "att-1",
              kind: "reply",
              dog: { id: "dog-rex-1", name: "Rex", color: 1 },
              client: { id: "c-123", name: "Jan Novák" },
              label: "Nová zpráva",
              activityId: "act-99",
              goalId: null,
            },
          ],
        }),
      "dogs/dog-rex-1/metrics": () => Promise.resolve(metrics),
      "dogs/dog-baryk-1/metrics": () => Promise.resolve({ ...metrics, successRate: 60 }),
      "dogs/dog-rex-1/goals": () =>
        Promise.resolve([
          {
            id: "goal-1",
            dogId: "dog-rex-1",
            createdBy: { id: "u-1", name: "Trenér" },
            title: "Přivolání na píšťalku",
            status: "ACTIVE",
            discipline: "Poslušnost",
            principle: null,
            criterion: "3× spolehlivě",
            deadline: null,
            order: 0,
            currentStepId: null,
            createdAt: "2026-10-01T10:00:00Z",
            updatedAt: "2026-10-01T10:00:00Z",
          },
        ]),
      history: () =>
        Promise.resolve({
          ...emptyHistory,
          items: [
            {
              id: "act-99",
              dog: { id: "dog-rex-1", name: "Rex", color: 1 },
              title: "Trénink přivolání",
              status: "COMPLETED",
              completedAt: "2026-11-06T10:00:00Z",
              successRate: 80,
              note: null,
              plannedDurationMinutes: 20,
              messageCount: 1,
              lastMessage: null,
            },
          ],
          total: 1,
        }),
    })
  })

  it("renders client profile, actions, dogs with %, goal and records", async () => {
    render(<ClientDetailView client={aClient} />, { wrapper: createWrapper() })

    expect(screen.getByRole("heading", { level: 1, name: "Jan Novák" })).toBeInTheDocument()
    expect(screen.getByText("jan.novak@seznam.cz")).toBeInTheDocument()

    const backLink = screen.getByRole("link", { name: /zpět na seznam klientů/i })
    expect(backLink).toHaveAttribute("href", "/clients")

    const napsat = await screen.findByRole("link", { name: /napsat/i })
    expect(napsat).toHaveAttribute("href", "/dogs/dog-rex-1/activities/act-99")

    const naplanovat = screen.getByRole("link", { name: /naplánovat/i })
    expect(naplanovat).toHaveAttribute("href", "/dogs/dog-rex-1")

    expect(screen.getByRole("heading", { level: 2, name: "Psi" })).toBeInTheDocument()
    expect(screen.getByText("Rex")).toBeInTheDocument()
    expect(screen.getByText("Border kolie · Poslušnost · Canicross")).toBeInTheDocument()
    expect(screen.getByText("Baryk")).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("82 %")).toBeInTheDocument()
      expect(screen.getByText("60 %")).toBeInTheDocument()
    })

    expect(await screen.findByText("Přivolání na píšťalku")).toBeInTheDocument()
    expect(screen.getByText(/aktivní cíl · rex · poslušnost/i)).toBeInTheDocument()

    expect(screen.getByRole("heading", { level: 2, name: "Poslední záznamy" })).toBeInTheDocument()
    const record = await screen.findByRole("link", { name: /trénink přivolání/i })
    expect(record).toHaveAttribute("href", "/dogs/dog-rex-1/activities/act-99")
    expect(screen.getByText("nový")).toBeInTheDocument()
  })

  it("renders empty state when client shares no dogs", () => {
    respond({
      "overview/trainer": () =>
        Promise.resolve({
          metrics: {
            activeClients: 0,
            newClientsThisMonth: 0,
            completedThisWeek: 0,
            weeklySessionChange: 0,
            successRate: null,
            weeklyRateChange: null,
          },
          clients: [],
          attention: [],
        }),
      history: () => Promise.resolve(emptyHistory),
    })
    const clientWithoutDogs: Client = {
      ...aClient,
      dogs: [],
    }
    render(<ClientDetailView client={clientWithoutDogs} />, { wrapper: createWrapper() })

    expect(screen.getByText("Klient s vámi zatím nesdílí žádného psa")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /napsat/i })).toBeDisabled()
  })
})
