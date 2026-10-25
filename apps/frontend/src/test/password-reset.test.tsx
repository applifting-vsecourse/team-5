import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type * as Sonner from "sonner"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { routeTree } from "@/routeTree.gen"

const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
  getSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}))
const dogApi = vi.hoisted(() => ({ get: vi.fn() }))
const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof Sonner>()
  return {
    ...actual,
    toast: toastMock,
  }
})

vi.mock("@/lib/api-client", () => ({
  api: {
    get: (url: string, options?: { searchParams?: { token?: string } }) => {
      dogApi.get(url, options)
      if (url.includes("verify-reset-password-token")) {
        const token = options?.searchParams?.token
        const isValid = token === "valid-token"
        return {
          json: () => Promise.resolve({ valid: isValid }),
        }
      }
      return { json: () => Promise.resolve([]) }
    },
  },
}))

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: {
    signUp: { email: auth.signUp },
    getSession: auth.getSession,
    signIn: { email: auth.signIn },
    signOut: auth.signOut,
    requestPasswordReset: auth.requestPasswordReset,
    resetPassword: auth.resetPassword,
  },
}))

const user = { id: "owner-1", name: "Jana Nováková", email: "jana@example.com", role: "user" }
const clients: QueryClient[] = []

async function openPage(path = "/forgot-password") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  clients.push(queryClient)
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultPendingMinMs: 0,
  })
  await router.load()
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { router, queryClient, interaction: userEvent.setup() }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
  vi.stubGlobal("scrollTo", vi.fn())
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )
  auth.getSession.mockResolvedValue({ data: null, error: null })
  auth.requestPasswordReset.mockResolvedValue({ data: { status: true }, error: null })
  auth.resetPassword.mockResolvedValue({ data: { status: true }, error: null })
})

afterEach(() => {
  cleanup()
  clients.splice(0).forEach((client) => client.clear())
  vi.unstubAllGlobals()
})

describe("forgot password and reset password flows", () => {
  it("shows 'Zapomenuté heslo?' link in login modal above registration", async () => {
    const { interaction, router } = await openPage("/login")
    const forgotLink = await screen.findByRole("link", { name: "Zapomenuté heslo?" })
    expect(forgotLink).toBeInTheDocument()

    await interaction.click(forgotLink)
    await waitFor(() => expect(router.state.location.pathname).toBe("/forgot-password"))
    expect(await screen.findByRole("heading", { name: "Zapomenuté heslo" })).toBeInTheDocument()
  })

  it("submits email in forgot password modal and displays confirmation with back button", async () => {
    const { interaction } = await openPage("/forgot-password")
    const emailInput = screen.getByLabelText("E-mail")
    expect(emailInput).toHaveValue("") // No prefill

    await interaction.type(emailInput, "test@example.com")
    await interaction.click(screen.getByRole("button", { name: "Odeslat odkaz pro obnovu" }))

    expect(auth.requestPasswordReset).toHaveBeenCalledWith({ email: "test@example.com" })
    expect(await screen.findByText("Pokud účet existuje, poslali jsme e-mail.")).toBeInTheDocument()

    const backButton = screen.getByRole("link", { name: "Zpět na přihlášení" })
    expect(backButton).toBeInTheDocument()
  })

  it("immediately shows expired or invalid explanation when opening reset-password with invalid token", async () => {
    await openPage("/reset-password?token=invalid-or-expired")
    expect(
      await screen.findByText("Odkaz pro obnovu hesla je neplatný, vypršel nebo již byl použit."),
    ).toBeInTheDocument()

    const sendNewLink = screen.getByRole("link", { name: "Poslat nový odkaz" })
    expect(sendNewLink).toBeInTheDocument()
    expect(sendNewLink).toHaveAttribute("href", "/forgot-password")
  })

  it("allows setting a new password when token is valid and automatically signs in", async () => {
    auth.resetPassword.mockImplementation(() => {
      auth.getSession.mockResolvedValue({ data: { user }, error: null })
      return Promise.resolve({ data: { status: true }, error: null })
    })

    const { interaction, router } = await openPage("/reset-password?token=valid-token")
    expect(
      await screen.findByRole("heading", { name: "Nastavení nového hesla" }),
    ).toBeInTheDocument()

    const passwordInput = screen.getByLabelText("Nové heslo")
    const confirmInput = screen.getByLabelText("Potvrzení nového hesla")

    // Mismatched passwords
    await interaction.type(passwordInput, "newpassword123")
    await interaction.type(confirmInput, "differentpassword")
    await interaction.click(screen.getByRole("button", { name: "Uložit heslo a přihlásit se" }))

    expect(await screen.findByText("Hesla se neshodují.")).toBeInTheDocument()
    expect(auth.resetPassword).not.toHaveBeenCalled()

    // Match passwords
    await interaction.clear(confirmInput)
    await interaction.type(confirmInput, "newpassword123")
    await interaction.click(screen.getByRole("button", { name: "Uložit heslo a přihlásit se" }))

    await waitFor(() => {
      expect(auth.resetPassword).toHaveBeenCalledWith({
        token: "valid-token",
        newPassword: "newpassword123",
      })
    })

    expect(toastMock.success).toHaveBeenCalledWith(
      "Heslo bylo úspěšně změněno. Byli jste přihlášeni.",
    )
    await waitFor(() => expect(router.state.location.pathname).toBe("/week"))
  })
})
