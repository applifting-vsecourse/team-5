import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { TrainingDetail } from "@/features/training/api/trainingSchemas"

import { TrainingWalkthrough } from "./TrainingWalkthrough"

const moveCurrentStep = vi.hoisted(() => vi.fn())

vi.mock("@/lib/moveCurrentStep", () => ({
  moveCurrentStep,
}))

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
  date: "2026-10-22",
  status: "PLANNED",
  dog: { id: "d1", name: "Rex", color: 1 },
  goal: { id: "g1", title: "Chůze u nohy" },
  currentStepId: null,
  exercises: [
    {
      id: "b1",
      position: 1,
      title: "Sedni u nohy",
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
  })

  it("renders header with back link to week and dog name", () => {
    renderWalkthrough()

    const backLink = screen.getByRole("link", { name: "Zpět na týden" })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute("href", "/week")

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Trénink · Rex")
  })

  it("shows initial exercise (1/3) with progress, instructions and criteria", () => {
    renderWalkthrough()

    expect(screen.getByText("CVIK 1 ZE 3")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1")
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Sedni u nohy")

    expect(screen.getByText("Instrukce")).toBeInTheDocument()
    expect(screen.getByText("Sedni rovně u levé nohy psovoda.")).toBeInTheDocument()

    expect(screen.getByText("Hotovo, když…")).toBeInTheDocument()
    expect(screen.getByText("Pes sedí do 2 sekund bez povelu.")).toBeInTheDocument()
  })

  it("starts at the goal's current step when it belongs to this training (#66)", () => {
    renderWalkthrough(aTraining({ currentStepId: "b2" }))

    expect(screen.getByText("CVIK 2 ZE 3")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Krok vpřed")
  })

  it("starts at the first exercise when the current step is elsewhere (#66)", () => {
    renderWalkthrough(aTraining({ currentStepId: "other-training-step" }))

    expect(screen.getByText("CVIK 1 ZE 3")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Sedni u nohy")
  })

  it("disables 'Zpět o krok' on the first exercise", () => {
    renderWalkthrough()

    expect(screen.getByRole("button", { name: "Zpět o krok" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Zvládnuto, další krok" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Přeskočit" })).toBeEnabled()
  })

  it("advances the current step and follows the pointer (#66)", async () => {
    const user = userEvent.setup()
    moveCurrentStep.mockResolvedValue({
      id: "g1",
      dogId: "d1",
      createdBy: { id: "u1", name: "Ada" },
      title: "Chůze u nohy",
      discipline: null,
      principle: null,
      status: "ACTIVE",
      order: 0,
      currentStepId: "b2",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    renderWalkthrough()

    await user.click(screen.getByRole("button", { name: "Zvládnuto, další krok" }))

    expect(moveCurrentStep).toHaveBeenCalledWith("g1", "advance")
    expect(screen.getByText("CVIK 2 ZE 3")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Krok vpřed")
  })

  it("skips and goes back through the current-step API (#66)", async () => {
    const user = userEvent.setup()
    moveCurrentStep
      .mockResolvedValueOnce({
        id: "g1",
        dogId: "d1",
        createdBy: { id: "u1", name: "Ada" },
        title: "Chůze",
        discipline: null,
        principle: null,
        status: "ACTIVE",
        order: 0,
        currentStepId: "b2",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: "g1",
        dogId: "d1",
        createdBy: { id: "u1", name: "Ada" },
        title: "Chůze",
        discipline: null,
        principle: null,
        status: "ACTIVE",
        order: 0,
        currentStepId: "b1",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    renderWalkthrough()

    await user.click(screen.getByRole("button", { name: "Přeskočit" }))
    expect(moveCurrentStep).toHaveBeenCalledWith("g1", "skip")
    expect(screen.getByText("CVIK 2 ZE 3")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Zpět o krok" }))
    expect(moveCurrentStep).toHaveBeenCalledWith("g1", "back")
    expect(screen.getByText("CVIK 1 ZE 3")).toBeInTheDocument()
  })

  it("offers Dokončit trénink on the last exercise", () => {
    renderWalkthrough(aTraining({ currentStepId: "b3" }))

    const finishLink = screen.getByRole("link", { name: "Dokončit trénink" })
    expect(finishLink).toHaveAttribute("href", "/trainings/t1/finish")
  })

  it("allows jumping directly to an exercise from 'Všechny cviky' list", async () => {
    const user = userEvent.setup()
    renderWalkthrough()

    const exercise3Button = screen.getByRole("button", { name: /3.*Obrat vlevo/ })
    await user.click(exercise3Button)

    expect(screen.getByText("CVIK 3 ZE 3")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Obrat vlevo")

    const exercise1Button = screen.getByRole("button", { name: /Sedni u nohy/ })
    expect(within(exercise1Button).getByLabelText("Hotovo: Sedni u nohy")).toBeInTheDocument()
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

    expect(screen.getByText("K tomuto cviku není zadána žádná instrukce.")).toBeInTheDocument()
    expect(screen.getByText("Kritérium nebylo specifikováno.")).toBeInTheDocument()
  })

  it("renders empty state when there are no exercises", () => {
    renderWalkthrough(aTraining({ exercises: [] }))

    expect(screen.getByText("Tento trénink zatím nemá žádné cviky.")).toBeInTheDocument()
    expect(screen.getAllByRole("link", { name: "Zpět na týden" })).toHaveLength(2)
  })
})
