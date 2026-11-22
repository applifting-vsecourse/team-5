import { describe, expect, it } from "vitest"

import type { WeekTraining } from "@/features/week/api/weekQueryOptions"

import { pickNextTraining, pickTodayHeroTraining } from "./pickNextTraining"

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
  it("prefers today and later over overdue", () => {
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
    ).toBe("today")
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

  it("falls back to the oldest overdue when nothing is upcoming", () => {
    expect(
      pickNextTraining(
        [
          training({ id: "older", date: "2026-11-02", status: "PLANNED" }),
          training({ id: "past", date: "2026-11-04", status: "PLANNED" }),
        ],
        "2026-11-05",
      )?.id,
    ).toBe("older")
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

describe("pickTodayHeroTraining", () => {
  it("uses today's plan when present", () => {
    expect(
      pickTodayHeroTraining(
        [
          training({ id: "past", date: "2026-11-04" }),
          training({ id: "later", date: "2026-11-07" }),
          training({ id: "today", date: "2026-11-05" }),
        ],
        "2026-11-05",
      )?.id,
    ).toBe("today")
  })

  it("surfaces overdue when today is empty, even if a future plan exists", () => {
    expect(
      pickTodayHeroTraining(
        [
          training({ id: "past", date: "2026-11-03" }),
          training({ id: "later", date: "2026-11-07" }),
        ],
        "2026-11-05",
      )?.id,
    ).toBe("past")
  })

  it("returns null for future-only plans so Dnes can show volno", () => {
    expect(
      pickTodayHeroTraining([training({ id: "later", date: "2026-11-07" })], "2026-11-05"),
    ).toBeNull()
  })
})
