import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"
import { todayCalendarDate } from "@/lib/calendarDate"

import { TrainerNotesSection } from "./TrainerNotesSection"

vi.mock("@/lib/api-client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const dogs = [
  { id: "d1", name: "Rex", color: 1 },
  { id: "d2", name: "Baryk", color: 3 },
]

const notes = [
  {
    id: "tn-pin",
    clientId: "c1",
    dogId: "d1",
    dog: { id: "d1", name: "Rex", color: 1 },
    date: "2026-11-10",
    title: "Citlivost na hluk",
    text: "Při tramvajích zkrátit úsek a odměnit oční kontakt.",
    isPinned: true,
    createdAt: "2026-11-10T10:00:00.000Z",
    updatedAt: "2026-11-10T10:00:00.000Z",
  },
  {
    id: "tn-gen",
    clientId: "c1",
    dogId: null,
    dog: null,
    date: "2026-11-18",
    title: "Preferuje večerní lekce",
    text: "Po 18:00 lépe stíhá po práci.",
    isPinned: false,
    createdAt: "2026-11-18T10:00:00.000Z",
    updatedAt: "2026-11-18T10:00:00.000Z",
  },
]

function mockViewport(isMdUp: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("48rem") ? isMdUp : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

const renderSection = (props?: { lockedDog?: { id: string; name: string; color: number } }) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
      }
    >
      <TrainerNotesSection
        clientId="c1"
        dogs={dogs}
        lockedDog={props?.lockedDog}
      />
    </QueryClientProvider>,
  )

beforeEach(() => {
  mockViewport(true)
  vi.mocked(api.get).mockReset()
  vi.mocked(api.post).mockReset()
  vi.mocked(api.patch).mockReset()
  vi.mocked(api.delete).mockReset()
  vi.mocked(api.get).mockReturnValue({ json: () => Promise.resolve(notes) } as never)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("TrainerNotesSection", () => {
  it("renders Moje poznámky with privacy notice, pinned highlight, and dog/general labels", async () => {
    renderSection()

    expect(screen.getByRole("heading", { name: "Moje poznámky" })).toBeInTheDocument()
    expect(
      screen.getByText(/Soukromé poznámky trenéra · klient ani jiný trenér je nevidí/i),
    ).toBeInTheDocument()
    expect(await screen.findByText("Citlivost na hluk")).toBeInTheDocument()
    expect(screen.getByText("Připnuto")).toBeInTheDocument()
    expect(screen.getByText("Rex")).toBeInTheDocument()
    expect(screen.getByText("Preferuje večerní lekce")).toBeInTheDocument()
    expect(screen.getByText("Obecné")).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith("clients/c1/notes")
  })

  it("toggles pin state via PATCH /trainer-notes/:id", async () => {
    const user = userEvent.setup()
    vi.mocked(api.patch).mockReturnValue({
      json: () => Promise.resolve({ ...notes[1], isPinned: true }),
    } as never)

    renderSection()
    await screen.findByText("Preferuje večerní lekce")

    await user.click(screen.getByRole("button", { name: /připnout poznámku preferuje/i }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("trainer-notes/tn-gen", {
        json: { isPinned: true },
      })
    })
  })

  it("creates a general note from ClientDetailView", async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockReturnValue({
      json: () =>
        Promise.resolve({
          id: "tn-new",
          clientId: "c1",
          dogId: null,
          dog: null,
          date: todayCalendarDate(),
          title: "Příští lekce",
          text: "Navázat na odložení v parku.",
          isPinned: false,
          createdAt: "2026-11-19T10:00:00.000Z",
          updatedAt: "2026-11-19T10:00:00.000Z",
        }),
    } as never)

    renderSection()
    await screen.findByText("Citlivost na hluk")
    await user.click(screen.getByRole("button", { name: /nová poznámka/i }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByLabelText("Datum")).toHaveValue(todayCalendarDate())
    await user.type(screen.getByLabelText("Název"), "Příští lekce")
    await user.type(screen.getByLabelText("Text"), "Navázat na odložení v parku.")
    await user.click(screen.getByRole("button", { name: /přidat poznámku/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("clients/c1/notes", {
        json: {
          date: todayCalendarDate(),
          dogId: null,
          title: "Příští lekce",
          text: "Navázat na odložení v parku.",
        },
      })
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("automatically assigns lockedDog when creating from DogDetailView", async () => {
    const user = userEvent.setup()
    vi.mocked(api.get).mockReturnValue({ json: () => Promise.resolve([notes[0]]) } as never)
    vi.mocked(api.post).mockReturnValue({
      json: () =>
        Promise.resolve({
          id: "tn-dog",
          clientId: "c1",
          dogId: "d1",
          dog: { id: "d1", name: "Rex", color: 1 },
          date: todayCalendarDate(),
          title: "Rychlý start",
          text: "Odměnit hned po vykročení.",
          isPinned: false,
          createdAt: "2026-11-19T10:00:00.000Z",
          updatedAt: "2026-11-19T10:00:00.000Z",
        }),
    } as never)

    renderSection({ lockedDog: dogs[0] })
    await screen.findByText("Citlivost na hluk")
    expect(api.get).toHaveBeenCalledWith("clients/c1/notes", { searchParams: { dogId: "d1" } })

    await user.click(screen.getByRole("button", { name: /nová poznámka/i }))
    await user.type(screen.getByLabelText("Název"), "Rychlý start")
    await user.type(screen.getByLabelText("Text"), "Odměnit hned po vykročení.")
    await user.click(screen.getByRole("button", { name: /přidat poznámku/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("clients/c1/notes", {
        json: {
          date: todayCalendarDate(),
          dogId: "d1",
          title: "Rychlý start",
          text: "Odměnit hned po vykročení.",
        },
      })
    })
  })

  it("asks for confirmation before deleting a note", async () => {
    const user = userEvent.setup()
    vi.mocked(api.delete).mockResolvedValue({} as never)

    renderSection()
    await screen.findByText("Citlivost na hluk")
    await user.click(screen.getByRole("button", { name: /smazat poznámku citlivost/i }))

    expect(screen.getByRole("heading", { name: "Smazat poznámku?" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /^smazat$/i }))

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("trainer-notes/tn-pin")
    })
  })

  it("shows an empty state with privacy explanation and single create button", async () => {
    vi.mocked(api.get).mockReturnValue({ json: () => Promise.resolve([]) } as never)
    const user = userEvent.setup()

    renderSection()

    expect(
      await screen.findByText(
        "Zapište si postřehy z lekce, citlivosti psa nebo na co navázat příště. Klient poznámky nevidí.",
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /nová poznámka/i })).toHaveLength(1)

    const emptyTitle = screen.getByText("Zatím nemáte žádnou poznámku")
    const emptyRegion = emptyTitle.closest("[class*='rounded-card']")
    expect(emptyRegion).toBeTruthy()
    await user.click(
      within(emptyRegion as HTMLElement).getByRole("button", { name: /nová poznámka/i }),
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})
