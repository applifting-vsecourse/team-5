import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { Dog } from "@/features/dog/api/dogSchemas"

import { DogActivitiesSection } from "./DogActivitiesSection"
import { DogDetailView } from "./DogDetailView"

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof Router>("@tanstack/react-router")
  return {
    ...actual,
    Link: ({
      to,
      children,
      ...props
    }: {
      to?: string
      children?: React.ReactNode
      [key: string]: unknown
    }) => (
      <a
        href={to ?? "#"}
        {...props}
      >
        {children}
      </a>
    ),
  }
})

const aDog: Dog = {
  id: "d-123",
  name: "Baryk",
  breed: "Border kolie",
  color: 1,
  ownerId: "u1",
  disciplines: ["Agility", "Canicross"],
  createdAt: new Date(),
  updatedAt: new Date(),
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

describe("DogDetailView", () => {
  it("renders dog profile matching Figma node 51-386", () => {
    render(<DogDetailView dog={aDog} />, { wrapper: createWrapper() })

    // Dog name and breed & disciplines
    expect(screen.getByRole("heading", { level: 1, name: "Baryk" })).toBeInTheDocument()
    expect(screen.getByText("Border kolie · Agility, Canicross")).toBeInTheDocument()

    // 56px PesAvatar
    const avatar = screen.getByRole("img", { name: "Avatar psa Baryk" })
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveClass("size-14")

    // Back button
    const backLink = screen.getByRole("link", { name: /zpět na seznam psů/i })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute("href", "/dogs")

    // Sections
    expect(screen.getByRole("heading", { name: "Aktivní cíle" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Aktivity" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /nový cíl/i })).toBeInTheDocument()
  })
})

describe("DogActivitiesSection", () => {
  it("renders workout records with badges, rates and notes", () => {
    render(<DogActivitiesSection dogName="Baryk" />, { wrapper: createWrapper() })

    expect(screen.getByText("Poslušnost v parku")).toBeInTheDocument()
    expect(screen.getAllByText("Odcvičeno").length).toBeGreaterThan(0)
    expect(screen.getByText("Úspěšnost: 95 %")).toBeInTheDocument()
    expect(screen.getByText("Hodnocení: 5/5")).toBeInTheDocument()
  })

  it("paginates activities page by page", async () => {
    const user = userEvent.setup()
    render(<DogActivitiesSection dogName="Baryk" />, { wrapper: createWrapper() })

    // Page 1 shows first 3 activities
    expect(screen.getByText("Poslušnost v parku")).toBeInTheDocument()
    expect(screen.getByText("1 / 2")).toBeInTheDocument()

    // Click next page
    const nextBtn = screen.getByRole("button", { name: /další stránka aktivit/i })
    await user.click(nextBtn)

    // Page 2 shows items 4-6
    await waitFor(() => {
      expect(screen.getByText("2 / 2")).toBeInTheDocument()
      expect(screen.getByText("Nosework – vyhledávání skořice")).toBeInTheDocument()
    })
  })

  it("opens detail dialog when workout record is clicked", async () => {
    const user = userEvent.setup()
    render(<DogActivitiesSection dogName="Baryk" />, { wrapper: createWrapper() })

    const workout = screen.getByRole("button", {
      name: /otevřít detail aktivity poslušnost v parku/i,
    })
    await user.click(workout)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Detail tréninkového záznamu pro psa Baryk.")).toBeInTheDocument()
  })
})
