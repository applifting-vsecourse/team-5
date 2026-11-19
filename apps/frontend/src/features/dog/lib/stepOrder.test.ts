import { walkOrderIds } from "./stepOrder"

const step = (id: string, position: number, parentId: string | null = null) => ({
  id,
  position,
  parentId,
})

describe("walkOrderIds", () => {
  it("walks sub-steps before the parent, then the main path", () => {
    expect(
      walkOrderIds([
        step("a", 0),
        step("b", 1),
        step("b1", 0, "b"),
        step("b2", 1, "b"),
        step("c", 2),
      ]),
    ).toEqual(["a", "b1", "b2", "b", "c"])
  })
})
