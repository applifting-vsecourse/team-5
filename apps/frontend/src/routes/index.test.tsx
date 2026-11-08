import type * as TanstackReactRouter from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LandingPage } from "@/app/LandingPage"

import { getLandingRedirect, Route } from "./index"

const mockNavigate = vi.fn()

// Mock @tanstack/react-router
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackReactRouter>()
  return {
    ...actual,
    createFileRoute: () => (config: Record<string, unknown>) => ({
      options: config,
      beforeLoad: config.beforeLoad,
    }),
    Link: ({
      children,
      to,
      className,
    }: {
      children: React.ReactNode
      to: string
      className?: string
    }) => (
      <a
        href={to}
        className={className}
      >
        {children}
      </a>
    ),
    useNavigate: () => mockNavigate,
  }
})

// Mock Header
vi.mock("@/components/Header/Header", () => ({
  Header: () => <header data-testid="header">TrainLoop</header>,
}))

// Mock Seo
vi.mock("@/components/Seo", () => ({
  Seo: () => null,
}))

describe("LandingPage", () => {
  it("renders main headline and description according to Figma design", () => {
    render(<LandingPage />)

    expect(
      screen.getByRole("heading", {
        name: /trénink psa, který nekončí na lekci./i,
        level: 1,
      }),
    ).toBeInTheDocument()

    expect(screen.getByText(/zadání od trenéra máš v telefonu/i)).toBeInTheDocument()
  })

  it("renders CTA buttons for registration, trainer code, and sign-in", () => {
    render(<LandingPage />)

    const registerLink = screen.getByRole("link", { name: /začít zdarma/i })
    expect(registerLink).toBeInTheDocument()
    expect(registerLink).toHaveAttribute("href", "/signup")

    const codeButton = screen.getByRole("button", { name: /mám pozvánku od trenéra/i })
    expect(codeButton).toBeInTheDocument()

    const loginLink = screen.getByRole("link", { name: /přihlásit se/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute("href", "/login")
  })

  it("explains the three steps using a product preview", () => {
    render(<LandingPage />)
    expect(screen.getByText("Trenér nastaví cíle a tréninky psa")).toBeInTheDocument()
    expect(screen.getByText("Trénuješ venku podle kroků")).toBeInTheDocument()
    expect(screen.getByText("Zapíšeš výsledek, trenér odpoví")).toBeInTheDocument()
  })

  it("opens trainer code dialog and navigates to signup with the code on submit", async () => {
    const user = userEvent.setup()
    render(<LandingPage />)

    const codeButton = screen.getByRole("button", { name: /mám pozvánku od trenéra/i })
    await user.click(codeButton)

    expect(screen.getByRole("heading", { name: /mám kód od trenéra/i })).toBeInTheDocument()

    const input = screen.getByLabelText(/kód pozvánky/i)
    await user.type(input, "ABC123")

    const submitButton = screen.getByRole("button", {
      name: /pokračovat/i,
    })
    await user.click(submitButton)

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/invite",
      search: { code: "ABC123" },
    })
  })

  describe("getLandingRedirect", () => {
    it("returns null for unauthenticated visitors", () => {
      expect(getLandingRedirect(null)).toBeNull()
    })

    it("redirects regular users / dog owners to Dnes", () => {
      const ownerSession = {
        user: {
          id: "u1",
          email: "owner@test.cz",
          name: "Psovod",
          username: "psovod",
          role: "user",
        },
      }
      expect(getLandingRedirect(ownerSession)).toBe("/dashboard")
    })

    it("redirects trainers to the Clients tab", () => {
      const trainerSession = {
        user: {
          id: "t1",
          email: "trainer@test.cz",
          name: "Trenér",
          username: "trener",
          role: "trainer",
        },
      }
      expect(getLandingRedirect(trainerSession)).toBe("/clients")
    })
  })

  describe("beforeLoad", () => {
    it("redirects authenticated users to their respective tabs", async () => {
      const beforeLoad = (Route as unknown as { beforeLoad: (ctx: unknown) => Promise<void> })
        .beforeLoad

      const queryClient = {
        ensureQueryData: vi.fn().mockResolvedValue({
          user: { role: "trainer" },
        }),
      }

      await expect(
        beforeLoad({
          context: { queryClient },
        }),
      ).rejects.toMatchObject({
        options: {
          to: "/clients",
        },
      })
    })

    it("does not redirect unauthenticated users", async () => {
      const beforeLoad = (Route as unknown as { beforeLoad: (ctx: unknown) => Promise<void> })
        .beforeLoad

      const queryClient = {
        ensureQueryData: vi.fn().mockResolvedValue(null),
      }

      await expect(
        beforeLoad({
          context: { queryClient },
        }),
      ).resolves.toBeUndefined()
    })

    it("catches network errors gracefully and keeps user on the landing page", async () => {
      const beforeLoad = (Route as unknown as { beforeLoad: (ctx: unknown) => Promise<void> })
        .beforeLoad

      const queryClient = {
        ensureQueryData: vi.fn().mockRejectedValue(new Error("Network offline")),
      }

      await expect(
        beforeLoad({
          context: { queryClient },
        }),
      ).resolves.toBeUndefined()
    })
  })
})
