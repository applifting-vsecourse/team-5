import { describe, expect, it } from "vitest"

import { performanceBandClass, performanceBandForRate } from "./performanceBands"

describe("performanceBands", () => {
  it("maps rates to DESIGN bands", () => {
    expect(performanceBandForRate(null)).toBe("empty")
    expect(performanceBandForRate(49)).toBe("low")
    expect(performanceBandForRate(50)).toBe("medium")
    expect(performanceBandForRate(65)).toBe("high")
    expect(performanceBandForRate(80)).toBe("top")
  })

  it("returns token classes", () => {
    expect(performanceBandClass("low")).toBe("bg-performance-low")
    expect(performanceBandClass("top")).toBe("bg-performance-top")
  })
})
