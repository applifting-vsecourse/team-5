import { describe, expect, it } from "vitest"

import { goalTrainingProgress } from "./goalTrainingProgress"

const session = (
  id: string,
  statuses: ("COMPLETED" | "PLANNED" | "SKIPPED")[],
  isArchived = false,
) => ({
  id,
  goalId: "goal",
  title: id,
  position: 0,
  isArchived,
  steps: [],
  scheduledTrainings: statuses.map((status, i) => ({
    id: `${id}-${i}`,
    date: new Date(2026, 10, i + 1),
    status,
  })),
})
describe("goalTrainingProgress", () => {
  it("counts repeated dated sessions, excluding skipped terms and unused variants", () => {
    const progress = goalTrainingProgress({
      sessions: [
        session("a", ["COMPLETED", "COMPLETED", "PLANNED", "SKIPPED"]),
        session("b", []),
        session("archived", ["COMPLETED"], true),
      ],
    })
    expect(progress).toMatchObject({ completed: 3, planned: 1, total: 4, percent: 75 })
  })
  it("also counts completed records made without a scheduled date", () => {
    expect(
      goalTrainingProgress({
        sessions: [
          {
            ...session("a", ["COMPLETED", "PLANNED"]),
            workoutLogs: [{ id: "free-record", completedAt: new Date() }],
          },
        ],
      }),
    ).toMatchObject({ completed: 2, planned: 1, total: 3, percent: 67 })
  })
  it("handles goals without any scheduled terms", () => {
    expect(goalTrainingProgress({ sessions: [session("a", [])] })).toMatchObject({
      completed: 0,
      total: 0,
      percent: 0,
    })
  })
})
