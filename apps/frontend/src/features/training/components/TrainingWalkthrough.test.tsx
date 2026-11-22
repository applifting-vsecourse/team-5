import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { TrainingDetail } from "@/features/training/api/trainingSchemas"

import { TrainingWalkthrough } from "./TrainingWalkthrough"

const { navigate } = vi.hoisted(() => ({
  navigate: vi.fn(),
}))

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof Router>("@tanstack/react-router")
  return {
    ...actual,
    useNavigate: () => navigate,
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
      let href = to ?? "#"
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

const aTraining = (overrides: Partial<TrainingDetail> = {}): TrainingDetail => ({
  id: "t1",
  training: { id: "session-1", title: "Přivolání v parku" },
  date: "2026-10-22",
  status: "PLANNED",
  dog: { id: "d1", name: "Rex", color: 1 },
  goal: { id: "g1", title: "Chůze u nohy" },
  unreadReplyIds: [],
  exercises: [
    {
      id: "b1",
      position: 1,
      title: "Sedni u nohy",
      durationMinutes: 1,
      instruction: "Sedni rovně u levé nohy psovoda.",
      criterion: "Pes sedí do 2 sekund bez povelu.",
    },
    {
      id: "b2",
      position: 2,
      title: "Krok vpřed",
      instruction: "Jeden krok levou nohou, pes jde s vámi.",
      criterion: "Pes se zvedne a udělá krok bez předbíhání.",
    },
    {
      id: "b3",
      position: 3,
      title: "Obrat vlevo",
      instruction: "Obrat na místě o 90 stupňů vlevo.",
      criterion: "Pes zůstává u nohy bez odskočení.",
    },
  ],
  ...overrides,
})

function renderWalkthrough(
  training: TrainingDetail = aTraining(),
  options?: { zpet?: "dnes" | "tyden" },
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TrainingWalkthrough
        training={training}
        zpet={options?.zpet}
      />
    </QueryClientProvider>,
  )
}

describe("TrainingWalkthrough", () => {
  it("keeps the clicker available across local steps and hides it in read-only views", async () => {
    const user = userEvent.setup()
    const { unmount } = renderWalkthrough()
    await user.click(screen.getByRole("button", { name: /Klikr/i }))
    expect(screen.getByRole("status", { name: "Počet kliknutí: 1" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Hotovo, další krok" }))
    expect(screen.getByRole("heading", { name: "Krok vpřed" })).toBeInTheDocument()
    expect(screen.getByRole("status", { name: "Počet kliknutí: 1" })).toBeInTheDocument()
    unmount()

    const completed = renderWalkthrough(aTraining({ status: "COMPLETED" }))
    expect(screen.queryByRole("button", { name: /Klikr/i })).not.toBeInTheDocument()
    completed.unmount()
    renderWalkthrough(aTraining({ canTrain: false }))
    expect(screen.queryByRole("button", { name: /Klikr/i })).not.toBeInTheDocument()
  })

  beforeEach(() => {
    navigate.mockReset()
  })

  it("renders header with close control and dog name", () => {
    renderWalkthrough()

    expect(screen.getByRole("button", { name: "Zavřít" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Přivolání v parku")
  })

  it("labels week return when started from týden", () => {
    renderWalkthrough(aTraining(), { zpet: "tyden" })

    expect(screen.getByRole("button", { name: "Zpět na týden" })).toBeInTheDocument()
  })

  it("shows initial exercise with progress, instructions and criteria", () => {
    renderWalkthrough()

    expect(screen.getByText("Krok 1 ze 3")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1")
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Sedni u nohy")
    expect(screen.getByText("Hotovo, když…")).toBeInTheDocument()
    expect(screen.getByText("Pes sedí do 2 sekund bez povelu.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Zpět o krok" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Hotovo, další krok" })).toBeEnabled()
  })

  it("shows a timer while the exercise is on screen", () => {
    vi.useFakeTimers()
    renderWalkthrough()

    expect(screen.getByRole("timer")).toHaveTextContent("1:00")
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByRole("timer")).toHaveTextContent("0:57")
    act(() => {
      vi.advanceTimersByTime(56000)
    })
    expect(screen.getByRole("timer")).toHaveTextContent("0:01")
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByRole("timer")).toHaveTextContent("0:00")
    expect(screen.getByRole("button", { name: "Spustit časovač" })).toBeDisabled()
    vi.useRealTimers()
  })

  it("walks forward, skips, goes back and opens finish on the last step", async () => {
    const user = userEvent.setup()
    renderWalkthrough()

    await user.click(screen.getByRole("button", { name: "Hotovo, další krok" }))
    expect(screen.getByText("Krok 2 ze 3")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Krok vpřed")

    await user.click(screen.getByRole("button", { name: "Zpět o krok" }))
    expect(screen.getByText("Krok 1 ze 3")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Přeskočit krok" }))
    expect(screen.getByText("Krok 2 ze 3")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Hotovo, další krok" }))
    expect(screen.getByText("Krok 3 ze 3")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Hotovo, dokončit" })).toBeEnabled()

    await user.click(screen.getByRole("button", { name: "Hotovo, dokončit" }))
    expect(navigate).toHaveBeenCalledWith({
      to: "/trainings/$trainingId/finish",
      params: { trainingId: "t1" },
      search: { zpet: undefined },
    })
  })

  it("returns to dnes when started from today", async () => {
    const user = userEvent.setup()
    renderWalkthrough(aTraining(), { zpet: "dnes" })

    await user.click(screen.getByRole("button", { name: "Zpět na Dnes" }))
    expect(navigate).toHaveBeenCalledWith({ to: "/dashboard" })
  })

  it("displays fallback text when instruction or criterion is missing", () => {
    renderWalkthrough(
      aTraining({
        unreadReplyIds: [],
        exercises: [
          {
            id: "b1",
            position: 1,
            title: "Volný cvik",
            instruction: null,
            criterion: null,
          },
        ],
      }),
    )

    expect(screen.getByText("Instrukce zatím nejsou doplněné.")).toBeInTheDocument()
    expect(screen.getByText("Kritérium zatím není doplněné.")).toBeInTheDocument()
  })

  it("renders empty state when there are no exercises", () => {
    renderWalkthrough(aTraining({ exercises: [] }))

    expect(screen.getByText("Tento trénink zatím nemá žádné cviky.")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Zavřít" })).toHaveLength(2)
  })

  it("only browses completed training steps without writing progress", async () => {
    const user = userEvent.setup()
    renderWalkthrough(aTraining({ status: "COMPLETED" }))
    expect(screen.queryByRole("button", { name: "Hotovo, další krok" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Přeskočit krok" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Dokončit trénink" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Další krok" }))
    expect(screen.getByRole("heading", { name: "Krok vpřed" })).toBeInTheDocument()
  })

  it("keeps a shared trainer read-only", async () => {
    const user = userEvent.setup()
    renderWalkthrough(aTraining({ canTrain: false }))
    expect(screen.getByText(/Náhled tréninku/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Hotovo, další krok" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Přeskočit krok" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Další krok" }))
    expect(screen.getByRole("heading", { name: "Krok vpřed" })).toBeInTheDocument()
  })
})
