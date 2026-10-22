import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { Client } from "@/features/client/api/clientSchemas"

import { ClientDetailView } from "./ClientDetailView"

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
      let resolvedTo = typeof to === "string" ? to : "#"
      if (params?.dogId) {
        resolvedTo = resolvedTo.replace("$dogId", params.dogId)
      }
      if (params?.clientId) {
        resolvedTo = resolvedTo.replace("$clientId", params.clientId)
      }
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

const aClient: Client = {
  id: "c-123",
  name: "Jan Novák",
  email: "jan.novak@seznam.cz",
  dogs: [
    {
      id: "dog-rex-1",
      name: "Rex",
      breed: "Border kolie",
      color: 1,
      disciplines: ["Poslušnost", "Canicross"],
    },
    {
      id: "dog-baryk-1",
      name: "Baryk",
      breed: "Německý ovčák",
      color: 3,
      disciplines: ["Agility"],
    },
  ],
  createdAt: new Date("2026-10-21T10:00:00Z"),
}

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

describe("ClientDetailView", () => {
  it("renders client profile, email, back link and shared dogs matching #82", () => {
    render(<ClientDetailView client={aClient} />, { wrapper: createWrapper() })

    // Client profile header
    expect(screen.getByRole("heading", { level: 1, name: "Jan Novák" })).toBeInTheDocument()
    expect(screen.getByText("jan.novak@seznam.cz")).toBeInTheDocument()

    // Back link
    const backLink = screen.getByRole("link", { name: /zpět na seznam klientů/i })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute("href", "/clients")

    // Section heading
    expect(screen.getByRole("heading", { level: 2, name: "Sdílení psi" })).toBeInTheDocument()

    // Dogs
    expect(screen.getByText("Rex")).toBeInTheDocument()
    expect(screen.getByText("Border kolie · Poslušnost, Canicross")).toBeInTheDocument()
    expect(screen.getByText("Baryk")).toBeInTheDocument()
    expect(screen.getByText("Německý ovčák · Agility")).toBeInTheDocument()

    // Links to dog details (/dogs/$dogId)
    const rexLink = screen.getByRole("link", { name: /rex/i })
    expect(rexLink).toHaveAttribute("href", "/dogs/dog-rex-1")

    const barykLink = screen.getByRole("link", { name: /baryk/i })
    expect(barykLink).toHaveAttribute("href", "/dogs/dog-baryk-1")
  })

  it("renders empty state when client shares no dogs", () => {
    const clientWithoutDogs: Client = {
      ...aClient,
      dogs: [],
    }
    render(<ClientDetailView client={clientWithoutDogs} />, { wrapper: createWrapper() })

    expect(screen.getByText("Klient s vámi zatím nesdílí žádného psa.")).toBeInTheDocument()
  })
})
