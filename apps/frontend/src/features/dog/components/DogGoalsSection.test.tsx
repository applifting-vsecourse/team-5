import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { PlanGoal } from "@/features/dog/api/trainingEditor"

import { GoalProgressCard } from "./DogGoalsSection"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, search }: { children: ReactNode; search?: { session: string } }) => (
    <a href={search?.session ?? "goal"}>{children}</a>
  ),
}))
const goal: PlanGoal = {
  id: "goal",
  title: "Přivolání",
  criterion: "Přiběhne na první povel",
  principle: null,
  status: "ACTIVE",
  createdBy: { name: "Marek" },
  deadline: "2026-11-30",
  sessions: [
    {
      id: "a",
      goalId: "goal",
      title: "V parku",
      isArchived: false,
      position: 0,
      steps: [],
      scheduledTrainings: [
        { id: "a1", date: new Date("2026-11-01"), status: "COMPLETED" },
        { id: "a2", date: new Date("2026-11-02"), status: "COMPLETED" },
        { id: "a3", date: new Date("2026-11-10"), status: "PLANNED" },
        { id: "a4", date: new Date("2026-11-03"), status: "SKIPPED" },
      ],
    },
    {
      id: "b",
      goalId: "goal",
      title: "Doma",
      isArchived: false,
      position: 1,
      steps: [],
      scheduledTrainings: [],
    },
  ],
}
describe("GoalProgressCard", () => {
  it("shows real occurrence progress, author, criterion and next planned repetition", () => {
    render(
      <GoalProgressCard
        goal={goal}
        dogId="rex"
      />,
    )
    expect(screen.getByText("2 z 3 tréninků")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "67 % tréninků dokončeno" })).toBeInTheDocument()
    expect(screen.getByText(/Cíl nastavil Marek/)).toBeInTheDocument()
    expect(screen.getByText(/Hotovo, když: Přiběhne na první povel/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /V parku/ })).toHaveAttribute("href", "a")
  })
  it("does not invent a next training when nothing is scheduled", () => {
    render(
      <GoalProgressCard
        goal={{
          ...goal,
          sessions: goal.sessions.map((session) => ({ ...session, scheduledTrainings: [] })),
        }}
        dogId="rex"
      />,
    )
    expect(screen.getByText("0 z 0 tréninků")).toBeInTheDocument()
    expect(screen.queryByText(/DALŠÍ/)).not.toBeInTheDocument()
  })
})
