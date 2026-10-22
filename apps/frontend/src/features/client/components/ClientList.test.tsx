import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import type { Client, Invitation } from "@/features/client/api/clientSchemas"

import { ClientCard } from "./ClientCard"
import { ClientList } from "./ClientList"

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
      params?: { clientId?: string; dogId?: string }
      children?: React.ReactNode
      [key: string]: unknown
    }) => {
      const resolvedTo =
        typeof to === "string" ? to.replace("$clientId", params?.clientId ?? "") : "#"
      return (
        <a
          href={resolvedTo}
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

const mockClients: Client[] = [
  {
    id: "c-1",
    name: "Jan Novák",
    email: "jan.novak@seznam.cz",
    dogs: [
      { id: "d-1", name: "Rex", color: 1, breed: "Border kolie" },
      { id: "d-2", name: "Baryk", color: 3, breed: "Německý ovčák" },
    ],
    createdAt: new Date("2026-10-21T10:00:00Z"),
  },
  {
    id: "c-2",
    name: "Petra Svobodová",
    email: "petra.svobodova@email.cz",
    dogs: [{ id: "d-3", name: "Alík", color: 2, breed: "Kříženec" }],
    createdAt: new Date("2026-10-21T10:00:00Z"),
  },
  {
    id: "c-3",
    name: "Tomáš Dvořák",
    email: "tomas.dvorak@gmail.com",
    dogs: [{ id: "d-4", name: "Lucky", color: 4, breed: "Ohař" }],
    createdAt: new Date("2026-10-21T10:00:00Z"),
  },
]

const mockInvitations: Invitation[] = [
  {
    id: "inv-1",
    code: "K7M2PQ",
    expiresAt: new Date("2026-10-28T10:00:00Z"),
    createdAt: new Date("2026-10-21T10:00:00Z"),
  },
]

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe("ClientCard", () => {
  it("renders client name, email, dog avatars and link matching Figma 50:102", () => {
    render(<ClientCard client={mockClients[0]!} />, { wrapper: createWrapper() })

    expect(screen.getByText("Jan Novák")).toBeInTheDocument()
    expect(screen.getByText("jan.novak@seznam.cz")).toBeInTheDocument()

    // 2 dog avatars: Rex (R, dog-1) and Baryk (B, dog-3)
    const rexAvatar = screen.getByRole("img", { name: "Avatar psa Rex" })
    const barykAvatar = screen.getByRole("img", { name: "Avatar psa Baryk" })
    expect(rexAvatar).toBeInTheDocument()
    expect(rexAvatar).toHaveTextContent("R")
    expect(rexAvatar).toHaveClass("bg-dog-1")

    expect(barykAvatar).toBeInTheDocument()
    expect(barykAvatar).toHaveTextContent("B")
    expect(barykAvatar).toHaveClass("bg-dog-3")

    const link = screen.getByRole("link", { name: /jan novák/i })
    expect(link).toHaveAttribute("href", "/clients/c-1")
  })
})

describe("ClientList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders clients list matching Figma node 50:93", async () => {
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const urlStr = String(url)
      if (urlStr === "clients") {
        return { json: () => Promise.resolve(mockClients) } as ReturnType<typeof api.get>
      }
      if (urlStr === "clients/invitations") {
        return { json: () => Promise.resolve(mockInvitations) } as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected url: ${urlStr}`)
    })

    render(<ClientList />, { wrapper: createWrapper() })

    // Header
    expect(screen.getByRole("heading", { level: 1, name: "Vaši klienti" })).toBeInTheDocument()

    // Clients
    await waitFor(() => {
      expect(screen.getByText("Jan Novák")).toBeInTheDocument()
      expect(screen.getByText("Petra Svobodová")).toBeInTheDocument()
      expect(screen.getByText("Tomáš Dvořák")).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /pozvat klienta/i })).toBeInTheDocument()

    // Unused invitation from Figma node 50:135
    expect(screen.getByText("K7M2PQ")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /zrušit pozvánku k7m2pq/i })).toBeInTheDocument()
  })

  it("renders empty state when there are no clients", async () => {
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const urlStr = String(url)
      if (urlStr === "clients") {
        return { json: () => Promise.resolve([]) } as ReturnType<typeof api.get>
      }
      if (urlStr === "clients/invitations") {
        return { json: () => Promise.resolve([]) } as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected url: ${urlStr}`)
    })

    render(<ClientList />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText("Zatím nemáte žádné klienty")).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /pozvěte prvního klienta/i })).toBeInTheDocument()
    // V prázdném stavu je dle DESIGN.md pouze jedno primární tlačítko (horní tlačítko v hlavičce se nezobrazuje)
    expect(screen.queryByRole("button", { name: "Pozvat klienta" })).not.toBeInTheDocument()
  })

  it("opens invite dialog when Pozvat klienta in header is clicked", async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const urlStr = String(url)
      if (urlStr === "clients") {
        return { json: () => Promise.resolve(mockClients) } as ReturnType<typeof api.get>
      }
      if (urlStr === "clients/invitations") {
        return { json: () => Promise.resolve([]) } as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected url: ${urlStr}`)
    })

    render(<ClientList />, { wrapper: createWrapper() })

    const inviteBtn = await screen.findByRole("button", { name: "Pozvat klienta" })
    await user.click(inviteBtn)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Pozvat klienta e-mailem")).toBeInTheDocument()
  })

  it("sends email invitation when email is submitted in dialog", async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const urlStr = String(url)
      if (urlStr === "clients") {
        return { json: () => Promise.resolve(mockClients) } as ReturnType<typeof api.get>
      }
      if (urlStr === "clients/invitations") {
        return { json: () => Promise.resolve([]) } as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected url: ${urlStr}`)
    })
    vi.mocked(api.post).mockImplementation((url: unknown) => {
      const urlStr = String(url)
      if (urlStr === "clients/invitations") {
        return {
          json: () =>
            Promise.resolve({
              id: "inv-created",
              code: "NEW123",
              email: "novy@example.com",
              expiresAt: new Date(Date.now() + 100000).toISOString(),
              createdAt: new Date().toISOString(),
            }),
        } as unknown as ReturnType<typeof api.post>
      }
      throw new Error(`Unexpected url: ${urlStr}`)
    })

    render(<ClientList />, { wrapper: createWrapper() })

    const inviteBtn = await screen.findByRole("button", { name: "Pozvat klienta" })
    await user.click(inviteBtn)

    const emailInput = screen.getByLabelText("E-mail klienta")
    await user.type(emailInput, "novy@example.com")

    const submitBtn = screen.getByRole("button", { name: /odeslat pozvánku/i })
    await user.click(submitBtn)

    expect(await screen.findByText("Pozvánka odeslána")).toBeInTheDocument()
    expect(screen.getByText("NEW123")).toBeInTheDocument()
  })

  it("opens invite dialog when Pozvěte prvního klienta in empty state is clicked", async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const urlStr = String(url)
      if (urlStr === "clients") {
        return { json: () => Promise.resolve([]) } as ReturnType<typeof api.get>
      }
      if (urlStr === "clients/invitations") {
        return { json: () => Promise.resolve([]) } as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected url: ${urlStr}`)
    })

    render(<ClientList />, { wrapper: createWrapper() })

    const emptyCta = await screen.findByRole("button", { name: /pozvěte prvního klienta/i })
    await user.click(emptyCta)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("cancels invitation when Zrušit button is clicked", async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const urlStr = String(url)
      if (urlStr === "clients") {
        return { json: () => Promise.resolve(mockClients) } as ReturnType<typeof api.get>
      }
      if (urlStr === "clients/invitations") {
        return { json: () => Promise.resolve(mockInvitations) } as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected url: ${urlStr}`)
    })
    vi.mocked(api.delete).mockResolvedValue({} as Response)

    render(<ClientList />, { wrapper: createWrapper() })

    const cancelBtn = await screen.findByRole("button", {
      name: /zrušit pozvánku k7m2pq/i,
    })
    await user.click(cancelBtn)

    expect(api.delete).toHaveBeenCalledWith("clients/invitations/inv-1")
  })

  it("renders error state when request fails", async () => {
    vi.mocked(api.get).mockImplementation(() => {
      throw new Error("Chyba načítání")
    })

    render(<ClientList />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
      expect(screen.getByText("Chyba při načítání klientů")).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /zkusit znovu/i })).toBeInTheDocument()
  })
})
