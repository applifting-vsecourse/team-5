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
      { id: "b1", title: "Na vodítku", outcome: "MASTERED" as const, position: 0 },
      { id: "b2", title: "Volně", outcome: null, position: 1 },
    ],
  },
  messages: [
    {
      id: "m1",
      workoutLogId: "act-1",
      text: "Jak to šlo?",
      createdAt: "2026-11-06T11:00:00Z",
      author: { id: "t1", name: "Trenér" },
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

  it("renders record summary, steps and thread", async () => {
    render(
      <TrainingRecordPage
        dogId="dog-1"
        activityId="act-1"
      />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByRole("heading", { level: 1, name: "Záznam tréninku" })).toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "Přivolání v parku" })).toBeInTheDocument()
    expect(screen.getByText("Přivolání")).toBeInTheDocument()
    expect(screen.getByText("80 %")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Kroky" })).toBeInTheDocument()
    expect(screen.getByText("Na vodítku")).toBeInTheDocument()
    expect(screen.getByText("Volně")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Vlákno s trenérem" })).toBeInTheDocument()
    expect(screen.getByText("Jak to šlo?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "👍 Díky!" })).toBeInTheDocument()
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
})
