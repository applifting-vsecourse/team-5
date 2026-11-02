import type * as Router from "@tanstack/react-router"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { TrainingDetail } from "@/features/training/api/trainingSchemas"

import { TrainingWalkthrough } from "./TrainingWalkthrough"

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
  exercises: [
    {
      id: "b1",
      position: 1,
      title: "Sedni u nohy",
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

describe("TrainingWalkthrough", () => {
  it("renders header with back link to week and dog name", () => {
    render(<TrainingWalkthrough training={aTraining()} />)

    const backLink = screen.getByRole("link", { name: "Zpět na týden" })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute("href", "/week")

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Trénink · Rex")
  })

  it("shows initial exercise (1/3) with progress, instructions and criteria", () => {
    render(<TrainingWalkthrough training={aTraining()} />)

    expect(screen.getByText("CVIK 1 ZE 3")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1")
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Sedni u nohy")

    expect(screen.getByText("Instrukce")).toBeInTheDocument()
    expect(screen.getByText("Sedni rovně u levé nohy psovoda.")).toBeInTheDocument()

    expect(screen.getByText("Kritérium zvládnutí")).toBeInTheDocument()
    expect(screen.getByText("Pes sedí do 2 sekund bez povelu.")).toBeInTheDocument()
  })

  it("disables 'Předchozí' button on the first exercise and enables 'Další cvik'", () => {
    render(<TrainingWalkthrough training={aTraining()} />)

    expect(screen.getByRole("button", { name: "Předchozí" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Další cvik" })).toBeEnabled()
  })

  it("navigates through exercises using 'Další cvik' and 'Předchozí'", async () => {
    const user = userEvent.setup()
    render(<TrainingWalkthrough training={aTraining()} />)

    // Step to exercise 2
    await user.click(screen.getByRole("button", { name: "Další cvik" }))

    expect(screen.getByText("CVIK 2 ZE 3")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2")
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Krok vpřed")
    expect(screen.getByText("Jeden krok levou nohou, pes jde s vámi.")).toBeInTheDocument()

    // "Předchozí" is now enabled
    const prevButton = screen.getByRole("button", { name: "Předchozí" })
    expect(prevButton).toBeEnabled()

    // Step back to exercise 1
    await user.click(prevButton)

    expect(screen.getByText("CVIK 1 ZE 3")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Sedni u nohy")
    expect(screen.getByRole("button", { name: "Předchozí" })).toBeDisabled()
  })

  it("changes 'Další cvik' to 'Dokončit' link on the last exercise", async () => {
    const user = userEvent.setup()
    render(<TrainingWalkthrough training={aTraining()} />)

    // Advance to last exercise (3/3)
    await user.click(screen.getByRole("button", { name: "Další cvik" }))
    await user.click(screen.getByRole("button", { name: "Další cvik" }))

    expect(screen.getByText("CVIK 3 ZE 3")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Obrat vlevo")

    // "Další cvik" should be replaced by "Dokončit"
    expect(screen.queryByRole("button", { name: "Další cvik" })).not.toBeInTheDocument()
    const finishLink = screen.getByRole("link", { name: "Dokončit" })
    expect(finishLink).toBeInTheDocument()
    expect(finishLink).toHaveAttribute("href", "/trainings/t1/finish")
  })

  it("allows jumping directly to an exercise from 'Všechny cviky' list", async () => {
    const user = userEvent.setup()
    render(<TrainingWalkthrough training={aTraining()} />)

    // Click on exercise 3 in the list
    const exercise3Button = screen.getByRole("button", { name: /3.*Obrat vlevo/ })
    await user.click(exercise3Button)

    expect(screen.getByText("CVIK 3 ZE 3")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Obrat vlevo")

    // Previous exercises should show completed checkmark
    const exercise1Button = screen.getByRole("button", { name: /Sedni u nohy/ })
    expect(within(exercise1Button).getByLabelText("Hotovo: Sedni u nohy")).toBeInTheDocument()
  })

  it("displays fallback text when instruction or criterion is missing", () => {
    render(
      <TrainingWalkthrough
        training={aTraining({
          exercises: [
            {
              id: "b1",
              position: 1,
              title: "Volný cvik",
              instruction: null,
              criterion: null,
            },
          ],
        })}
      />,
    )

    expect(screen.getByText("K tomuto cviku není zadána žádná instrukce.")).toBeInTheDocument()
    expect(screen.getByText("Kritérium nebylo specifikováno.")).toBeInTheDocument()
  })

  it("renders empty state when there are no exercises", () => {
    render(<TrainingWalkthrough training={aTraining({ exercises: [] })} />)

    expect(screen.getByText("Tento trénink zatím nemá žádné cviky.")).toBeInTheDocument()
    expect(screen.getAllByRole("link", { name: "Zpět na týden" })).toHaveLength(2)
  })
})
