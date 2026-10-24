import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router"
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { authKeys } from "@/lib/auth-keys"
import { routeTree } from "@/routeTree.gen"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { dogKeys } from "@/features/dog/api/dogKeys"

const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
  getSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))
const dogApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn().mockReturnValue({ json: () => Promise.resolve({ success: true }) }),
}))
vi.mock("@/lib/api-client", () => ({ api: { get: dogApi.get, post: dogApi.post } }))
vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: {
    signUp: { email: auth.signUp },
    getSession: auth.getSession,
    signIn: { email: auth.signIn },
    signOut: auth.signOut,
  },
}))

const user = { id: "owner-1", name: "Jana Nováková", email: "jana@example.com", role: "user" }
const clients: QueryClient[] = []

async function openPage(path = "/login") {
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

async function fillForm(interaction: ReturnType<typeof userEvent.setup>, password = "password123") {
  await interaction.type(screen.getByLabelText("E-mail"), "jana@example.com")
  await interaction.type(screen.getByLabelText("Heslo"), password)
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
  auth.signUp.mockResolvedValue({ data: { user }, error: null })
  dogApi.get.mockReturnValue({ json: () => Promise.resolve([]) })
})

afterEach(() => {
  cleanup()
  clients.splice(0).forEach((client) => client.clear())
  vi.unstubAllGlobals()
})

function acceptLogin(role = "user") {
  auth.signIn.mockImplementation(() => {
    auth.getSession.mockResolvedValue({ data: { user: { ...user, role } }, error: null })
    return Promise.resolve({ data: { user: { ...user, role } }, error: null })
  })
}

