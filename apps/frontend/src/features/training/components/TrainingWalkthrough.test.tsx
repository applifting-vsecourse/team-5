import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { TrainingDetail } from "@/features/training/api/trainingSchemas"

import { TrainingWalkthrough } from "./TrainingWalkthrough"

const { moveCurrentStep, navigate } = vi.hoisted(() => ({
  moveCurrentStep: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock("@/lib/moveCurrentStep", () => ({
  moveCurrentStep,
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

const aGoal = (currentStepId: string | null) => ({
  id: "g1",
  dogId: "d1",
  createdBy: { id: "u1", name: "Ada" },
  title: "Chůze u nohy",
  discipline: null,
  principle: null,
  status: "ACTIVE" as const,
  order: 0,
  currentStepId,
  createdAt: new Date(),
  updatedAt: new Date(),
})

const aTraining = (overrides: Partial<TrainingDetail> = {}): TrainingDetail => ({
  id: "t1",
  training: { id: "session-1", title: "Přivolání v parku" },
  date: "2026-10-22",
  status: "PLANNED",
  dog: { id: "d1", name: "Rex", color: 1 },
  goal: { id: "g1", title: "Chůze u nohy" },
  // Detail API resolves a stored null to the first step of the whole goal.
  currentStepId: "b1",
  exercises: [
    {
      id: "b1",
      position: 1,
      title: "Sedni u nohy",
      durationMinutes: 1,
      instruction: "Sedni rovně u levé nohy psovoda.",
      criterion: "Pes sedí do 2 sekund bez povelu.",
      outcome: null,
    },
    {
      id: "b2",
      position: 2,
      title: "Krok vpřed",
      instruction: "Jeden krok levou nohou, pes jde s vámi.",
      criterion: "Pes se zvedne a udělá krok bez předbíhání.",
      outcome: null,
    },
    {
      id: "b3",
      position: 3,
      title: "Obrat vlevo",
      instruction: "Obrat na místě o 90 stupňů vlevo.",
      criterion: "Pes zůstává u nohy bez odskočení.",
      outcome: null,
    },
  ],
  ...overrides,
})

function renderWalkthrough(training: TrainingDetail = aTraining()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TrainingWalkthrough training={training} />
    </QueryClientProvider>,
  )
}

describe("TrainingWalkthrough", () => {
  beforeEach(() => {
    moveCurrentStep.mockReset()
    navigate.mockReset()
  })

  it("renders header with back link to week and dog name", () => {
    renderWalkthrough()

    const backLink = screen.getByRole("link", { name: "Zpět na týden" })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute("href", "/week")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Přivolání v parku")
  })

  it("shows initial exercise with progress, instructions and criteria", () => {
    renderWalkthrough()

    expect(screen.getByText("Krok 1 ze 3")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1")
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Sedni u nohy")
    expect(screen.getByText("Hotovo, když…")).toBeInTheDocument()
    expect(screen.getByText("Pes sedí do 2 sekund bez povelu.")).toBeInTheDocument()
  })

  it("starts at the goal's current step when it belongs to this training (#66)", () => {
    renderWalkthrough(aTraining({ currentStepId: "b2" }))

    expect(screen.getByText("Krok 2 ze 3")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Krok vpřed")
  })

  it("starts at the first exercise when the current step is elsewhere (#66)", () => {
    renderWalkthrough(aTraining({ currentStepId: "other-training-step" }))

    expect(screen.getByText("Krok 1 ze 3")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Sedni u nohy")
  })

  it("keeps goal back available on the first local exercise (#66 AC3)", () => {
    renderWalkthrough()

    expect(screen.getByRole("button", { name: "Zpět o krok" })).toBeEnabled()
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
    vi.useRealTimers()
  })

  it("treats an effective pointer from training A as elsewhere when open on B (#66)", async () => {
    // Stored null on the goal becomes a1 via the training detail API; opening B
    // must not offer advance/skip for b1 (that would mark a1 instead).
    const user = userEvent.setup()
    renderWalkthrough(
      aTraining({
        id: "scheduled-b",
        currentStepId: "a1",
        exercises: [
          {
            id: "b1",
            position: 1,
            title: "B první",
            instruction: null,
            criterion: null,
            outcome: null,
          },
          {
            id: "b2",
            position: 2,
            title: "B druhý",
            instruction: null,
            criterion: null,
            outcome: null,
          },
        ],
      }),
    )

    expect(screen.queryByRole("button", { name: "Hotovo, další krok" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Dokončit trénink" })).toHaveAttribute(
      "href",
      "/trainings/scheduled-b/finish",
    )

    await user.click(screen.getByRole("button", { name: "Další krok" }))
    expect(screen.getByText("Krok 2 ze 2")).toBeInTheDocument()
    expect(moveCurrentStep).not.toHaveBeenCalled()
  })

  it("advances the current step and follows the pointer (#66)", async () => {
    const user = userEvent.setup()
    moveCurrentStep.mockResolvedValue(aGoal("b2"))
    renderWalkthrough()

    await user.click(screen.getByRole("button", { name: "Hotovo, další krok" }))

    expect(moveCurrentStep).toHaveBeenCalledWith("g1", "advance")
    expect(screen.getByText("Krok 2 ze 3")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Krok vpřed")
  })

  it("skips and goes back through the current-step API (#66)", async () => {
    const user = userEvent.setup()
    moveCurrentStep.mockResolvedValueOnce(aGoal("b2")).mockResolvedValueOnce(aGoal("b1"))
    renderWalkthrough()

    await user.click(screen.getByRole("button", { name: "Přeskočit krok" }))
    expect(moveCurrentStep).toHaveBeenCalledWith("g1", "skip")
    expect(screen.getByText("Krok 2 ze 3")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Zpět o krok" }))
    expect(moveCurrentStep).toHaveBeenCalledWith("g1", "back")
    expect(screen.getByText("Krok 1 ze 3")).toBeInTheDocument()
  })

  it("offers local navigation and finish when the pointer is in another training (#162)", async () => {
    const user = userEvent.setup()
    renderWalkthrough(aTraining({ currentStepId: "other-training-step" }))

    expect(screen.queryByRole("button", { name: "Hotovo, další krok" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Dokončit trénink" })).toHaveAttribute(
      "href",
      "/trainings/t1/finish",
    )

    await user.click(screen.getByRole("button", { name: "Další krok" }))
    expect(screen.getByText("Krok 2 ze 3")).toBeInTheDocument()
    expect(moveCurrentStep).not.toHaveBeenCalled()
  })

  it("offers Dokončit trénink on the last exercise", () => {
    renderWalkthrough(aTraining({ currentStepId: "b3" }))

    expect(screen.getByRole("button", { name: "Hotovo, dokončit" })).toBeEnabled()
  })

  it("displays fallback text when instruction or criterion is missing", () => {
    renderWalkthrough(
      aTraining({
        exercises: [
          {
            id: "b1",
            position: 1,
            title: "Volný cvik",
            instruction: null,
            criterion: null,
            outcome: null,
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
    expect(screen.getAllByRole("link", { name: "Zpět na týden" })).toHaveLength(2)
  })
})

it("saves the last outcome before opening completion and keeps the step on failure", async () => {
  navigate.mockReset()
  moveCurrentStep.mockReset()
  const user = userEvent.setup()
  moveCurrentStep.mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce(aGoal("b3"))
  renderWalkthrough(aTraining({ currentStepId: "b3" }))
  await user.click(screen.getByRole("button", { name: "Hotovo, dokončit" }))
  expect(navigate).not.toHaveBeenCalled()
  expect(screen.getByRole("heading", { name: "Obrat vlevo" })).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "Hotovo, dokončit" }))
  expect(moveCurrentStep).toHaveBeenLastCalledWith("g1", "advance")
  expect(navigate).toHaveBeenCalledWith({
    to: "/trainings/$trainingId/finish",
    params: { trainingId: "t1" },
  })
})

it("only browses completed training steps without writing progress", async () => {
  moveCurrentStep.mockReset()
  const user = userEvent.setup()
  renderWalkthrough(aTraining({ status: "COMPLETED" }))
  expect(screen.queryByRole("button", { name: "Hotovo, další krok" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Přeskočit krok" })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Dokončit trénink" })).not.toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "Další krok" }))
  expect(screen.getByRole("heading", { name: "Krok vpřed" })).toBeInTheDocument()
  expect(moveCurrentStep).not.toHaveBeenCalled()
})

it("keeps a shared trainer read-only even when viewing the current planned step", async () => {
  moveCurrentStep.mockReset()
  const user = userEvent.setup()
  renderWalkthrough(aTraining({ canTrain: false, currentStepId: "b1" }))
  expect(screen.getByText(/Náhled tréninku/)).toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Hotovo, další krok" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Přeskočit krok" })).not.toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "Další krok" }))
  expect(moveCurrentStep).not.toHaveBeenCalled()
})
