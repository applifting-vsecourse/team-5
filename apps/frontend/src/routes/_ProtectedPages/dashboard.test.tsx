import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DashboardPage } from "./dashboard"

let mockUser: { role?: string; name?: string } | null = { role: "client" }

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

vi.mock("@/components/Seo", () => ({
  Seo: () => null,
}))

vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: mockUser }),
}))

vi.mock("@/features/week/components/TodayView", () => ({
  TodayView: ({ userName }: { userName?: string }) => (
    <div data-testid="today-view">{userName ?? "handler"}</div>
  ),
}))

vi.mock("@/features/client/components/TrainerOverview", () => ({
  TrainerOverview: () => <div data-testid="trainer-overview">Přehled</div>,
}))

describe("DashboardPage", () => {
  beforeEach(() => {
    mockUser = { role: "client", name: "Anna Handler" }
  })

  it("shows Dnes for a handler without calendar shortcuts", () => {
    render(<DashboardPage />)
    expect(screen.getByTestId("today-view")).toHaveTextContent("Anna Handler")
    expect(screen.queryByTestId("trainer-overview")).not.toBeInTheDocument()
  })

  it("shows trainer overview for a trainer", () => {
    mockUser = { role: "trainer" }
    render(<DashboardPage />)

    expect(screen.getByTestId("trainer-overview")).toBeInTheDocument()
    expect(screen.queryByTestId("today-view")).not.toBeInTheDocument()
  })
})
