import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router"
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { authKeys } from "@/lib/auth-keys"
import { routeTree } from "@/routeTree.gen"

const auth = vi.hoisted(() => ({ deleteUser: vi.fn(), getSession: vi.fn(), signOut: vi.fn() }))
vi.mock("@/features/auth/lib/auth-client", () => ({ authClient: auth }))
vi.mock("@/lib/api-client", () => ({ api: { get: () => ({ json: () => Promise.resolve([]) }) } }))

const owner = { id: "owner-1", name: "Jana", email: "jana@example.com", role: "user" }
const clients: QueryClient[] = []

async function openPage(path = "/account", role: string | null = "user") {
  auth.getSession.mockResolvedValue({
    data: role ? { user: { ...owner, role } } : null,
    error: null,
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  clients.push(queryClient)
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: ["/dogs", path] }),
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
})

afterEach(() => {
  cleanup()
  clients.splice(0).forEach((client) => client.clear())
  vi.unstubAllGlobals()
})

describe("account deletion", () => {
  for (const role of ["user", "trainer"]) {
    it(`explains the consequences for ${role}, validates the password and can be cancelled`, async () => {
      const { interaction } = await openPage("/account", role)
      expect(
        await screen.findByRole("link", { name: "Zásady zpracování osobních údajů" }),
      ).toHaveAttribute("href", "/privacy")
      await interaction.click(screen.getByRole("button", { name: "Smazat účet" }))
      const dialog = screen.getByRole("dialog")
      expect(
        within(dialog).getByText(
          role === "trainer" ? /spolupráci se všemi klienty/ : /Trvale smažete své psy/,
        ),
      ).toBeInTheDocument()
      await interaction.click(within(dialog).getByRole("button", { name: "Trvale smazat účet" }))
      expect(await screen.findByText("Pro smazání účtu zadejte heslo.")).toBeInTheDocument()
      expect(auth.deleteUser).not.toHaveBeenCalled()
      await interaction.type(screen.getByLabelText("Heslo"), "secret password")
      await interaction.click(screen.getByRole("button", { name: "Zrušit" }))
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      await interaction.click(screen.getByRole("button", { name: "Smazat účet" }))
      expect(screen.getByLabelText("Heslo")).toHaveValue("")
      expect(auth.deleteUser).not.toHaveBeenCalled()
    })
  }

  it("shows a wrong-password error under the field and permits a retry", async () => {
    auth.deleteUser.mockResolvedValue({ error: { code: "INVALID_PASSWORD", status: 400 } })
    const { interaction, queryClient, router } = await openPage()
    queryClient.setQueryData(["private-dogs"], ["my dog"])
    await interaction.click(await screen.findByRole("button", { name: "Smazat účet" }))
    await interaction.type(screen.getByLabelText("Heslo"), "wrong password")
    await interaction.click(screen.getByRole("button", { name: "Trvale smazat účet" }))
    expect(await screen.findByText("Zadejte správné heslo ke svému účtu.")).toBeInTheDocument()
    expect(screen.getByLabelText("Heslo")).toHaveFocus()
    expect(queryClient.getQueryData(["private-dogs"])).toEqual(["my dog"])
    expect(router.state.location.pathname).toBe("/account")
    await interaction.click(screen.getByRole("button", { name: "Trvale smazat účet" }))
    await waitFor(() => expect(auth.deleteUser).toHaveBeenCalledTimes(2))
  })

  it("reports a network failure without logging out or clearing account data", async () => {
    auth.deleteUser.mockRejectedValue(new TypeError("Network error"))
    const { interaction, queryClient } = await openPage()
    await interaction.click(await screen.findByRole("button", { name: "Smazat účet" }))
    await interaction.type(screen.getByLabelText("Heslo"), "password")
    await interaction.click(screen.getByRole("button", { name: "Trvale smazat účet" }))
    expect(await screen.findByText(/Zkontrolujte připojení a zkuste to znovu/)).toBeInTheDocument()
    expect(queryClient.getQueryData(authKeys.session())).toMatchObject({ user: owner })
    expect(auth.signOut).not.toHaveBeenCalled()
  })

  it("keeps the dialog open and disables duplicate submissions while deleting", async () => {
    let finish!: (value: { error: { code: string; status: number } }) => void
    auth.deleteUser.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    const { interaction } = await openPage()
    await interaction.click(await screen.findByRole("button", { name: "Smazat účet" }))
    await interaction.type(screen.getByLabelText("Heslo"), "password")
    await interaction.click(screen.getByRole("button", { name: "Trvale smazat účet" }))
    expect(await screen.findByRole("button", { name: "Mažu účet…" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Zrušit" })).toBeDisabled()
    expect(screen.getByLabelText("Heslo")).toBeDisabled()
    await interaction.keyboard("{Escape}")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(auth.deleteUser).toHaveBeenCalledTimes(1)
    act(() => {
      finish({ error: { code: "INVALID_PASSWORD", status: 400 } })
    })
    expect(await screen.findByText("Zadejte správné heslo ke svému účtu.")).toBeInTheDocument()
  })

  it("preserves password spaces, clears private caches and blocks back navigation after success", async () => {
    auth.deleteUser.mockImplementation(() => {
      auth.getSession.mockResolvedValue({ data: null, error: null })
      return Promise.resolve({ data: { success: true }, error: null })
    })
    const { interaction, queryClient, router } = await openPage()
    queryClient.setQueryData(["private-dogs"], ["my dog"])
    let finishQuery!: (data: string[]) => void
    const lateQuery = queryClient
      .fetchQuery({
        queryKey: ["private-late"],
        queryFn: () =>
          new Promise<string[]>((resolve) => {
            finishQuery = resolve
          }),
      })
      .catch(() => undefined)
    await interaction.click(await screen.findByRole("button", { name: "Smazat účet" }))
    await interaction.type(screen.getByLabelText("Heslo"), " space password ")
    await interaction.click(screen.getByRole("button", { name: "Trvale smazat účet" }))
    await waitFor(() => expect(router.state.location.pathname).toBe("/"))
    expect(auth.deleteUser).toHaveBeenCalledWith({ password: " space password " })
    expect(queryClient.getQueryData(authKeys.session())).toBeNull()
    expect(queryClient.getQueryData(["private-dogs"])).toBeUndefined()
    await act(async () => {
      finishQuery(["old private data"])
      await lateQuery
    })
    expect(queryClient.getQueryData(["private-late"])).toBeUndefined()
    act(() => {
      router.history.back()
    })
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"))
    expect(screen.queryByText("jana@example.com")).not.toBeInTheDocument()
  })
})

it("opens the public draft policy without requiring a session", async () => {
  await openPage("/privacy", null)
  expect(
    await screen.findByRole("heading", { level: 1, name: "Zásady zpracování osobních údajů" }),
  ).toBeInTheDocument()
  expect(screen.getByText(/Pracovní návrh/)).toBeInTheDocument()
  expect(screen.getByText(/smazaný uživatel/)).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "TrainLoop" })).toBeInTheDocument()
})
