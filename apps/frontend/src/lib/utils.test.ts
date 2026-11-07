import { describe, expect, it } from "vitest"

import { cn } from "./utils"

describe("semantic typography with component variants", () => {
  it.each(["page", "title", "section", "action", "label", "timer", "dog-name", "hero-title"])(
    "keeps foreground colour when overriding the size with text-%s",
    (size) => {
      const classes = cn("text-sm text-primary-foreground", `text-${size} font-bold`).split(" ")
      expect(classes).toContain("text-primary-foreground")
      expect(classes).toContain(`text-${size}`)
      expect(classes).not.toContain("text-sm")
    },
  )

  it("still replaces an overridden foreground without losing the semantic size", () => {
    const classes = cn("text-title text-muted-foreground", "text-dog-3").split(" ")
    expect(classes).toContain("text-title")
    expect(classes).toContain("text-dog-3")
    expect(classes).not.toContain("text-muted-foreground")
  })
})
