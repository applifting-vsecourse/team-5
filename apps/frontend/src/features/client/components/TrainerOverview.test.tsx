import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import type { Client, Invitation } from "@/features/client/api/clientSchemas"

import { TrainerOverview } from "./TrainerOverview"

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
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock("./InviteClientDialog", () => ({
  InviteClientDialog: () => null,
}))

const mockClients: Client[] = [
  {
    id: "c-1",
    name: "Jan Novák",
    email: "jan.novak@seznam.cz",
    dogs: [
      { id: "d-1", name: "Rex", color: 1 },
      { id: "d-2", name: "Baryk", color: 3 },
    ],
    createdAt: new Date("2026-10-21T10:00:00Z"),
  },
]

const mockInvitations: Invitation[] = [
  {
    id: "inv-1",
    code: "ABCD12",
    email: null,
    expiresAt: new Date("2026-12-01T00:00:00Z"),
    createdAt: new Date("2026-11-01T00:00:00Z"),
  },
]

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe("TrainerOverview", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const path = String(url)
      if (path === "clients") {
        return { json: () => Promise.resolve(mockClients) } as ReturnType<typeof api.get>
      }
      if (path === "clients/invitations") {
        return { json: () => Promise.resolve(mockInvitations) } as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected path ${path}`)
    })
  })

  it("shows real client and invitation counts with shortcuts", async () => {
    render(<TrainerOverview />, { wrapper: createWrapper() })

    expect(await screen.findByRole("heading", { name: "Přehled" })).toBeInTheDocument()
    expect(await screen.findByText("Jan Novák")).toBeInTheDocument()
    expect(screen.getByText("klientů")).toBeInTheDocument()
    expect(screen.getByText("sdílených psů")).toBeInTheDocument()
    expect(screen.getByText("1 čeká na přijetí")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /kalendář/i })).toHaveAttribute("href", "/week")
    expect(screen.getByRole("link", { name: /moji psi/i })).toHaveAttribute("href", "/dogs")
    expect(screen.getByRole("link", { name: /^klienti$/i })).toHaveAttribute("href", "/clients")
  })

  it("shows empty state when the trainer has no clients", async () => {
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const path = String(url)
      if (path === "clients") {
        return { json: () => Promise.resolve([]) } as ReturnType<typeof api.get>
      }
      if (path === "clients/invitations") {
        return { json: () => Promise.resolve([]) } as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected path ${path}`)
    })

    render(<TrainerOverview />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("Zatím nemáte žádné klienty")).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /pozvat klienta/i })).toBeInTheDocument()
  })

  it("keeps Kalendář and Moji psi when clients fail to load", async () => {
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const path = String(url)
      if (path === "clients") {
        return {
          json: () => Promise.reject(new Error("network")),
        } as unknown as ReturnType<typeof api.get>
      }
      if (path === "clients/invitations") {
        return { json: () => Promise.resolve([]) } as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected path ${path}`)
    })

    render(<TrainerOverview />, { wrapper: createWrapper() })

    expect(await screen.findByText("Přehled se nepodařilo načíst")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /zkusit znovu/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /kalendář/i })).toHaveAttribute("href", "/week")
    expect(screen.getByRole("link", { name: /moji psi/i })).toHaveAttribute("href", "/dogs")
    expect(screen.getByRole("link", { name: /^klienti$/i })).toHaveAttribute("href", "/clients")
  })

  it("keeps overview when invitations soft-fail without inventing zero", async () => {
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const path = String(url)
      if (path === "clients") {
        return { json: () => Promise.resolve(mockClients) } as ReturnType<typeof api.get>
      }
      if (path === "clients/invitations") {
        return {
          json: () => Promise.reject(new Error("invitations down")),
        } as unknown as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected path ${path}`)
    })

    render(<TrainerOverview />, { wrapper: createWrapper() })

    expect(await screen.findByText("Jan Novák")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Přehled" })).toBeInTheDocument()
    expect(screen.queryByText(/čeká na přijetí/i)).not.toBeInTheDocument()
    expect(screen.queryByText("pozvánek")).not.toBeInTheDocument()
    expect(screen.getByText(/počet pozvánek teď nejde načíst/i)).toBeInTheDocument()
    expect(screen.queryByText("Přehled se nepodařilo načíst")).not.toBeInTheDocument()
  })
})
