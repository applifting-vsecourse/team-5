import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import { TrainerDogPanel } from "./TrainerDogPanel"

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
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

function respond(routes: Record<string, () => Promise<unknown>>) {
  vi.mocked(api.get).mockImplementation((url: unknown) => {
    const path = String(url)
    const handler = routes[path]
    if (!handler) throw new Error(`Unexpected path ${path}`)
    return { json: handler } as unknown as ReturnType<typeof api.get>
  })
}

function mount() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <TrainerDogPanel
        dog={{ id: "d-1", name: "Rex", color: 1 }}
        clientName="Jan Novák"
        onClose={vi.fn()}
      />
    </QueryClientProvider>,
  )
}

describe("TrainerDogPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("surfaces goal load failures with retry instead of an empty list", async () => {
    const user = userEvent.setup()
    respond({
      "dogs/d-1/metrics": () =>
        Promise.resolve({
          timeZone: "Europe/Prague",
          asOf: "2026-10-28",
          weeklyTarget: 4,
          weeklyTrainedDays: 1,
          weeklyTargetReached: false,
          streak: 0,
          successRate: 70,
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
      "dogs/d-1/goals": () => Promise.reject(new Error("down")),
    })

    mount()
    expect(await screen.findByText("Cíle se nepodařilo načíst.")).toBeInTheDocument()
    expect(screen.queryByText("Žádný aktivní cíl.")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Zkusit znovu" }))
    expect(api.get).toHaveBeenCalledWith("dogs/d-1/goals")
  })

  it("shows goal progress from the plan like the dog profile", async () => {
    respond({
      "dogs/d-1/metrics": () => Promise.reject(new Error("down")),
      history: () => Promise.reject(new Error("down")),
      "dogs/d-1/goals": () =>
        Promise.resolve([
          { id: "g-1", title: "Přivolání", status: "ACTIVE", discipline: "Poslušnost" },
        ]),
      "dogs/d-1/plan": () =>
        Promise.resolve([
          {
            id: "disc-1",
            isArchived: false,
            discipline: { id: "disc-1", name: "Poslušnost" },
            goals: [
              {
                id: "g-1",
                title: "Přivolání",
                criterion: null,
                principle: null,
                status: "ACTIVE",
                sessions: [
                  {
                    id: "s-1",
                    goalId: "g-1",
                    title: "Trénink 1",
                    position: 0,
                    isArchived: false,
                    steps: [],
                    scheduledTrainings: [
                      { id: "t-1", date: "2026-11-02", status: "COMPLETED" },
                      { id: "t-2", date: "2026-11-04", status: "COMPLETED" },
                      { id: "t-3", date: "2026-11-06", status: "COMPLETED" },
                      { id: "t-4", date: "2026-11-30", status: "PLANNED" },
                    ],
                  },
                ],
              },
            ],
          },
        ]),
    })

    mount()
    expect(
      await screen.findByRole("progressbar", {
        name: "Přivolání: 3 z 4 tréninků odcvičeno",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("75 %")).toBeInTheDocument()
  })
})
