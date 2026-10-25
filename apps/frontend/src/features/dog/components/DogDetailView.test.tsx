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

const aDog: Dog = {
  id: "d-123",
  name: "Baryk",
  breed: "Border kolie",
  color: 1,
  photoUrl: null,
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
  it("renders dog profile matching Figma node 51-386 with badges and edit button", () => {
    render(<DogDetailView dog={aDog} />, { wrapper: createWrapper() })

    // Dog name and breed & disciplines
    expect(screen.getByRole("heading", { level: 1, name: "Baryk" })).toBeInTheDocument()
    expect(screen.getByText("Border kolie")).toBeInTheDocument()
    expect(screen.getByText("Agility")).toBeInTheDocument()
    expect(screen.getByText("Canicross")).toBeInTheDocument()

    // 56px PesAvatar
    const avatar = screen.getByRole("img", { name: "Avatar psa Baryk" })
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveClass("size-14")

    // Edit button exists
    const editBtn = screen.getByRole("button", { name: /upravit psa/i })
    expect(editBtn).toBeInTheDocument()

    // Back button
    const backLink = screen.getByRole("link", { name: /zpět na seznam psů/i })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute("href", "/dogs")

    // Sections
    expect(screen.getByRole("heading", { name: "Aktivní cíle" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Aktivity" })).toBeInTheDocument()
    // "+ Nový cíl" opens Tvorba tréninku (#62)
    expect(screen.getByRole("link", { name: /nový cíl/i })).toHaveAttribute(
      "href",
      "/dogs/d-123/goals/new",
    )
  })

  it("opens edit dog dialog when edit button is clicked", async () => {
    const user = userEvent.setup()
    render(<DogDetailView dog={aDog} />, { wrapper: createWrapper() })

    const editBtn = screen.getByRole("button", { name: /upravit psa/i })
    await user.click(editBtn)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Upravit psa" })).toBeInTheDocument()
  })

  it("renders dog photo when photoUrl is present", () => {
    const dogWithPhoto: Dog = {
      ...aDog,
      photoUrl: "https://example.com/baryk.jpg",
    }
    render(<DogDetailView dog={dogWithPhoto} />, { wrapper: createWrapper() })

    const img = screen.getByRole("img", { name: "Baryk" })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", "https://example.com/baryk.jpg")
  })

  it("hides edit button and links back to client when user is not the owner", () => {
    render(
      <DogDetailView
        dog={aDog}
        isOwner={false}
      />,
      { wrapper: createWrapper() },
    )

    // Dog name is visible
    expect(screen.getByRole("heading", { level: 1, name: "Baryk" })).toBeInTheDocument()

    // Edit button must NOT be rendered
    expect(screen.queryByRole("button", { name: /upravit psa/i })).not.toBeInTheDocument()

    // Back button links to client detail
    const backLink = screen.getByRole("link", { name: /zpět na detail klienta/i })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute("href", `/clients/${aDog.ownerId}`)
    expect(screen.getByText("Klient")).toBeInTheDocument()
  })
})

describe("DogActivitiesSection", () => {
  it("lists workout records by their header only: date, title and status", () => {
    render(<DogActivitiesSection dogName="Baryk" />, { wrapper: createWrapper() })

    expect(screen.getByText("Poslušnost v parku")).toBeInTheDocument()
    expect(screen.getAllByText("Odcvičeno").length).toBeGreaterThan(0)
    // Results and notes are in the detail, not in the list.
    expect(screen.queryByText("Úspěšnost: 95 %")).not.toBeInTheDocument()
    expect(screen.queryByText(/Soustředil se skvěle/)).not.toBeInTheDocument()
  })

  it("shows only the latest records on the dog's page, with a link to the history", () => {
    const activities = Array.from({ length: 5 }, (_, index) => ({
      id: `a${index}`,
      title: `Trénink ${index + 1}`,
      status: "completed" as const,
      completedAt: new Date(2026, 9, 20 - index),
    }))
    render(
      <DogActivitiesSection
        dogId="d-123"
        dogName="Baryk"
        activities={activities}
        isCompact
      />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByText("Trénink 1")).toBeInTheDocument()
    expect(screen.getByText("Trénink 3")).toBeInTheDocument()
    expect(screen.queryByText("Trénink 4")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /další stránka aktivit/i })).toBeNull()
    expect(screen.getByRole("link", { name: /celá historie/i })).toHaveAttribute(
      "href",
      "/dogs/d-123/activities",
    )
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
