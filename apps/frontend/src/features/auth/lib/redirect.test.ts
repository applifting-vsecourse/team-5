import { describe, expect, it } from "vitest"

import { decodeRedirectUri } from "@/features/auth/lib/redirect"

describe("login return destinations", () => {
  it.each([
    "https://example.com/clients",
    "//example.com/clients",
    "/\\example.com/clients",
    "javascript:alert(1)",
    "/login",
    "/signup",
    "/dogs/../login",
    "/unknown",
    "/dogs\n/clients",
    "%invalid",
    "%2F%2Fexample.com/clients",
  ])("rejects external, malformed or looping destinations: %s", (destination) => {
    expect(decodeRedirectUri(encodeURIComponent(destination))).toBeUndefined()
  })

  it("preserves the path, query and hash of a protected destination", () => {
    expect(decodeRedirectUri(encodeURIComponent("/dogs?view=all#notes"))).toBe(
      "/dogs?view=all#notes",
    )
  })
})
