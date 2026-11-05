import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DashboardPage } from "./dashboard"

let mockUser: { role?: string } | null = { role: "client" }

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

describe("DashboardPage", () => {
  beforeEach(() => {
    mockUser = { role: "client" }
  })

  it("does not link to the calendar for a handler", () => {
    render(<DashboardPage />)
    expect(screen.queryByRole("link", { name: /kalendář/i })).not.toBeInTheDocument()
  })

  it("links a trainer to the calendar from the overview", () => {
    mockUser = { role: "trainer" }
    render(<DashboardPage />)

    expect(screen.getByRole("heading", { name: "Přehled" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /kalendář/i })).toHaveAttribute("href", "/week")
    expect(screen.getByRole("link", { name: /moji psi/i })).toHaveAttribute("href", "/dogs")
  })
})
