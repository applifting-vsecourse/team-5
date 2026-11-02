import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type * as Sonner from "sonner"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"
import { routeTree } from "@/routeTree.gen"

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
}))

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
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: {
    getSession: auth.getSession,
  },
}))

const user = { id: "client-1", name: "Pavel Novák", email: "pavel@example.com", role: "user" }
const clients: QueryClient[] = []

async function openPage(path = "/invite") {
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
})

afterEach(() => {
  cleanup()
  clients.splice(0).forEach((client) => client.clear())
  vi.unstubAllGlobals()
})

describe("invite page (/invite)", () => {
  it("shows missing code message when no code in query", async () => {
    await openPage("/invite")
    expect(await screen.findByText("Chybí kód pozvánky")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Přejít na úvodní stránku" })).toBeInTheDocument()
  })

  it("shows invalid or expired message when code verification fails", async () => {
    vi.mocked(api.get).mockImplementation(() => {
      throw new Error("Invitation not found")
    })

    await openPage("/invite?code=BAD123")
    expect(await screen.findByText("Neplatný nebo vypršený kód")).toBeInTheDocument()
    expect(screen.getByText(/BAD123/)).toBeInTheDocument()
  })

  it("shows trainer invite and registration/login options when not authenticated", async () => {
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const urlStr = String(url)
      if (urlStr.includes("invitations/K7M2PQ")) {
        return {
          json: () =>
            Promise.resolve({
              valid: true,
              code: "K7M2PQ",
              trainerName: "Veronika Trenérka",
              email: "klient@example.com",
            }),
        } as unknown as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected url: ${urlStr}`)
    })

    await openPage("/invite?code=K7M2PQ")

    expect(await screen.findByText("Pozvánka do TrainLoopu")).toBeInTheDocument()
    expect(screen.getByText(/Trenér Veronika Trenérka vás zve ke spolupráci/i)).toBeInTheDocument()
    expect(screen.getByText("K7M2PQ")).toBeInTheDocument()

    const signupLink = screen.getByRole("link", { name: "Zaregistrovat se jako psovod" })
    expect(signupLink).toBeInTheDocument()
    expect(signupLink).toHaveAttribute("href", "/signup?code=K7M2PQ&email=klient%40example.com")

    const loginLink = screen.getByRole("link", { name: /Už mám účet → Přihlásit se/i })
    expect(loginLink).toBeInTheDocument()
  })

  it("prioritizes login when invitation email belongs to an existing user", async () => {
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const urlStr = String(url)
      if (urlStr.includes("invitations/EXIST1")) {
        return {
          json: () =>
            Promise.resolve({
              valid: true,
              code: "EXIST1",
              trainerName: "Veronika Trenérka",
              email: "eva.novotna@email.cz",
              isExistingUser: true,
            }),
        } as unknown as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected url: ${urlStr}`)
    })

    await openPage("/invite?code=EXIST1")

    expect(await screen.findByText(/K e-mailu/i)).toBeInTheDocument()
    expect(screen.getByText("eva.novotna@email.cz")).toBeInTheDocument()

    const loginBtn = screen.getByRole("link", { name: "Přihlásit se a pokračovat k propojení" })
    expect(loginBtn).toBeInTheDocument()
    expect(loginBtn.getAttribute("href")).toContain("/login")
    expect(loginBtn.getAttribute("href")).toContain("EXIST1")
  })

  it("allows logged-in client to accept invitation with selected dogs", async () => {
    auth.getSession.mockResolvedValue({ data: { user }, error: null })
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const urlStr = String(url)
      if (urlStr.includes("invitations/K7M2PQ")) {
        return {
          json: () =>
            Promise.resolve({
              valid: true,
              code: "K7M2PQ",
              trainerName: "Veronika Trenérka",
              email: "pavel@example.com",
            }),
        } as unknown as ReturnType<typeof api.get>
      }
      if (urlStr === "dogs" || urlStr.endsWith("/dogs")) {
        return {
          json: () =>
            Promise.resolve([
              {
                id: "dog-1",
                name: "Blesk",
                breed: "Border kolie",
                color: 1,
                disciplines: [],
                ownerId: "client-1",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ]),
        } as unknown as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected url: ${urlStr}`)
    })
    vi.mocked(api.post).mockImplementation((url: unknown) => {
      const urlStr = String(url)
      if (urlStr.includes("invitations/accept")) {
        return {
          json: () => Promise.resolve({ success: true }),
        } as unknown as ReturnType<typeof api.post>
      }
      throw new Error(`Unexpected url: ${urlStr}`)
    })

    const { interaction } = await openPage("/invite?code=K7M2PQ")

    expect(await screen.findByText("Blesk")).toBeInTheDocument()
    const acceptBtn = await screen.findByRole("button", {
      name: "Přijmout pozvánku a propojit účet",
    })
    expect(acceptBtn).toBeInTheDocument()
    expect(screen.getByText("Pavel Novák")).toBeInTheDocument()
    await interaction.click(acceptBtn)

    expect(vi.mocked(api.post)).toHaveBeenCalledWith("invitations/accept", {
      json: { code: "K7M2PQ", dogIds: ["dog-1"] },
    })
    expect(await screen.findByText("Propojení úspěšné!")).toBeInTheDocument()
  })

  it("prompts logged-in client to create a dog if they have none", async () => {
    auth.getSession.mockResolvedValue({ data: { user }, error: null })
    vi.mocked(api.get).mockImplementation((url: unknown) => {
      const urlStr = String(url)
      if (urlStr.includes("invitations/K7M2PQ")) {
        return {
          json: () =>
            Promise.resolve({
              valid: true,
              code: "K7M2PQ",
              trainerName: "Veronika Trenérka",
              email: "pavel@example.com",
            }),
        } as unknown as ReturnType<typeof api.get>
      }
      if (urlStr === "dogs" || urlStr.endsWith("/dogs")) {
        return {
          json: () => Promise.resolve([]),
        } as unknown as ReturnType<typeof api.get>
      }
      throw new Error(`Unexpected url: ${urlStr}`)
    })

    await openPage("/invite?code=K7M2PQ")

    expect(await screen.findByText(/Zatím nemáte v účtu žádného psa/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Založit psa" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Přijmout pozvánku a propojit účet" })).toBeDisabled()
  })
})
