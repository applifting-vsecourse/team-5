import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { dogKeys } from "@/lib/dogKeys"
import { weekKeys } from "@/lib/weekKeys"

import { useCompleteTraining } from "./useCompleteTraining"

const mockNavigate = vi.fn()
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock("@/features/training/api/completeTraining", () => ({
  completeTraining: vi.fn().mockResolvedValue({
    id: "log1",
    dogId: "d1",
    title: "Chůze u nohy",
    status: "completed",
  }),
}))

describe("useCompleteTraining", () => {
  it("invalidates weekKeys and dogKeys, toasts and navigates to /week", async () => {
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useCompleteTraining("t1", "d1"), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    await act(() =>
      result.current.mutateAsync({
        successRate: 80,
        focus: "YES",
      }),
    )

    expect(invalidate).toHaveBeenCalledWith({ queryKey: weekKeys.all })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: dogKeys.activities("d1") })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: dogKeys.detail("d1") })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: dogKeys.all })
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/week" })
  })
})
