import { describe, expect, it } from "vitest"

import type { TrainingDetail } from "@/features/training/api/trainingSchemas"

import { startExerciseIndex } from "./startExerciseIndex"

const aTraining = (overrides: Partial<TrainingDetail> = {}): TrainingDetail => ({
  id: "t1",
  date: "2026-10-22",
  status: "PLANNED",
  dog: { id: "d1", name: "Rex", color: 1 },
  goal: { id: "g1", title: "Chůze" },
  currentStepId: null,
  exercises: [
    { id: "b1", position: 1, title: "A", instruction: null, criterion: null, outcome: null },
    { id: "b2", position: 2, title: "B", instruction: null, criterion: null, outcome: null },
  ],
  ...overrides,
})

describe("startExerciseIndex", () => {
  it("starts at 0 when the pointer is null", () => {
    expect(startExerciseIndex(aTraining({ currentStepId: null }))).toBe(0)
  })

  it("starts at the current step when it is in this training", () => {
    expect(startExerciseIndex(aTraining({ currentStepId: "b2" }))).toBe(1)
  })

  it("starts at 0 when the current step belongs to another training", () => {
    expect(startExerciseIndex(aTraining({ currentStepId: "elsewhere" }))).toBe(0)
  })

  it("starts at 0 when there are no exercises", () => {
    expect(startExerciseIndex(aTraining({ exercises: [], currentStepId: "b1" }))).toBe(0)
  })
})
