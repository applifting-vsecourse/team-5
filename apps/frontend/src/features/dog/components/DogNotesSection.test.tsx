import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"
import { todayCalendarDate } from "@/lib/calendarDate"

import { DogNotesSection } from "./DogNotesSection"

vi.mock("@/lib/api-client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const notes = [
  {
    id: "n1",
    dogId: "d-123",
    date: "2026-10-18",
    title: "Seminář poslušnosti",
    text: "Více odměňovat u levé nohy.",
    createdAt: "2026-10-18T12:00:00.000Z",
    updatedAt: "2026-10-18T12:00:00.000Z",
  },
  {
    id: "n2",
    dogId: "d-123",
    date: "2026-10-05",
    title: "Lekce canicross",
    text: "Start na povel bez otáčení.",
    createdAt: "2026-10-05T12:00:00.000Z",
    updatedAt: "2026-10-05T12:00:00.000Z",
  },
]

const renderSection = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
      }
    >
      <DogNotesSection
        dogId="d-123"
        dogName="Rex"
      />
    </QueryClientProvider>,
  )

beforeEach(() => {
  vi.mocked(api.get).mockReset()
  vi.mocked(api.post).mockReset()
  vi.mocked(api.patch).mockReset()
  vi.mocked(api.delete).mockReset()
  vi.mocked(api.get).mockReturnValue({ json: () => Promise.resolve(notes) } as never)
})

describe("DogNotesSection", () => {
  it("lists notes with edit and delete actions", async () => {
    renderSection()

    expect(await screen.findByText("Seminář poslušnosti")).toBeInTheDocument()
    expect(screen.getByText("Lekce canicross")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /upravit poznámku seminář/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /smazat poznámku seminář/i })).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith("dogs/d-123/notes")
  })

  it("opens create dialog with today prefilled and saves a note", async () => {
    const user = userEvent.setup()
    vi.mocked(api.post).mockReturnValue({
      json: () =>
        Promise.resolve({
          id: "n3",
          dogId: "d-123",
          date: todayCalendarDate(),
          title: "Lekce agility",
          text: "Nejdřív kontakt, pak překážka.",
          createdAt: "2026-11-03T12:00:00.000Z",
          updatedAt: "2026-11-03T12:00:00.000Z",
        }),
    } as never)

    renderSection()
    await screen.findByText("Seminář poslušnosti")
    await user.click(screen.getByRole("button", { name: /nová poznámka/i }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByLabelText("Datum")).toHaveValue(todayCalendarDate())

    await user.type(screen.getByLabelText("Název"), "Lekce agility")
    await user.type(screen.getByLabelText("Text"), "Nejdřív kontakt, pak překážka.")
    await user.click(screen.getByRole("button", { name: /přidat poznámku/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("dogs/d-123/notes", {
        json: {
          date: todayCalendarDate(),
          title: "Lekce agility",
          text: "Nejdřív kontakt, pak překážka.",
        },
      })
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("opens edit dialog with the note prefilled and saves changes", async () => {
    const user = userEvent.setup()
    vi.mocked(api.patch).mockReturnValue({
      json: () =>
        Promise.resolve({
          ...notes[0],
          title: "Seminář poslušnosti (upraveno)",
          text: "Kratší úseky a víc odměn.",
        }),
    } as never)

    renderSection()
    await screen.findByText("Seminář poslušnosti")
    await user.click(screen.getByRole("button", { name: /upravit poznámku seminář/i }))

    expect(screen.getByRole("heading", { name: "Upravit poznámku" })).toBeInTheDocument()
    expect(screen.getByLabelText("Datum")).toHaveValue("2026-10-18")
    expect(screen.getByLabelText("Název")).toHaveValue("Seminář poslušnosti")

    await user.clear(screen.getByLabelText("Název"))
    await user.type(screen.getByLabelText("Název"), "Seminář poslušnosti (upraveno)")
    await user.clear(screen.getByLabelText("Text"))
    await user.type(screen.getByLabelText("Text"), "Kratší úseky a víc odměn.")
    await user.click(screen.getByRole("button", { name: /^uložit$/i }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("notes/n1", {
        json: {
          date: "2026-10-18",
          title: "Seminář poslušnosti (upraveno)",
          text: "Kratší úseky a víc odměn.",
        },
      })
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("asks for confirmation before deleting a note", async () => {
    const user = userEvent.setup()
    vi.mocked(api.delete).mockResolvedValue({} as never)

    renderSection()
    await screen.findByText("Seminář poslušnosti")
    await user.click(screen.getByRole("button", { name: /smazat poznámku seminář/i }))

    expect(screen.getByRole("heading", { name: "Smazat poznámku?" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /^smazat$/i }))

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("notes/n1")
    })
  })

  it("shows an empty state when the dog has no notes", async () => {
    vi.mocked(api.get).mockReturnValue({ json: () => Promise.resolve([]) } as never)

    renderSection()

    expect(await screen.findByText(/Rex zatím nemá žádnou poznámku/i)).toBeInTheDocument()
  })
})
