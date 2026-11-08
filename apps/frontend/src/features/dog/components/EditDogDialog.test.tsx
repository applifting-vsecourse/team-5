import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { dogKeys } from "@/lib/dogKeys"

import type { Dog } from "@/features/dog/api/dogSchemas"
import { setDogDiscipline } from "@/features/dog/api/setDogDiscipline"
import { updateDog } from "@/features/dog/api/updateDog"

import { EditDogDialog } from "./EditDogDialog"

vi.mock("@/features/dog/api/updateDog", () => ({ updateDog: vi.fn() }))
vi.mock("@/features/dog/api/setDogDiscipline", () => ({ setDogDiscipline: vi.fn() }))

const aDog: Dog = {
  id: "dog-1",
  name: "Baryk",
  breed: "Border kolie",
  birthDate: "2020-01-01",
  weightKg: 21.5,
  color: 2,
  photoUrl: "https://example.com/baryk.jpg",
  ownerId: "u1",
  isArchived: false,
  disciplines: ["Canicross", "Agility"],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const createWrapper = (initialPlan?: unknown[]) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  if (initialPlan) {
    queryClient.setQueryData([...dogKeys.detail("dog-1"), "plan"], initialPlan)
  }
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
    expect(screen.getByLabelText(/datum narození/i)).toHaveValue("2020-01-01")
    expect(screen.getByLabelText(/váha/i)).toHaveValue(21.5)

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

  it("sends edited birth date and weight to the API", async () => {
    const user = userEvent.setup()
    vi.mocked(updateDog).mockResolvedValue({ ...aDog, weightKg: 22.4 })
    render(
      <EditDogDialog
        dog={aDog}
        isOpen
        onOpenChange={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    await user.clear(screen.getByLabelText(/váha/i))
    await user.type(screen.getByLabelText(/váha/i), "22.4")
    await user.click(screen.getByRole("button", { name: /uložit změny/i }))
    expect(updateDog).toHaveBeenCalledWith(
      aDog.id,
      expect.objectContaining({ birthDate: "2020-01-01", weightKg: 22.4 }),
    )
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

  it("prompts confirmation when removing an active discipline and archives it via setDogDiscipline", async () => {
    const user = userEvent.setup()
    vi.mocked(setDogDiscipline).mockResolvedValue({
      id: "dd-1",
      dogId: "dog-1",
      disciplineId: "disc-1",
      isArchived: true,
      discipline: { id: "disc-1", name: "Agility" },
    })

    render(
      <EditDogDialog
        dog={aDog}
        isOpen={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )

    // Agility is active
    expect(screen.getByText("Agility")).toBeInTheDocument()

    // Click remove on Agility badge
    const removeAgilityBtn = screen.getByRole("button", { name: /odebrat disciplínu agility/i })
    await user.click(removeAgilityBtn)

    // Inline confirmation appears
    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent(/ukončit disciplínu/i)

    // Confirm archiving
    const confirmBtn = screen.getByRole("button", { name: "Ukončit disciplínu" })
    await user.click(confirmBtn)

    expect(setDogDiscipline).toHaveBeenCalledWith("dog-1", {
      name: "Agility",
      isArchived: true,
    })

    // Now Agility is in archived disciplines
    expect(screen.getByText("Ukončené disciplíny")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /obnovit disciplínu agility/i })).toBeInTheDocument()
  })

  it("displays archived disciplines from plan and restores them via setDogDiscipline", async () => {
    const user = userEvent.setup()
    vi.mocked(setDogDiscipline).mockResolvedValue({
      id: "dd-2",
      dogId: "dog-1",
      disciplineId: "disc-2",
      isArchived: false,
      discipline: { id: "disc-2", name: "Nosework" },
    })

    const initialPlan = [
      {
        id: "dd-1",
        isArchived: false,
        discipline: { id: "d-1", name: "Canicross" },
        goals: [],
      },
      {
        id: "dd-2",
        isArchived: true,
        discipline: { id: "d-2", name: "Nosework" },
        goals: [],
      },
    ]

    render(
      <EditDogDialog
        dog={{ ...aDog, disciplines: ["Canicross"] }}
        isOpen={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: createWrapper(initialPlan) },
    )

    // Nosework is listed under Ukončené disciplíny
    expect(screen.getByText("Ukončené disciplíny")).toBeInTheDocument()
    const restoreBtn = screen.getByRole("button", { name: /obnovit disciplínu nosework/i })
    expect(restoreBtn).toBeInTheDocument()

    // Click restore
    await user.click(restoreBtn)

    expect(setDogDiscipline).toHaveBeenCalledWith("dog-1", {
      name: "Nosework",
      isArchived: false,
    })
  })
})
