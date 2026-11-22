import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import { TrainingRecordPage } from "./TrainingRecordPage"

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
      params?: { dogId?: string; activityId?: string }
      children?: React.ReactNode
      [key: string]: unknown
    }) => {
      let href = typeof to === "string" ? to : "#"
      if (params?.dogId) href = href.replace("$dogId", params.dogId)
      if (params?.activityId) href = href.replace("$activityId", params.activityId)
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
  },
}))

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const detail = {
  id: "act-1",
  title: "Přivolání v parku",
  dog: { id: "dog-1", name: "Rex", color: 1 },
  completedAt: "2026-11-06T10:00:00Z",
  successRate: 80,
  note: "Dobrá nálada",
  videoUrl: null,
  mistakeDetails: ["odklon"],
  focus: "YES" as const,
  repeatedMistakes: "NO" as const,
  status: "COMPLETED" as const,
  goal: {
    title: "Přivolání",
    blocks: [
      { id: "b1", title: "Na vodítku", position: 0 },
      { id: "b2", title: "Volně", position: 1 },
    ],
  },
  messages: [
    {
      id: "opening",
      workoutLogId: "act-1",
      text: "Dobrá nálada",
      createdAt: "2026-11-06T10:00:00Z",
      author: { id: "u1", name: "Panička" },
    },
    {
      id: "m1",
      workoutLogId: "act-1",
      text: "Jak to šlo?",
      createdAt: "2026-11-06T11:00:00Z",
      author: { id: "t1", name: "Trenér" },
    },
    {
      id: "m2",
      workoutLogId: "act-1",
      text: "Šlo to skvěle!",
      createdAt: "2026-11-06T11:05:00Z",
      author: { id: "u1", name: "Panička" },
    },
  ],
}

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe("TrainingRecordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      if (String(url) === "activities/act-1") {
        return { json: () => Promise.resolve(detail) } as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected url: ${String(url)}`)
    })
  })

  it("renders record summary and thread without plan steps", async () => {
    render(
      <TrainingRecordPage
        dogId="dog-1"
        activityId="act-1"
        currentUserId="u1"
      />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByRole("heading", { level: 1, name: "Záznam tréninku" })).toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "Přivolání v parku" })).toBeInTheDocument()
    expect(screen.getByText("Přivolání")).toBeInTheDocument()
    expect(screen.getByText("80 %")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Kroky" })).not.toBeInTheDocument()
    expect(screen.queryByText("Na vodítku")).not.toBeInTheDocument()
    expect(screen.queryByText("Volně")).not.toBeInTheDocument()
    expect(screen.getByText("Hotovo")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Vlákno s trenérem" })).toBeInTheDocument()
    expect(screen.getByText("Jak to šlo?")).toBeInTheDocument()
    expect(screen.getByText("Šlo to skvěle!")).toBeInTheDocument()

    const otherMsg = screen.getByText("Jak to šlo?").closest("li")
    const myMsg = screen.getByText("Šlo to skvěle!").closest("li")
    expect(otherMsg).toHaveClass("mr-auto", "bg-card")
    expect(myMsg).toHaveClass("ml-auto", "bg-accent")
    expect(screen.getAllByText("Dobrá nálada")).toHaveLength(1)
    expect(screen.getByText("Dobrá nálada").closest("li")).toHaveClass("ml-auto", "bg-accent")

    expect(screen.getByRole("button", { name: "👍 Díky!" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Zpět" })).toBeInTheDocument()
  })

  it("navigates back when clicking Zpět button", async () => {
    const user = userEvent.setup()
    Object.defineProperty(window.history, "length", { value: 2, configurable: true })
    const backSpy = vi.spyOn(window.history, "back").mockReturnValue(undefined)
    render(
      <TrainingRecordPage
        dogId="dog-1"
        activityId="act-1"
      />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByRole("button", { name: "Zpět" }))
    expect(backSpy).toHaveBeenCalled()
    backSpy.mockRestore()
  })

  it("fills composer from a quick reply chip", async () => {
    const user = userEvent.setup()
    render(
      <TrainingRecordPage
        dogId="dog-1"
        activityId="act-1"
      />,
      { wrapper: createWrapper() },
    )

    await screen.findByText("Jak to šlo?")
    await user.click(screen.getByRole("button", { name: "👍 Díky!" }))
    expect(screen.getByLabelText("Napsat zprávu")).toHaveValue("👍 Díky!")
  })

  it("shows filled sleep quality and environment context above the thread (#96)", async () => {
    vi.mocked(api.get).mockImplementation(
      () =>
        ({
          json: () =>
            Promise.resolve({
              ...detail,
              sleepQuality: "POOR",
              environment: "OUTDOORS",
            }),
        }) as ReturnType<typeof api.get>,
    )

    render(
      <TrainingRecordPage
        dogId="dog-1"
        activityId="act-1"
        currentUserId="t1"
      />,
      { wrapper: createWrapper() },
    )

    expect(await screen.findByText("Spánek")).toBeInTheDocument()
    expect(screen.getByText("Špatně")).toBeInTheDocument()
    expect(screen.getByText("Prostředí")).toBeInTheDocument()
    expect(screen.getByText("Venku")).toBeInTheDocument()
  })

  it("omits sleep quality and environment labels when not provided", async () => {
    render(
      <TrainingRecordPage
        dogId="dog-1"
        activityId="act-1"
        currentUserId="t1"
      />,
      { wrapper: createWrapper() },
    )

    await screen.findByRole("heading", { name: "Přivolání v parku" })
    expect(screen.queryByText("Spánek")).not.toBeInTheDocument()
    expect(screen.queryByText("Prostředí")).not.toBeInTheDocument()
  })

  it("renders http:// and https:// video links as clickable new-tab links (#78)", async () => {
    vi.mocked(api.get).mockImplementation(
      () =>
        ({
          json: () =>
            Promise.resolve({
              ...detail,
              videoUrl: "http://example.com/trainloop-video",
            }),
        }) as ReturnType<typeof api.get>,
    )

    render(
      <TrainingRecordPage
        dogId="dog-1"
        activityId="act-1"
        currentUserId="t1"
      />,
      { wrapper: createWrapper() },
    )

    const link = await screen.findByRole("link", { name: "example.com/trainloop-video" })
    expect(link).toHaveAttribute("href", "http://example.com/trainloop-video")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })
})
