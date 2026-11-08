import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import { HistoryView } from "./HistoryView"

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    ...props
  }: {
    to?: string
    params?: { dogId?: string; activityId?: string }
    children?: React.ReactNode
    [key: string]: unknown
  }) => {
    let href = typeof to === "string" ? to : "#"
    if (params?.dogId) href = href.replace("$dogId", params.dogId)
    if (params?.activityId) href = href.replace("$activityId", params.activityId)
    return (
      <a
        href={href}
        {...props}
      >
        {children}
      </a>
    )
  },
}))

vi.mock("@/lib/api-client", () => ({ api: { get: vi.fn() } }))

afterEach(() => vi.useRealTimers())

describe("HistoryView calendar time zone", () => {
  it.each([
    [
      "2026-10-31T23:30:00Z",
      "2026-11-01T00:15:00Z",
      "2026-11-01",
      "NE 1. 11.",
      "00:30",
      "listopad 2026",
    ],
    [
      "2026-11-01T23:30:00Z",
      "2026-11-01T23:45:00Z",
      "2026-11-02",
      "PO 2. 11.",
      "00:30",
      "listopad 2026",
    ],
    [
      "2026-06-30T22:30:00Z",
      "2026-06-30T23:45:00Z",
      "2026-07-01",
      "ST 1. 7.",
      "00:30",
      "červenec 2026",
    ],
  ])(
    "groups and displays %s in Prague, including Today",
    async (timestamp, now, day, header, time, month) => {
      vi.useFakeTimers({ toFake: ["Date"] })
      vi.setSystemTime(new Date(now))
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      vi.mocked(api.get).mockImplementation(
        (url) =>
          ({
            json: () =>
              Promise.resolve(
                url === "overview/dogs"
                  ? []
                  : {
                      items: [timestamp, `${day}T12:00:00Z`].map((completedAt, index) => ({
                        id: `a-${index}`,
                        dog: { id: "d-1", name: "Rex", color: 1 },
                        title: `Trénink ${index}`,
                        status: "COMPLETED",
                        completedAt,
                        successRate: 80,
                        note: null,
                        plannedDurationMinutes: null,
                        messageCount: 0,
                        lastMessage: null,
                      })),
                      total: 2,
                      page: 1,
                      pageSize: 5,
                      firstRecordedAt: timestamp,
                      summary: {
                        month: day.slice(0, 7),
                        completedSessions: 2,
                        trainedDays: 1,
                        successRate: 80,
                      },
                    },
              ),
          }) as ReturnType<typeof api.get>,
      )

      render(
        <QueryClientProvider client={client}>
          <HistoryView />
        </QueryClientProvider>,
      )

      const heading = await screen.findByRole("heading", { name: `DNES · ${header}` })
      expect(heading).toHaveAttribute("id", `history-${day}`)
      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1)
      const group = screen.getByRole("region", { name: `DNES · ${header}` })
      expect(within(group).getAllByRole("listitem")).toHaveLength(2)
      expect(within(group).getByText(`Rex · ${time}`)).toBeInTheDocument()
      expect(within(group).getAllByRole("link", { name: /^Odpovědět k tréninku/ })).toHaveLength(2)
      expect(screen.getByText(`2 záznamů · od ${month}`)).toBeInTheDocument()
    },
  )

  it("does not label yesterday in Prague as Today", async () => {
    const { formatHistoryDay } = await import("@/lib/historyDate")
    expect(
      formatHistoryDay(new Date("2026-11-01T21:30:00Z"), new Date("2026-11-01T23:30:00Z")),
    ).toBe("NE 1. 11.")
  })
})
