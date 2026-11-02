import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import { HTTPError, type NormalizedOptions } from "ky"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { dogKeys } from "@/lib/dogKeys"
import { weekKeys } from "@/lib/weekKeys"

import { completeTraining } from "@/features/training/api/completeTraining"

import { useCompleteTraining } from "./useCompleteTraining"

const mockNavigate = vi.fn()
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock("@/features/training/api/completeTraining", () => ({
  completeTraining: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const httpError = (status: number) =>
  new HTTPError(
    new Response(null, { status }),
    new Request("http://localhost/api/trainings/t1/complete"),
    {} as NormalizedOptions,
  )

const renderCompleteTraining = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const invalidate = vi.spyOn(queryClient, "invalidateQueries")
  const { result } = renderHook(() => useCompleteTraining("t1", "d1"), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })
  return { result, invalidate }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useCompleteTraining", () => {
  it("invalidates weekKeys and dogKeys, toasts and navigates to /week", async () => {
    vi.mocked(completeTraining).mockResolvedValue({
      id: "log1",
      dogId: "d1",
      title: "Chůze u nohy",
      status: "completed",
    })
    const { result, invalidate } = renderCompleteTraining()

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

  it("on 409 says the training is already done and goes back to the week", async () => {
    vi.mocked(completeTraining).mockRejectedValue(httpError(409))
    const { result, invalidate } = renderCompleteTraining()

    await act(() => result.current.mutateAsync({}).catch(() => undefined))

    expect(toast.error).toHaveBeenCalledWith("Trénink už je odcvičený")
    expect(invalidate).toHaveBeenCalledWith({ queryKey: weekKeys.all })
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/week" })
  })

  it("on 403 says the handler sends the record and stays on the form", async () => {
    vi.mocked(completeTraining).mockRejectedValue(httpError(403))
    const { result } = renderCompleteTraining()

    await act(() => result.current.mutateAsync({}).catch(() => undefined))

    expect(toast.error).toHaveBeenCalledWith("Záznam z tréninku odesílá psovod")
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("on another error asks to try again and keeps the form", async () => {
    vi.mocked(completeTraining).mockRejectedValue(new TypeError("Failed to fetch"))
    const { result } = renderCompleteTraining()

    await act(() => result.current.mutateAsync({}).catch(() => undefined))

    expect(toast.error).toHaveBeenCalledWith("Záznam se nepodařilo uložit. Zkuste to prosím znovu.")
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
