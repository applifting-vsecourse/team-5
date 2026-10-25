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
        name: /zadání z lekce, které klient nezapomene/i,
        level: 1,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(/trenér zapíše cíl a cviky s instrukcí a kritériem/i),
    ).toBeInTheDocument()
  })

  it("renders CTA buttons for registration, trainer code, and sign-in", () => {
    render(<LandingPage />)

    const registerLink = screen.getByRole("link", { name: /zaregistrovat se/i })
    expect(registerLink).toBeInTheDocument()
    expect(registerLink).toHaveAttribute("href", "/signup")

    const codeButton = screen.getByRole("button", { name: /mám kód od trenéra/i })
    expect(codeButton).toBeInTheDocument()

    const loginLink = screen.getByRole("link", { name: /přihlásit se/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute("href", "/login")
  })

  it("renders sections for trainer and dog owner with all points", () => {
    render(<LandingPage />)

    expect(screen.getByRole("heading", { name: /pro trenéra/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByText(/zadání mezi lekcemi máte písemně u psa klienta/i)).toBeInTheDocument()
    expect(screen.getByText(/klienta připojíte kódem, který mu dáte na lekci/i)).toBeInTheDocument()
    expect(screen.getByText(/vidíte jen své klienty a jejich psy/i)).toBeInTheDocument()

    expect(screen.getByRole("heading", { name: /pro psovoda/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByText(/v týdnu vidíte, co máte kdy cvičit/i)).toBeInTheDocument()
    expect(screen.getByText(/trénink projdete cvik po cviku s kritériem/i)).toBeInTheDocument()
    expect(
      screen.getByText(/po tréninku zapíšete, jak to šlo, trenér to uvidí/i),
    ).toBeInTheDocument()
  })

  it("opens trainer code dialog and navigates to signup with the code on submit", async () => {
    const user = userEvent.setup()
    render(<LandingPage />)

    const codeButton = screen.getByRole("button", { name: /mám kód od trenéra/i })
    await user.click(codeButton)

    expect(screen.getByRole("heading", { name: /mám kód od trenéra/i })).toBeInTheDocument()

    const input = screen.getByLabelText(/kód pozvánky/i)
    await user.type(input, "ABC123XYZ")

    const submitButton = screen.getByRole("button", {
      name: /pokračovat/i,
    })
    await user.click(submitButton)

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/invite",
      search: { code: "ABC123XYZ" },
    })
  })

  describe("getLandingRedirect", () => {
    it("returns null for unauthenticated visitors", () => {
      expect(getLandingRedirect(null)).toBeNull()
    })

    it("redirects regular users / dog owners to the Week tab", () => {
      const ownerSession = {
        user: {
          id: "u1",
          email: "owner@test.cz",
          name: "Psovod",
          username: "psovod",
          role: "user",
        },
      }
      expect(getLandingRedirect(ownerSession)).toBe("/week")
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