describe("login and logout", () => {
  const oldDog = {
    id: "dog-a",
    name: "Private dog A",
    ownerId: user.id,
    color: 1,
    createdAt: "2026-10-21T10:00:00Z",
    updatedAt: "2026-10-21T10:00:00Z",
  }
  const otherUser = { ...user, id: "owner-2", name: "Other owner", email: "other@example.com" }
  const newDog = { ...oldDog, id: "dog-b", ownerId: otherUser.id, name: "Private dog B" }

  it("clears expired private data and late requests before another owner signs in", async () => {
    auth.getSession.mockResolvedValue({ data: { user }, error: null })
    dogApi.get.mockReturnValue({ json: () => Promise.resolve([oldDog]) })
    const { interaction, router, queryClient } = await openPage("/dogs")
    await screen.findByText(oldDog.name)
    queryClient.setQueryData(["week", "2026-10-19"], [{ ownerId: user.id }])
    let finish: (value: unknown) => void = () => undefined
    const pendingKey = ["dogs", "detail", "pending"]
    const pending = queryClient
      .fetchQuery({
        queryKey: pendingKey,
        queryFn: () =>
          new Promise((resolve) => {
            finish = resolve
          }),
      })
      .catch(() => undefined)
    auth.getSession.mockResolvedValue({ data: null, error: null })
    await act(async () => {
      await router.navigate({ to: "/account" })
    })
    await screen.findByRole("dialog", { name: "Přihlášení" })
    expect(queryClient.getQueryData(dogKeys.lists())).toBeUndefined()
    expect(queryClient.getQueryData(["week", "2026-10-19"])).toBeUndefined()
    await act(async () => {
      finish(oldDog)
      await pending
    })
    expect(queryClient.getQueryData(pendingKey)).toBeUndefined()
    auth.signIn.mockImplementation(() => {
      auth.getSession.mockResolvedValue({ data: { user: otherUser }, error: null })
      return Promise.resolve({ data: { user: otherUser }, error: null })
    })
    dogApi.get.mockReturnValue({ json: () => Promise.resolve([newDog]) })
    await fillForm(interaction)
    await interaction.click(screen.getByRole("button", { name: "Přihlásit se" }))
    await screen.findByText(otherUser.email)
    await act(async () => {
      await router.navigate({ to: "/dogs" })
    })
    expect(await screen.findByText(newDog.name)).toBeInTheDocument()
    expect(screen.queryByText(oldDog.name)).not.toBeInTheDocument()
    expect(queryClient.getQueryData(dogKeys.lists())).toEqual([
      expect.objectContaining({ id: newDog.id }),
    ])
  })

  it("remounts private views when a session refresh changes the account", async () => {
    auth.getSession.mockResolvedValue({ data: { user }, error: null })
    dogApi.get.mockReturnValue({ json: () => Promise.resolve([oldDog]) })
    const { queryClient } = await openPage("/dogs")
    await screen.findByText(oldDog.name)
    auth.getSession.mockResolvedValue({ data: { user: otherUser }, error: null })
    dogApi.get.mockReturnValue({ json: () => Promise.resolve([newDog]) })
    await act(async () => {
      await queryClient.fetchQuery({ ...authSessionQueryOptions(), staleTime: 0 })
    })
    expect(await screen.findByText(newDog.name)).toBeInTheDocument()
    expect(screen.queryByText(oldDog.name)).not.toBeInTheDocument()
  })

  it("cancels pre-login session requests so a late response cannot restore another account", async () => {
    const { interaction, queryClient } = await openPage()
    await screen.findByRole("dialog")
    let finish: (value: unknown) => void = () => undefined
    auth.getSession.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    const pending = queryClient
      .fetchQuery({ ...authSessionQueryOptions(), staleTime: 0 })
      .catch(() => undefined)
    acceptLogin()
    await fillForm(interaction)
    await interaction.click(screen.getByRole("button", { name: "Přihlásit se" }))
    await screen.findByRole("heading", { name: "Týden" })
    await act(async () => {
      finish({ data: { user: otherUser }, error: null })
      await pending
    })
    expect(queryClient.getQueryData(authKeys.session())).toMatchObject({ user: { id: user.id } })
  })

  it("returns to login when a background refresh discovers session expiry", async () => {
    auth.getSession.mockResolvedValue({ data: { user }, error: null })
    dogApi.get.mockReturnValue({ json: () => Promise.resolve([oldDog]) })
    const { queryClient } = await openPage("/dogs")
    await screen.findByText(oldDog.name)
    auth.getSession.mockResolvedValue({ data: null, error: null })
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() })
    })
    expect(await screen.findByRole("dialog", { name: "Přihlášení" })).toBeInTheDocument()
    expect(screen.queryByText(oldDog.name)).not.toBeInTheDocument()
    expect(queryClient.getQueryData(dogKeys.lists())).toBeUndefined()
  })

  it("rechecks trainer-only routes when the refreshed session belongs to an owner", async () => {
    auth.getSession.mockResolvedValue({ data: { user: { ...user, role: "trainer" } }, error: null })
    const { router, queryClient } = await openPage("/clients")
    await screen.findByText("Pozvěte prvního klienta")
    auth.getSession.mockResolvedValue({ data: { user: otherUser }, error: null })
    await act(async () => {
      await queryClient.fetchQuery({ ...authSessionQueryOptions(), staleTime: 0 })
    })
    expect(await screen.findByRole("heading", { name: "Psi" })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/dogs")
    expect(screen.queryByRole("link", { name: "Klienti" })).not.toBeInTheDocument()
  })
  it("opens an accessible modal from the landing page and closes it with Escape", async () => {
    const { interaction, router } = await openPage("/")
    const links = await screen.findAllByRole("link", { name: "Přihlásit se" })
    await interaction.click(links[links.length - 1]!)
    const dialog = await screen.findByRole("dialog", { name: "Přihlášení" })
    expect(within(dialog).getByLabelText("E-mail")).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Heslo")).toBeInTheDocument()
    await interaction.keyboard("{Escape}")
    await waitFor(() => expect(router.state.location.pathname).toBe("/"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("validates the email and required password beside the fields", async () => {
    const { interaction } = await openPage()
    await screen.findByRole("dialog")
    await interaction.click(screen.getByRole("button", { name: "Přihlásit se" }))
    expect(await screen.findByText("Vyplňte e-mail.")).toBeInTheDocument()
    expect(screen.getByText("Vyplňte heslo.")).toBeInTheDocument()
    await interaction.type(screen.getByLabelText("E-mail"), "invalid")
    await interaction.click(screen.getByRole("button", { name: "Přihlásit se" }))
    expect(await screen.findByText("Zadejte platný e-mail.")).toBeInTheDocument()
    expect(auth.signIn).not.toHaveBeenCalled()
  })

  it.each(["INVALID_EMAIL_OR_PASSWORD", "USER_NOT_FOUND", "INVALID_PASSWORD"])(
    "shows the same non-identifying error for %s",
    async (code) => {
      auth.signIn.mockResolvedValue({
        data: null,
        error: { code, message: "This specific email does not exist" },
      })
      const { interaction } = await openPage()
      await screen.findByRole("dialog")
      await fillForm(interaction)
      await interaction.click(screen.getByRole("button", { name: "Přihlásit se" }))
      expect(await screen.findByRole("alert")).toHaveTextContent("Nesprávný e-mail nebo heslo.")
      expect(screen.getAllByRole("alert")).toHaveLength(1)
      expect(screen.queryByText(/specific email/)).not.toBeInTheDocument()
    },
  )

  it.each([
    ["user", "Týden", "/week"],
    ["trainer", "Vaši klienti", "/clients"],
  ])(
    "logs in a %s with a persistent session and the correct destination",
    async (role, heading, path) => {
      const { interaction, router, queryClient } = await openPage()
      acceptLogin(role)
      await screen.findByRole("dialog")
      await fillForm(interaction, " space password ")
      await interaction.click(screen.getByRole("button", { name: "Přihlásit se" }))
      expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument()
      expect(router.state.location.pathname).toBe(path)
      expect(queryClient.getQueryData(authKeys.session())).toMatchObject({ user: { role } })
      expect(auth.signIn).toHaveBeenCalledExactlyOnceWith({
        email: "jana@example.com",
        password: " space password ",
        rememberMe: true,
      })
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    },
  )

  it.each(["/dogs?view=all#notes", "/clients", "/week", "/account"])(
    "returns to the original protected destination %s after login",
    async (destination) => {
      const { interaction, router } = await openPage(destination)
      await screen.findByRole("dialog")
      expect(router.state.location.pathname).toBe("/login")
      acceptLogin(destination === "/clients" ? "trainer" : "user")
      await fillForm(interaction)
      await interaction.click(screen.getByRole("button", { name: "Přihlásit se" }))
      await waitFor(() => expect(router.state.location.href).toBe(destination))
    },
  )

  it("uses a remembered session after loading the app with an empty query cache", async () => {
    auth.getSession.mockResolvedValue({ data: { user }, error: null })
    await openPage("/week")
    expect(await screen.findByRole("heading", { name: "Týden" })).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(auth.signIn).not.toHaveBeenCalled()
  })

  it("rechecks an expired session before entering another protected page", async () => {
    auth.getSession.mockResolvedValue({ data: { user }, error: null })
    const { interaction, router } = await openPage("/dogs")
    await screen.findByRole("heading", { name: "Psi" })
    auth.getSession.mockResolvedValue({ data: null, error: null })
    await interaction.click(
      within(screen.getByRole("navigation", { name: "Spodní navigace" })).getByRole("link", {
        name: "Účet",
      }),
    )
    expect(await screen.findByRole("dialog", { name: "Přihlášení" })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/login")
    expect(screen.queryByText(user.email)).not.toBeInTheDocument()
  })

  it("redirects an already signed-in trainer from login to Clients", async () => {
    auth.getSession.mockResolvedValue({ data: { user: { ...user, role: "trainer" } }, error: null })
    const { router } = await openPage()
    expect(await screen.findByRole("heading", { name: "Vaši klienti" })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/clients")
  })

  it("ignores an external return URL and uses the role-specific destination", async () => {
    const { interaction, router } = await openPage(
      "/login?from=https%3A%2F%2Fexample.com%2Fclients",
    )
    acceptLogin()
    await screen.findByRole("dialog")
    await fillForm(interaction)
    await interaction.click(screen.getByRole("button", { name: "Přihlásit se" }))
    expect(await screen.findByRole("heading", { name: "Týden" })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/week")
  })

  it("keeps the form usable after a network failure", async () => {
    auth.signIn.mockRejectedValue(new Error("Internal network error"))
    const { interaction } = await openPage()
    await screen.findByRole("dialog")
    await fillForm(interaction)
    await interaction.click(screen.getByRole("button", { name: "Přihlásit se" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Přihlášení se nezdařilo. Zkuste to prosím znovu.",
    )
    expect(screen.getByLabelText("E-mail")).toHaveValue("jana@example.com")
    expect(screen.getByRole("button", { name: "Přihlásit se" })).toBeEnabled()
    acceptLogin()
    await interaction.click(screen.getByRole("button", { name: "Přihlásit se" }))
    expect(await screen.findByRole("heading", { name: "Týden" })).toBeInTheDocument()
  })

  it("prevents duplicate submissions and closing while login is pending", async () => {
    let finish: (value: unknown) => void = () => undefined
    auth.signIn.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    const { interaction } = await openPage()
    await screen.findByRole("dialog")
    await fillForm(interaction)
    await interaction.click(screen.getByRole("button", { name: "Přihlásit se" }))
    expect(await screen.findByRole("button", { name: "Přihlašuji…" })).toBeDisabled()
    expect(screen.getByLabelText("Heslo")).toBeDisabled()
    expect(screen.getByRole("button", { name: "Zavřít přihlášení" })).toBeDisabled()
    await interaction.keyboard("{Escape}")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    act(() => {
      finish({ data: null, error: { code: "INVALID_EMAIL_OR_PASSWORD" } })
    })
    await screen.findByRole("alert")
  })

  it("logs out from Account, clears private data, and guards browser-back navigation", async () => {
    auth.getSession.mockResolvedValue({ data: { user }, error: null })
    const { interaction, router, queryClient } = await openPage("/dogs")
    await screen.findByRole("heading", { name: "Psi" })
    await interaction.click(
      within(screen.getByRole("navigation", { name: "Spodní navigace" })).getByRole("link", {
        name: "Účet",
      }),
    )
    await screen.findByRole("heading", { name: "Účet" })
    queryClient.setQueryData(["private-dogs"], [{ name: "Private dog" }])
    auth.signOut.mockImplementation(() => {
      auth.getSession.mockResolvedValue({ data: null, error: null })
      return Promise.resolve({ data: { success: true }, error: null })
    })
    await interaction.click(screen.getByRole("button", { name: "Odhlásit se" }))
    await waitFor(() => expect(router.state.location.pathname).toBe("/"))
    expect(auth.signOut).toHaveBeenCalledTimes(1)
    expect(queryClient.getQueryData(["private-dogs"])).toBeUndefined()
    expect(queryClient.getQueryData(authKeys.session())).toBeNull()
    expect(screen.queryByRole("navigation", { name: "Spodní navigace" })).not.toBeInTheDocument()
    act(() => {
      router.history.back()
    })
    expect(await screen.findByRole("dialog", { name: "Přihlášení" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Psi" })).not.toBeInTheDocument()
  })

  it("does not pretend to sign out when the API fails, and permits retry", async () => {
    auth.getSession.mockResolvedValue({ data: { user }, error: null })
    auth.signOut.mockResolvedValue({ data: null, error: { message: "Server unavailable" } })
    const { interaction, router } = await openPage("/account")
    await interaction.click(await screen.findByRole("button", { name: "Odhlásit se" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Odhlášení se nezdařilo. Zkuste to prosím znovu.",
    )
    expect(router.state.location.pathname).toBe("/account")
    expect(screen.getByRole("button", { name: "Odhlásit se" })).toBeEnabled()
  })

  it("redirects to invite page when invitation code is provided on sign in", async () => {
    const { interaction, router } = await openPage("/login?code=EXIST1")
    acceptLogin()
    await screen.findByRole("dialog")
    await fillForm(interaction)
    await interaction.click(screen.getByRole("button", { name: "Přihlásit se" }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/invite")
    })
    expect(router.state.location.search).toMatchObject({ code: "EXIST1" })
  })
})
