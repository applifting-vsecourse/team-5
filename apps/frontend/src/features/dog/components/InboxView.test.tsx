import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { InboxView } from "./InboxView"

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    ...props
  }: {
    to?: string
    params?: Record<string, string>
    children?: React.ReactNode
  }) => {
    let href = to ?? "#"
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        href = href.replace(`$${k}`, v)
      }
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
}))

vi.mock("@/lib/api-client", () => ({
  api: {
    get: vi.fn(),
  },
}))

describe("InboxView", () => {
  it("renders empty state when there are no messages", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { api } = await import("@/lib/api-client")
    vi.mocked(api.get).mockReturnValue({
      json: () => Promise.resolve([]),
    } as unknown as ReturnType<typeof api.get>)

    render(
      <QueryClientProvider client={queryClient}>
        <InboxView />
      </QueryClientProvider>,
    )

    expect(await screen.findByText("Žádné zprávy")).toBeInTheDocument()
    expect(
      screen.getByText("Zatím nemáte žádné komentáře ani zprávy u tréninků."),
    ).toBeInTheDocument()
  })

  it("renders message list and links to training record", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { api } = await import("@/lib/api-client")
    vi.mocked(api.get).mockReturnValue({
      json: () =>
        Promise.resolve([
          {
            id: "msg-1",
            workoutLogId: "log-1",
            text: "Skvělá práce při tréninku!",
            createdAt: new Date().toISOString(),
            author: { id: "trainer-1", name: "Trenér Martin" },
            activity: {
              id: "log-1",
              title: "Chůze u nohy",
              dog: { id: "dog-1", name: "Blesk", color: 1 },
            },
          },
        ]),
    } as unknown as ReturnType<typeof api.get>)

    render(
      <QueryClientProvider client={queryClient}>
        <InboxView />
      </QueryClientProvider>,
    )

    expect(await screen.findByText(/Blesk · Chůze u nohy/)).toBeInTheDocument()
    expect(screen.getByText("Trenér Martin")).toBeInTheDocument()
    expect(screen.getByText("Skvělá práce při tréninku!")).toBeInTheDocument()

    const link = screen.getByRole("link", {
      name: "Otevřít záznam tréninku Chůze u nohy pro psa Blesk",
    })
    expect(link).toHaveAttribute("href", "/dogs/dog-1/activities/log-1")
  })
})
