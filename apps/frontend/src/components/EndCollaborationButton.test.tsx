import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"
import { authKeys } from "@/lib/auth-keys"

import { EndCollaborationButton } from "./EndCollaborationButton"

const navigate = vi.hoisted(() => vi.fn())
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }))
vi.mock("@/lib/api-client", () => ({ api: { delete: vi.fn() } }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
})

describe("ending collaboration", () => {
  it("requires confirmation and cancel leaves sharing unchanged", async () => {
    const user = userEvent.setup()
    const client = new QueryClient()
    render(
      <QueryClientProvider client={client}>
        <EndCollaborationButton
          dogId="rex"
          dogName="Rex"
          trainerId="trainer"
          trainerName="Marek"
        />
      </QueryClientProvider>,
    )
    await user.click(screen.getByRole("button", { name: "Ukončit spolupráci" }))
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Sdílení ostatních psů se nezmění")
    expect(api.delete).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Zrušit" }))
    expect(api.delete).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Ukončit spolupráci" }))
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Ukončit spolupráci" }),
    )
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("dogs/rex/trainers/trainer"))
    expect(navigate).not.toHaveBeenCalled()
  })

  it("clears private cached data but preserves the session after trainer confirmation", async () => {
    const user = userEvent.setup()
    const client = new QueryClient()
    client.setQueryData(["dogs", "rex"], { name: "Rex" })
    client.setQueryData(authKeys.session(), { user: { id: "trainer" } })
    render(
      <QueryClientProvider client={client}>
        <EndCollaborationButton
          clientId="owner"
          clientName="Jan"
        />
      </QueryClientProvider>,
    )
    await user.click(screen.getByRole("button", { name: "Ukončit spolupráci" }))
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Ukončit spolupráci" }),
    )
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/clients" }))
    expect(client.getQueryData(["dogs", "rex"])).toBeUndefined()
    expect(client.getQueryData(authKeys.session())).toBeDefined()
  })

  it("keeps data and allows retry when the request fails", async () => {
    vi.mocked(api.delete).mockRejectedValueOnce(new Error("offline"))
    const user = userEvent.setup()
    const client = new QueryClient()
    client.setQueryData(["dogs", "rex"], { name: "Rex" })
    render(
      <QueryClientProvider client={client}>
        <EndCollaborationButton
          clientId="owner"
          clientName="Jan"
        />
      </QueryClientProvider>,
    )
    await user.click(screen.getByRole("button", { name: "Ukončit spolupráci" }))
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Ukončit spolupráci" }),
    )
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(navigate).not.toHaveBeenCalled()
    expect(client.getQueryData(["dogs", "rex"])).toBeDefined()
    expect(screen.getByRole("button", { name: "Ukončit spolupráci" })).toBeEnabled()
  })
})
