import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { dogKeys } from "@/lib/dogKeys"
import { useMoveCurrentStep } from "@/lib/useMoveCurrentStep"

import { useCreateGoal } from "./useCreateGoal"
import { useUpdateGoal } from "./useUpdateGoal"

vi.mock("@/features/dog/api/saveGoal", () => ({
  createGoal: vi.fn().mockResolvedValue({ id: "goal", dogId: "dog" }),
  updateGoal: vi.fn().mockResolvedValue({ id: "goal", dogId: "dog" }),
}))
vi.mock("@/lib/moveCurrentStep", () => ({
  moveCurrentStep: vi.fn().mockResolvedValue({ id: "goal", dogId: "dog", currentStepId: "step" }),
}))

describe("goal cache refresh", () => {
  const values = { title: "Goal", discipline: "", principle: "" }
  it.each(["create", "update", "move"] as const)(
    "refreshes the dog plan after %s",
    async (action) => {
      const client = new QueryClient()
      const planKey = [...dogKeys.detail("dog"), "plan"]
      client.setQueryData(planKey, [])
      client.setQueryData(dogKeys.goals("dog"), [])
      client.setQueryData([...dogKeys.detail("other-dog"), "plan"], [])
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      )
      const { result } = renderHook(
        () => ({
          create: useCreateGoal("dog"),
          update: useUpdateGoal("dog", "goal"),
          move: useMoveCurrentStep("goal", "dog"),
        }),
        { wrapper },
      )
      await act(async () => {
        if (action === "move") await result.current.move.mutateAsync("advance")
        else await result.current[action].mutateAsync(values)
      })
      expect(client.getQueryState(planKey)?.isInvalidated).toBe(true)
      expect(client.getQueryState(dogKeys.goals("dog"))?.isInvalidated).toBe(true)
      expect(client.getQueryState([...dogKeys.detail("other-dog"), "plan"])?.isInvalidated).toBe(
        false,
      )
      client.clear()
    },
  )
})
