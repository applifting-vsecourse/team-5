import { describe, expect, it, vi } from "vitest"

import {
  leaveTraining,
  parseTrainingReturnSearch,
  toTrainingReturnSearch,
  trainingHome,
  trainingHomeLabel,
} from "./trainingReturn"

describe("trainingReturn", () => {
  it("parses only dnes, tyden or historie", () => {
    expect(parseTrainingReturnSearch({ zpet: "dnes" })).toEqual({ zpet: "dnes" })
    expect(parseTrainingReturnSearch({ zpet: "tyden" })).toEqual({ zpet: "tyden" })
    expect(parseTrainingReturnSearch({ zpet: "historie" })).toEqual({ zpet: "historie" })
    expect(parseTrainingReturnSearch({ zpet: "other" })).toEqual({ zpet: undefined })
    expect(parseTrainingReturnSearch({ zpet: ["dnes", "tyden"] })).toEqual({ zpet: "dnes" })
    expect(parseTrainingReturnSearch({})).toEqual({ zpet: undefined })
    expect(toTrainingReturnSearch("dnes")).toEqual({ zpet: "dnes" })
    expect(toTrainingReturnSearch()).toEqual({ zpet: undefined })
  })

  it("maps return destination to home path and label", () => {
    expect(trainingHome("dnes")).toBe("/dashboard")
    expect(trainingHome("tyden")).toBe("/week")
    expect(trainingHome("historie")).toBe("/history")
    expect(trainingHome()).toBe("/week")
    expect(trainingHomeLabel("dnes")).toBe("Zpět na Dnes")
    expect(trainingHomeLabel("tyden")).toBe("Zpět na týden")
    expect(trainingHomeLabel("historie")).toBe("Zpět na historii")
    expect(trainingHomeLabel()).toBe("Zavřít")
  })

  it("leaveTraining uses zpet, else history.back, else week", () => {
    const navigate = vi.fn()
    leaveTraining(navigate, "dnes")
    expect(navigate).toHaveBeenCalledWith({ to: "/dashboard" })

    navigate.mockClear()
    const length = vi.spyOn(window.history, "length", "get").mockReturnValue(2)
    const back = vi.spyOn(window.history, "back").mockImplementation(() => undefined)
    leaveTraining(navigate)
    expect(back).toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()

    navigate.mockClear()
    back.mockClear()
    length.mockReturnValue(1)
    leaveTraining(navigate)
    expect(back).not.toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith({ to: "/week" })
    length.mockRestore()
    back.mockRestore()
  })
})
