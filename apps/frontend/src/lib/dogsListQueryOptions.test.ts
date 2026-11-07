import { describe, expect, it } from "vitest"

import { dogKeys } from "@/lib/dogKeys"

import { dogsListQueryOptions, dogsListSummaryKey } from "./dogsListQueryOptions"

describe("dogsListQueryOptions", () => {
  it("uses a summary key that does not collide with the full dogs list", () => {
    expect(dogsListSummaryKey).toEqual(["dogs", "list", "summary"])
    expect(dogsListQueryOptions().queryKey).toEqual(dogsListSummaryKey)
    expect(dogsListQueryOptions().queryKey).not.toEqual(dogKeys.lists())
  })
})
