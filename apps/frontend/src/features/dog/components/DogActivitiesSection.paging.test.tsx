import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import { DogActivitiesSection } from "./DogActivitiesSection"

vi.mock("@/lib/api-client", () => ({
  api: { get: vi.fn() },
}))

// The compact list links to the history page; no router is needed for that.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children?: React.ReactNode }) => <a href="#history">{children}</a>,
}))

const record = (index: number) => ({
  id: `a${index}`,
  title: `Trénink ${index}`,
  status: "COMPLETED",
  completedAt: `2026-10-${String(30 - index).padStart(2, "0")}T10:00:00Z`,
  messages: [],
})

// The API answers with the requested page out of 5 records.
vi.mocked(api.get).mockImplementation((_url, options) => {
  const { page, pageSize } = (options?.searchParams ?? {}) as { page: number; pageSize: number }
  const all = [1, 2, 3, 4, 5].map(record)
  const items = all.slice((page - 1) * pageSize, page * pageSize)
  return { json: () => Promise.resolve({ items, total: all.length, page, pageSize }) } as never
})

const renderSection = (isCompact = false) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <DogActivitiesSection
        dogId="d1"
        dogName="Rex"
        isCompact={isCompact}
      />
    </QueryClientProvider>,
  )

describe("DogActivitiesSection loads records page by page (#79)", () => {
  it("asks the API for one page and pages through the total it reports", async () => {
    const user = userEvent.setup()
    renderSection()

    expect(await screen.findByText("Trénink 1")).toBeInTheDocument()
    expect(screen.queryByText("Trénink 4")).not.toBeInTheDocument()
    expect(screen.getByText("1 / 2")).toBeInTheDocument()
    expect(api.get).toHaveBeenLastCalledWith("dogs/d1/activities", {
      searchParams: { page: 1, pageSize: 3 },
    })

    await user.click(screen.getByRole("button", { name: /další stránka aktivit/i }))

    expect(await screen.findByText("Trénink 4")).toBeInTheDocument()
    expect(screen.getByText("2 / 2")).toBeInTheDocument()
    expect(api.get).toHaveBeenLastCalledWith("dogs/d1/activities", {
      searchParams: { page: 2, pageSize: 3 },
    })
  })

  it("on the dog's page loads only the latest records, without paging", async () => {
    renderSection(true)

    expect(await screen.findByText("Trénink 3")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /další stránka aktivit/i })).toBeNull()
  })
})
