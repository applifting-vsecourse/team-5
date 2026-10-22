import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Dog } from "@/features/dog/api/dogSchemas"

import { EditDogDialog } from "./EditDogDialog"

const aDog: Dog = {
  id: "dog-1",
  name: "Baryk",
  breed: "Border kolie",
  color: 2,
  photoUrl: "https://example.com/baryk.jpg",
  ownerId: "u1",
  disciplines: ["Canicross", "Agility"],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe("EditDogDialog", () => {
  const createObjectURLMock = vi.fn(() => "blob:test-photo-url")
  const revokeObjectURLMock = vi.fn()

  beforeEach(() => {
    createObjectURLMock.mockClear()
    revokeObjectURLMock.mockClear()
    window.URL.createObjectURL = createObjectURLMock
    window.URL.revokeObjectURL = revokeObjectURLMock
  })

  it("pre-fills dog profile values and shows photo remove button", () => {
    render(
      <EditDogDialog
        dog={aDog}
        isOpen={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByRole("heading", { name: "Upravit psa" })).toBeInTheDocument()
    expect(screen.getByLabelText(/jméno psa \*/i)).toHaveValue("Baryk")
    expect(screen.getByLabelText(/plemeno/i)).toHaveValue("Border kolie")

    // Color 2 is checked
    const color2Radio = screen.getByRole("radio", { name: "Barva 2" })
    expect(color2Radio).toHaveAttribute("aria-checked", "true")

    // Default discipline Canicross is checked
    const canicrossBtn = screen.getByRole("checkbox", { name: /canicross/i })
    expect(canicrossBtn).toHaveAttribute("aria-checked", "true")

    // Custom discipline Agility is rendered as badge with remove button
    expect(screen.getByText("Agility")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /odebrat disciplínu agility/i })).toBeInTheDocument()

    // Photo remove button is available
    expect(screen.getByRole("button", { name: /odstranit fotku/i })).toBeInTheDocument()
  })

  it("allows removing existing photo", async () => {
    const user = userEvent.setup()
    render(
      <EditDogDialog
        dog={aDog}
        isOpen={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )

    const removePhotoBtn = screen.getByRole("button", { name: /odstranit fotku/i })
    await user.click(removePhotoBtn)

    expect(screen.queryByRole("button", { name: /odstranit fotku/i })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /nahrát fotku/i })).toBeInTheDocument()
  })

  it("validates required name field on submission", async () => {
    const user = userEvent.setup()
    render(
      <EditDogDialog
        dog={aDog}
        isOpen={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )

    const nameInput = screen.getByLabelText(/jméno psa \*/i)
    await user.clear(nameInput)

    const submitBtn = screen.getByRole("button", { name: /uložit změny/i })
    await user.click(submitBtn)

    expect(screen.getByText("Jméno psa je povinné")).toBeInTheDocument()
  })

  it("calls onOpenChange(false) when cancel button is clicked", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <EditDogDialog
        dog={aDog}
        isOpen={true}
        onOpenChange={onOpenChange}
      />,
      { wrapper: createWrapper() },
    )

    const cancelBtn = screen.getByRole("button", { name: /zrušit/i })
    await user.click(cancelBtn)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
