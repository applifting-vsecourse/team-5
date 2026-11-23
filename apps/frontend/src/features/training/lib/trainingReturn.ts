export type TrainingReturnTo = "dnes" | "tyden" | "historie"

export type TrainingReturnSearch = {
  zpet?: TrainingReturnTo
}

const RETURN_PATHS = {
  dnes: "/dashboard",
  tyden: "/week",
  historie: "/history",
} as const satisfies Record<TrainingReturnTo, string>

const RETURN_LABELS = {
  dnes: "Zpět na Dnes",
  tyden: "Zpět na týden",
  historie: "Zpět na historii",
} as const satisfies Record<TrainingReturnTo, string>

function asTrainingReturnTo(value: unknown): TrainingReturnTo | undefined {
  const candidate: unknown = Array.isArray(value) ? (value as unknown[])[0] : value
  return candidate === "dnes" || candidate === "tyden" || candidate === "historie"
    ? candidate
    : undefined
}

export function parseTrainingReturnSearch(search: Record<string, unknown>): TrainingReturnSearch {
  return { zpet: asTrainingReturnTo(search.zpet) }
}

export function toTrainingReturnSearch(zpet?: TrainingReturnTo): TrainingReturnSearch {
  return { zpet }
}

export function trainingHome(zpet?: TrainingReturnTo) {
  return zpet ? RETURN_PATHS[zpet] : "/week"
}

export function trainingHomeLabel(zpet?: TrainingReturnTo) {
  return zpet ? RETURN_LABELS[zpet] : "Zavřít"
}

/** Leave the walkthrough: prefer known origin, else browser history. */
export function leaveTraining(
  navigate: (opts: { to: string }) => unknown,
  zpet?: TrainingReturnTo,
) {
  if (zpet) {
    void navigate({ to: trainingHome(zpet) })
    return
  }
  if (typeof window !== "undefined" && window.history.length > 1) {
    window.history.back()
    return
  }
  void navigate({ to: "/week" })
}
