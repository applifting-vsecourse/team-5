import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { dogKeys } from "@/lib/dogKeys"

import type { Dog, DogActivity } from "@/features/dog/api/dogSchemas"

import { DogActivitiesSection } from "./DogActivitiesSection"
import { DogDetailView } from "./DogDetailView"

const demoActivities: DogActivity[] = [
  {
    id: "act-1",
    date: "18. října 2026",
    title: "Poslušnost v parku",
    status: "completed",
    successRate: 95,
    rating: 5,
    note: "Soustředil se skvěle, jen u druhého cviku byl trochu rozptýlený kolemjdoucím psem. Odložení za pohybu zvládl napoprvé.",
  },
  {
    id: "act-2",
    date: "16. října 2026",
    title: "Canicross intervaly",
    status: "completed",
    successRate: 88,
    rating: 4,
    note: "Pěkné tempo v první polovině trasy, pak mírná únava na štěrku. Celkově velmi dobré nasazení.",
  },
  {
    id: "act-3",
    date: "15. října 2026",
    title: "Trénink odložení",
    status: "skipped",
    note: "Pršelo a pes byl unavený po návštěvě veterináře. Trénink jsme po dohodě přeskočili.",
  },
  {
    id: "act-4",
    date: "13. října 2026",
    title: "Nosework – vyhledávání skořice",
    status: "completed",
    successRate: 100,
    rating: 5,
    note: "Všechny 3 vzorky našel do 40 sekund. Perfektní označení čumákem bez škrábání.",
  },
  {
    id: "act-5",
    date: "11. října 2026",
    title: "Socializace na nádraží",
    status: "completed",
    successRate: 80,
    rating: 4,
    note: "Hluk přijíždějícího vlaku zvládl s pamlsky, u eskalátoru ještě váhal.",
  },
  {
    id: "act-6",
    date: "9. října 2026",
    title: "Klid v kavárně",
    status: "skipped",
    note: "Přesunuto z důvodu nemoci psovoda.",
  },
]

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

const createWrapper = (queryClient?: QueryClient) => {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe("DogDetailView", () => {
  it("renders dog profile matching Figma node 51-386 with discipline chips and edit button", () => {
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
    expect(screen.getByRole("heading", { name: "Cíle" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Aktivity" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Deník" })).toBeInTheDocument()
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
    // Private notes stay with the owner (#70)
    expect(screen.queryByRole("heading", { name: "Deník" })).not.toBeInTheDocument()

    // Back button links to client detail
    const backLink = screen.getByRole("link", { name: /zpět na detail klienta/i })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute("href", `/clients/${aDog.ownerId}`)
    expect(screen.getByText("Klient")).toBeInTheDocument()
  })

  it("shows hero metrics when loaded from the API", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
      },
    })
    queryClient.setQueryData(dogKeys.metrics(aDog.id), {
      timeZone: "Europe/Prague",
      asOf: "2026-10-20T12:00:00Z",
      weeklyTarget: 3,
      weeklyTrainedDays: 2,
      weeklyTargetReached: false,
      streak: 0,
      successRate: 80,
      ratedSessions: 4,
      weeklyChange: null,
      weeks: [],
    })

    render(<DogDetailView dog={aDog} />, { wrapper: createWrapper(queryClient) })

    expect(screen.getByText("2/3")).toBeInTheDocument()
    expect(screen.getByText("dní tento týden")).toBeInTheDocument()
    expect(screen.getByText("0")).toBeInTheDocument()
    expect(screen.getByText("série")).toBeInTheDocument()
    expect(screen.getByText("80 %")).toBeInTheDocument()
    expect(screen.getByText("% úspěšnost")).toBeInTheDocument()
  })

  it("shows a hero-sized skeleton while metrics are loading", () => {
    render(<DogDetailView dog={aDog} />, { wrapper: createWrapper() })

    expect(screen.getByLabelText("Načítání metrik")).toBeInTheDocument()
    expect(screen.queryByText("Tento týden")).not.toBeInTheDocument()
  })

  it("shows retry when metrics fail to load", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
      },
    })
    queryClient.setQueryData(dogKeys.notes(aDog.id), [])
    queryClient.setQueryData(dogKeys.goals(aDog.id), [])
    queryClient.setQueryData([...dogKeys.detail(aDog.id), "plan"], [])
    queryClient.setQueryData(dogKeys.plannedTrainings(aDog.id), [])
    queryClient.setQueryData([...dogKeys.activities(aDog.id), { page: 1, pageSize: 3 }], {
      items: [],
      total: 0,
      page: 1,
      pageSize: 3,
    })

    render(<DogDetailView dog={aDog} />, {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(screen.getByText("Týdenní metriky se nepodařilo načíst.")).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /zkusit znovu/i })).toBeInTheDocument()
    expect(screen.queryByText("dní tento týden")).not.toBeInTheDocument()
  })
})

describe("DogActivitiesSection", () => {
  it("lists workout records by their header only: date, title and status", () => {
    render(
      <DogActivitiesSection
        dogName="Baryk"
        activities={demoActivities}
      />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByText("Poslušnost v parku")).toBeInTheDocument()
    expect(screen.getAllByText("Odcvičeno").length).toBeGreaterThan(0)
    // Results and notes are in the detail, not in the list.
    expect(screen.queryByText(/Úspěšnost/)).not.toBeInTheDocument()
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
    render(
      <DogActivitiesSection
        dogName="Baryk"
        activities={demoActivities}
      />,
      { wrapper: createWrapper() },
    )

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
    render(
      <DogActivitiesSection
        dogName="Baryk"
        activities={demoActivities}
      />,
      { wrapper: createWrapper() },
    )

    const workout = screen.getByRole("button", {
      name: /otevřít detail aktivity poslušnost v parku/i,
    })
    await user.click(workout)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Detail tréninkového záznamu pro psa Baryk.")).toBeInTheDocument()
  })
})
