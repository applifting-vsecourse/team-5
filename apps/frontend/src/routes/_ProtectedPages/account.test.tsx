import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AccountPage } from "./account"

const mockMutate = vi.fn()
const mockSetTheme = vi.fn()
let mockUser: { name: string; email: string; role?: string } | null = {
  name: "Jan Novák",
  email: "jan.novak@example.com",
}
let mockTheme = "system"
let mockResolvedTheme = "dark"

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
}))

vi.mock("@/components/Seo", () => ({
  Seo: () => null,
}))

vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: mockUser }),
}))

vi.mock("@/features/auth/hooks/useSignOut", () => ({
  useSignOut: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}))

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
    resolvedTheme: mockResolvedTheme,
  }),
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = {
      name: "Jan Novák",
      email: "jan.novak@example.com",
    }
    mockTheme = "system"
    mockResolvedTheme = "dark"
  })

  it("renders page title and user details without card containers", () => {
    render(<AccountPage />)

    expect(screen.getByRole("heading", { name: "Účet", level: 1 })).toBeInTheDocument()
    expect(screen.getByText("Jan Novák")).toBeInTheDocument()
    expect(screen.getByText("jan.novak@example.com")).toBeInTheDocument()
  })

  it("displays current system theme and changes theme via dropdown", async () => {
    const user = userEvent.setup()
    render(<AccountPage />)

    const themeButton = screen.getByRole("button", { name: /vzhled: systémový/i })
    expect(themeButton).toBeInTheDocument()

    await user.click(themeButton)

    const lightOption = screen.getByRole("menuitem", { name: /světlý/i })
    await user.click(lightOption)

    expect(mockSetTheme).toHaveBeenCalledWith("light")
  })

  it("calls signOut on clicking logout button", async () => {
    const user = userEvent.setup()
    render(<AccountPage />)

    const logoutButton = screen.getByRole("button", { name: /odhlásit se/i })
    await user.click(logoutButton)

    expect(mockMutate).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        onError: expect.any(Function),
      }),
    )
  })

  it("triggers error toast if signOut fails", async () => {
    const { toast } = await import("sonner")
    const user = userEvent.setup()
    render(<AccountPage />)

    const logoutButton = screen.getByRole("button", { name: /odhlásit se/i })
    await user.click(logoutButton)

    const callArgs = mockMutate.mock.calls[0] as [
      unknown,
      { onError?: (err: unknown) => void } | undefined,
    ]
    const onError = callArgs[1]?.onError
    expect(onError).toBeDefined()

    onError?.(new Error("Network failed"))
    expect(toast.error).toHaveBeenCalledWith(
      "Odhlášení se nezdařilo. Zkontrolujte připojení k síti.",
    )
  })

  it("does not render user section if user is null", () => {
    mockUser = null
    render(<AccountPage />)

    expect(screen.queryByText("Jan Novák")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /odhlásit se/i })).not.toBeInTheDocument()
  })
})
