import { describe, expect, it } from "vitest"

import type { WeekTraining } from "@/features/week/api/weekQueryOptions"

import { pickNextTraining } from "./pickNextTraining"

const training = (overrides: Partial<WeekTraining>): WeekTraining => ({
  id: "t1",
  date: "2026-11-05",
  status: "PLANNED",
  dog: { id: "d1", name: "Rex", color: 1 },
  goal: { id: "g1", title: "Přivolání" },
  exercises: [{ id: "e1", title: "Sedni" }],
  ...overrides,
})

describe("pickNextTraining", () => {
  it("returns overdue planned before today and later", () => {
    expect(
      pickNextTraining(
        [
          training({ id: "past", date: "2026-11-04", status: "PLANNED" }),
          training({ id: "later", date: "2026-11-07", dog: { id: "d2", name: "Bára", color: 2 } }),
          training({ id: "today", date: "2026-11-05" }),
          training({ id: "done", date: "2026-11-05", status: "COMPLETED" }),
        ],
        "2026-11-05",
      )?.id,
    ).toBe("past")
  })

  it("prefers today over later when nothing is overdue", () => {
    expect(
      pickNextTraining(
        [
          training({ id: "later", date: "2026-11-07", dog: { id: "d2", name: "Bára", color: 2 } }),
          training({ id: "today", date: "2026-11-05" }),
          training({ id: "done", date: "2026-11-05", status: "COMPLETED" }),
        ],
        "2026-11-05",
      )?.id,
    ).toBe("today")
  })

  it("returns null when nothing planned remains", () => {
    expect(
      pickNextTraining(
        [
          training({ status: "COMPLETED" }),
          training({ id: "t2", date: "2026-11-04", status: "SKIPPED" }),
        ],
        "2026-11-05",
      ),
    ).toBeNull()
  })
})
