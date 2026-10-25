import { describe, expect, it } from "vitest"

import { trainingDetailQueryOptions, trainingKeys } from "./trainingsQueryOptions"

describe("trainingsQueryOptions", () => {
  it("builds query key with trainingId", () => {
    expect(trainingKeys.detail("t123")).toEqual(["trainings", "t123"])
    const options = trainingDetailQueryOptions("t123")
    expect(options.queryKey).toEqual(["trainings", "t123"])
  })
})
