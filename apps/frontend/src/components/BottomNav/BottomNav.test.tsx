import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { BottomNav } from "./BottomNav"

vi.mock("@/lib/api-client", () => ({ api: { get: () => ({ json: async () => [] }) } }))

const nav = () => (
  <QueryClientProvider client={new QueryClient()}>
    <BottomNav />
  </QueryClientProvider>
)

let currentPath = "/week"

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof Router>("@tanstack/react-router")
  return {
    ...actual,
    useLocation: () =>
      ({ pathname: currentPath }) as unknown as ReturnType<typeof Router.useLocation>,
    Link: ({ to, children, ...props }: { to?: string; children?: React.ReactNode }) => (
      <a
        href={to ?? "#"}
        {...props}
      >
        {children}
      </a>
    ),
  }
})

describe("BottomNav", () => {
  it("renders navigation items on standard pages", () => {
    currentPath = "/week"
    render(nav())

    expect(screen.getByRole("navigation", { name: "Spodní navigace" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Týden" })).toBeInTheDocument()
  })

  it("hides the bottom nav on training walkthrough routes (#76)", () => {
    currentPath = "/trainings/t1"
    const { container } = render(nav())

    expect(container).toBeEmptyDOMElement()
  })
})
