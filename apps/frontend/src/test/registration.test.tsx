import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router"
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { authKeys } from "@/lib/auth-keys"
import { routeTree } from "@/routeTree.gen"

const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
  getSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))
const dogApi = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock("@/lib/api-client", () => ({ api: { get: dogApi.get } }))
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

async function openPage(path = "/signup") {
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
  await interaction.type(screen.getByLabelText("Jméno"), "  Jana Nováková  ")
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

describe("owner registration", () => {
  it("opens registration from the landing page and validates each required field", async () => {
    const { interaction } = await openPage("/")
    await interaction.click(await screen.findByRole("link", { name: "Zaregistrovat se" }))
    expect(await screen.findByRole("heading", { name: "Registrace" })).toBeInTheDocument()
    expect(
      screen.queryByLabelText(/username|confirm password|pozvánka|karta/i),
    ).not.toBeInTheDocument()
    await interaction.click(screen.getByRole("button", { name: "Zaregistrovat se" }))
    expect(await screen.findByText("Vyplňte jméno.")).toBeInTheDocument()
    expect(screen.getByText("Vyplňte e-mail.")).toBeInTheDocument()
    expect(screen.getByText("Heslo musí mít alespoň 8 znaků.")).toBeInTheDocument()
    expect(
      screen.getByText("Pro registraci je nutný souhlas se zpracováním osobních údajů."),
    ).toBeInTheDocument()
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it("rejects whitespace names, invalid emails and short passwords beside their fields", async () => {
    const { interaction } = await openPage()
    await interaction.type(await screen.findByLabelText("Jméno"), "   ")
    await interaction.type(screen.getByLabelText("E-mail"), "invalid")
    await interaction.type(screen.getByLabelText("Heslo"), "1234567")
    await interaction.click(
      screen.getByRole("checkbox", { name: "Souhlasím se zpracováním osobních údajů." }),
    )
    await interaction.click(screen.getByRole("button", { name: "Zaregistrovat se" }))
    expect(await screen.findByText("Zadejte platný e-mail.")).toBeInTheDocument()
    expect(screen.getByLabelText("Jméno")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByLabelText("Heslo")).toHaveAttribute("aria-invalid", "true")
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it("requires explicit consent even when all three text fields are valid", async () => {
    const { interaction } = await openPage()
    await screen.findByLabelText("Jméno")
    await fillForm(interaction)
    expect(
      screen.getByRole("checkbox", { name: "Souhlasím se zpracováním osobních údajů." }),
    ).not.toBeChecked()
    await interaction.click(screen.getByRole("button", { name: "Zaregistrovat se" }))
    expect(
      await screen.findByText("Pro registraci je nutný souhlas se zpracováním osobních údajů."),
    ).toBeInTheDocument()
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it("registers without a username or invitation, refreshes an anonymous session and opens Psi", async () => {
    const { interaction, queryClient, router } = await openPage()
    queryClient.setQueryData(authKeys.session(), null)
    auth.signUp.mockImplementation(() => {
      auth.getSession.mockResolvedValue({ data: { user }, error: null })
      return Promise.resolve({ data: { user }, error: null })
    })
    await screen.findByLabelText("Jméno")
    await fillForm(interaction, " space password ")
    await interaction.click(
      screen.getByRole("checkbox", { name: "Souhlasím se zpracováním osobních údajů." }),
    )
    await interaction.click(screen.getByRole("button", { name: "Zaregistrovat se" }))
    expect(await screen.findByRole("heading", { name: "Psi" })).toBeInTheDocument()
    expect(await screen.findByText("Přidejte prvního psa")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/dogs")
    expect(queryClient.getQueryData(authKeys.session())).toMatchObject({ user })
    expect(
      within(screen.getByRole("navigation", { name: "Spodní navigace" })).queryByRole("link", {
        name: "Klienti",
      }),
    ).not.toBeInTheDocument()
    expect(auth.signUp).toHaveBeenCalledExactlyOnceWith({
      name: "Jana Nováková",
      email: "jana@example.com",
      password: " space password ",
      fetchOptions: { body: { privacyConsent: true, isTrainer: false } },
    })
  })

  it("shows duplicate email beside the field and offers a working login link", async () => {
    auth.signUp.mockResolvedValue({
      data: null,
      error: { code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" },
    })
    const { interaction, router } = await openPage()
    await screen.findByLabelText("Jméno")
    await fillForm(interaction)
    await interaction.click(
      screen.getByRole("checkbox", { name: "Souhlasím se zpracováním osobních údajů." }),
    )
    await interaction.click(screen.getByRole("button", { name: "Zaregistrovat se" }))
    expect(await screen.findByText("Účet s tímto e-mailem už existuje.")).toBeInTheDocument()
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true")
    const loginLink = screen.getAllByRole("link", { name: "Přihlásit se" })[0]
    if (!loginLink) throw new Error("Missing duplicate-email login link")
    await interaction.click(loginLink)
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"))
  })

  it("keeps entered values and allows retry after a network error", async () => {
    auth.signUp.mockRejectedValue(new Error("Network unavailable"))
    const { interaction } = await openPage()
    await screen.findByLabelText("Jméno")
    await fillForm(interaction)
    await interaction.click(
      screen.getByRole("checkbox", { name: "Souhlasím se zpracováním osobních údajů." }),
    )
    await interaction.click(screen.getByRole("button", { name: "Zaregistrovat se" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Registrace se nezdařila. Zkuste to prosím znovu.",
    )
    expect(screen.getByLabelText("E-mail")).toHaveValue("jana@example.com")
    expect(screen.getByRole("button", { name: "Zaregistrovat se" })).toBeEnabled()
    await interaction.click(screen.getByRole("button", { name: "Zaregistrovat se" }))
    await waitFor(() => expect(auth.signUp).toHaveBeenCalledTimes(2))
  })

  it("disables submission while signup is pending", async () => {
    let finish: (value: unknown) => void = () => undefined
    auth.signUp.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    const { interaction } = await openPage()
    await screen.findByLabelText("Jméno")
    await fillForm(interaction)
    await interaction.click(
      screen.getByRole("checkbox", { name: "Souhlasím se zpracováním osobních údajů." }),
    )
    await interaction.click(screen.getByRole("button", { name: "Zaregistrovat se" }))
    expect(await screen.findByRole("button", { name: "Registruji…" })).toBeDisabled()
    expect(screen.getByLabelText("E-mail")).toBeDisabled()
    act(() => {
      finish({ data: null, error: { code: "FAILED_TO_CREATE_USER" } })
    })
    await screen.findByRole("alert")
  })

  it("protects the dogs page from anonymous visitors", async () => {
    const { router } = await openPage("/dogs")
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"))
    expect(screen.queryByText("Přidejte prvního psa")).not.toBeInTheDocument()
  })

  it("keeps the trainer invitation code when opening registration from the landing page", async () => {
    const { interaction, router } = await openPage("/")
    await interaction.click(await screen.findByRole("button", { name: "Mám kód od trenéra" }))
    await interaction.type(screen.getByLabelText("Kód pozvánky"), "ABC123")
    await interaction.click(screen.getByRole("button", { name: "Pokračovat k registraci" }))
    await screen.findByRole("heading", { name: "Registrace" })
    expect(router.state.location.search).toMatchObject({ code: "ABC123" })
  })

  it("renders the existing dog list, detail and new-goal routes after integration", async () => {
    const dog = {
      id: "dog-1",
      name: "Rex",
      ownerId: user.id,
      color: 1,
      createdAt: "2026-10-21T10:00:00Z",
      updatedAt: "2026-10-21T10:00:00Z",
    }
    auth.getSession.mockResolvedValue({ data: { user }, error: null })
    dogApi.get.mockImplementation((path: string) => ({
      json: () => Promise.resolve(path === "dogs" ? [dog] : path === "dogs/dog-1" ? dog : []),
    }))
    const { router } = await openPage("/dogs")
    expect(await screen.findByText("Rex")).toBeInTheDocument()
    expect(screen.queryByText("Přidejte prvního psa")).not.toBeInTheDocument()
    await act(async () => {
      await router.navigate({ to: "/dogs/$dogId", params: { dogId: dog.id } })
    })
    expect(await screen.findByRole("heading", { name: "Rex", level: 1 })).toBeInTheDocument()
    await act(async () => {
      await router.navigate({ to: "/dogs/$dogId/goals/new", params: { dogId: dog.id } })
    })
    expect(await screen.findByLabelText("Název cíle")).toBeInTheDocument()
  })
})

describe("trainer registration", () => {
  const trainer = { ...user, role: "trainer" }

  it("defaults to an owner account and lets a trainer register into Clients", async () => {
    const { interaction, router, queryClient } = await openPage()
    const trainerCheckbox = await screen.findByRole("checkbox", { name: "Jsem trenér" })
    expect(trainerCheckbox).not.toBeChecked()
    await interaction.click(trainerCheckbox)
    await fillForm(interaction)
    await interaction.click(
      screen.getByRole("checkbox", { name: "Souhlasím se zpracováním osobních údajů." }),
    )
    auth.signUp.mockImplementation(() => {
      auth.getSession.mockResolvedValue({ data: { user: trainer }, error: null })
      return Promise.resolve({ data: { user: trainer }, error: null })
    })
    await interaction.click(screen.getByRole("button", { name: "Zaregistrovat se" }))
    expect(await screen.findByRole("heading", { name: "Vaši klienti" })).toBeInTheDocument()
    expect(screen.getByText("Pozvěte prvního klienta")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/clients")
    expect(queryClient.getQueryData(authKeys.session())).toMatchObject({ user: trainer })
    expect(auth.signUp).toHaveBeenCalledExactlyOnceWith({
      name: "Jana Nováková",
      email: "jana@example.com",
      password: "password123",
      fetchOptions: { body: { privacyConsent: true, isTrainer: true } },
    })
    const nav = screen.getByRole("navigation", { name: "Spodní navigace" })
    expect(within(nav).getByRole("link", { name: "Klienti" })).toHaveAttribute(
      "aria-current",
      "page",
    )
    await interaction.click(within(nav).getByRole("link", { name: "Psi" }))
    await screen.findByRole("heading", { name: "Psi" })
    await interaction.click(within(nav).getByRole("link", { name: "Klienti" }))
    expect(await screen.findByText("Pozvěte prvního klienta")).toBeInTheDocument()
  })

  it("requires the same valid fields and explicit consent for trainers", async () => {
    const { interaction } = await openPage()
    await interaction.click(await screen.findByRole("checkbox", { name: "Jsem trenér" }))
    await interaction.type(screen.getByLabelText("Jméno"), "   ")
    await interaction.type(screen.getByLabelText("E-mail"), "invalid")
    await interaction.type(screen.getByLabelText("Heslo"), "1234567")
    await interaction.click(screen.getByRole("button", { name: "Zaregistrovat se" }))
    expect(await screen.findByText("Vyplňte jméno.")).toBeInTheDocument()
    expect(screen.getByText("Zadejte platný e-mail.")).toBeInTheDocument()
    expect(screen.getByText("Heslo musí mít alespoň 8 znaků.")).toBeInTheDocument()
    expect(
      screen.getByText("Pro registraci je nutný souhlas se zpracováním osobních údajů."),
    ).toBeInTheDocument()
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it("preserves the trainer choice and offers login for an existing email", async () => {
    auth.signUp.mockResolvedValue({
      data: null,
      error: { code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" },
    })
    const { interaction } = await openPage()
    await interaction.click(await screen.findByRole("checkbox", { name: "Jsem trenér" }))
    await fillForm(interaction)
    await interaction.click(
      screen.getByRole("checkbox", { name: "Souhlasím se zpracováním osobních údajů." }),
    )
    await interaction.click(screen.getByRole("button", { name: "Zaregistrovat se" }))
    expect(await screen.findByText("Účet s tímto e-mailem už existuje.")).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: "Jsem trenér" })).toBeChecked()
    expect(screen.getAllByRole("link", { name: "Přihlásit se" })[0]).toHaveAttribute(
      "href",
      "/login",
    )
  })

  it("uses the stored session role when returning to registration", async () => {
    auth.getSession.mockResolvedValue({ data: { user: trainer }, error: null })
    const { router } = await openPage()
    expect(await screen.findByText("Pozvěte prvního klienta")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/clients")
  })

  it("does not let owners open Clients by URL", async () => {
    auth.getSession.mockResolvedValue({ data: { user }, error: null })
    const { router } = await openPage("/clients")
    expect(await screen.findByRole("heading", { name: "Psi" })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/dogs")
    expect(screen.queryByRole("link", { name: "Klienti" })).not.toBeInTheDocument()
    expect(screen.queryByText("Pozvěte prvního klienta")).not.toBeInTheDocument()
  })

  it("does not let anonymous visitors open Clients", async () => {
    const { router } = await openPage("/clients")
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"))
    expect(screen.queryByRole("navigation", { name: "Spodní navigace" })).not.toBeInTheDocument()
    expect(screen.queryByText("Pozvěte prvního klienta")).not.toBeInTheDocument()
  })
})
