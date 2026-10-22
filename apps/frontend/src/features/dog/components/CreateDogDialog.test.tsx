import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Dog } from "@/features/dog/api/dogSchemas"

import {
  CreateDogDialog,
  DEFAULT_DISCIPLINES,
  getFirstUnusedColor,
} from "./CreateDogDialog"

const aDog = (color: number): Dog => ({
  id: `d-${color}`,
  name: `Dog ${color}`,
  breed: "Retriever",
  color,
  ownerId: "u1",
  disciplines: [],
  createdAt: new Date(),
  updatedAt: new Date(),
})

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

describe("getFirstUnusedColor", () => {
  it("returns 1 when there are no dogs", () => {
    expect(getFirstUnusedColor([])).toBe(1)
    expect(getFirstUnusedColor(undefined)).toBe(1)
  })

  it("returns the first missing color in sequence", () => {
    expect(getFirstUnusedColor([aDog(1)])).toBe(2)
    expect(getFirstUnusedColor([aDog(1), aDog(2)])).toBe(3)
    expect(getFirstUnusedColor([aDog(1), aDog(3)])).toBe(2)
  })

  it("loops back to 1 when all 6 colors are used", () => {
    const allSix = [1, 2, 3, 4, 5, 6].map(aDog)
    expect(getFirstUnusedColor(allSix)).toBe(1)
  })
})

describe("CreateDogDialog", () => {
  const createObjectURLMock = vi.fn(() => "blob:test-photo-url")
  const revokeObjectURLMock = vi.fn()

  beforeEach(() => {
    createObjectURLMock.mockClear()
    revokeObjectURLMock.mockClear()
    window.URL.createObjectURL = createObjectURLMock
    window.URL.revokeObjectURL = revokeObjectURLMock
  })

  it("renders trigger and opens dialog", async () => {
    const user = userEvent.setup()
    render(<CreateDogDialog existingDogs={[aDog(1)]} />, {
      wrapper: createWrapper(),
    })

    const trigger = screen.getByRole("button", { name: /přidat psa/i })
    expect(trigger).toBeInTheDocument()

    await user.click(trigger)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByLabelText(/jméno psa \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/plemeno/i)).toBeInTheDocument()
  })

  it("validates required name field", async () => {
    const user = userEvent.setup()
    render(
      <CreateDogDialog
        isOpen={true}
        existingDogs={[]}
      />,
      {
        wrapper: createWrapper(),
      },
    )

    const submitBtn = screen.getByRole("button", { name: /vytvořit psa/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText("Jméno psa je povinné")).toBeInTheDocument()
    })
  })

  it("selects default first unused color", () => {
    render(
      <CreateDogDialog
        isOpen={true}
        existingDogs={[aDog(1)]}
      />,
      {
        wrapper: createWrapper(),
      },
    )

    const color2Btn = screen.getByRole("radio", { name: "Barva 2" })
    expect(color2Btn).toHaveAttribute("aria-checked", "true")
  })

  it("displays 3 default disciplines as toggleable checkboxes", async () => {
    const user = userEvent.setup()
    render(
      <CreateDogDialog
        isOpen={true}
        existingDogs={[]}
      />,
      {
        wrapper: createWrapper(),
      },
    )

    expect(DEFAULT_DISCIPLINES).toEqual(["Canicross", "Nosework", "Poslušnost"])

    const canicrossBtn = screen.getByRole("checkbox", { name: /canicross/i })
    const noseworkBtn = screen.getByRole("checkbox", { name: /nosework/i })
    const obedienceBtn = screen.getByRole("checkbox", { name: /poslušnost/i })

    expect(canicrossBtn).toBeInTheDocument()
    expect(noseworkBtn).toBeInTheDocument()
    expect(obedienceBtn).toBeInTheDocument()

    expect(canicrossBtn).toHaveAttribute("aria-checked", "false")
    await user.click(canicrossBtn)
    expect(canicrossBtn).toHaveAttribute("aria-checked", "true")

    // Unchecking
    await user.click(canicrossBtn)
    expect(canicrossBtn).toHaveAttribute("aria-checked", "false")
  })

  it("adds and removes custom discipline with max 40 chars and deduplication", async () => {
    const user = userEvent.setup()
    render(
      <CreateDogDialog
        isOpen={true}
        existingDogs={[]}
      />,
      {
        wrapper: createWrapper(),
      },
    )

    const customInput = screen.getByPlaceholderText(/vlastní disciplína/i)
    const addBtn = screen.getByRole("button", { name: /přidat/i })

    // Add valid custom discipline
    await user.type(customInput, "Agility")
    await user.click(addBtn)

    expect(screen.getByText("Agility")).toBeInTheDocument()
    expect(customInput).toHaveValue("")

    // Deduplication check
    await user.type(customInput, "agility")
    await user.click(addBtn)
    expect(screen.getByText("Tato disciplína je již vybrána")).toBeInTheDocument()

    // Deduplication against default discipline
    await user.clear(customInput)
    const canicrossBtn = screen.getByRole("checkbox", { name: /canicross/i })
    await user.click(canicrossBtn)
    await user.type(customInput, "Canicross")
    await user.click(addBtn)
    expect(screen.getByText("Tato disciplína je již vybrána")).toBeInTheDocument()

    // Remove custom discipline via X button
    const removeAgilityBtn = screen.getByRole("button", { name: /odebrat disciplínu agility/i })
    await user.click(removeAgilityBtn)
    expect(screen.queryByRole("button", { name: /odebrat disciplínu agility/i })).not.toBeInTheDocument()
  })

  it("handles photo upload, live preview, and photo removal", async () => {
    const user = userEvent.setup()
    render(
      <CreateDogDialog
        isOpen={true}
        existingDogs={[]}
      />,
      {
        wrapper: createWrapper(),
      },
    )

    const fileInput = screen.getByTestId("dog-photo-input")
    const validFile = new File(["dummy content"], "dog.jpg", { type: "image/jpeg" })

    // Upload photo
    await user.upload(fileInput, validFile)
    expect(createObjectURLMock).toHaveBeenCalled()

    // Photo preview and delete button exist
    const removeBtn = screen.getByRole("button", { name: /odstranit fotku/i })
    expect(removeBtn).toBeInTheDocument()

    // Remove photo
    await user.click(removeBtn)
    expect(screen.queryByRole("button", { name: /odstranit fotku/i })).not.toBeInTheDocument()
    expect(revokeObjectURLMock).toHaveBeenCalled()
  })

  it("validates file size over 10 MB", () => {
    render(
      <CreateDogDialog
        isOpen={true}
        existingDogs={[]}
      />,
      {
        wrapper: createWrapper(),
      },
    )

    const fileInput = screen.getByTestId("dog-photo-input")
    // 11 MB file
    const largeFile = new File([new Uint8Array(11 * 1024 * 1024)], "heavy.png", {
      type: "image/png",
    })

    fireEvent.change(fileInput, { target: { files: [largeFile] } })

    expect(screen.getByText("Fotka může mít maximálně 10 MB.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /odstranit fotku/i })).not.toBeInTheDocument()
  })

  it("validates invalid file format", () => {
    render(
      <CreateDogDialog
        isOpen={true}
        existingDogs={[]}
      />,
      {
        wrapper: createWrapper(),
      },
    )

    const fileInput = screen.getByTestId("dog-photo-input")
    const pdfFile = new File(["dummy pdf"], "document.pdf", { type: "application/pdf" })

    fireEvent.change(fileInput, { target: { files: [pdfFile] } })

    expect(
      screen.getByText("Podporovány jsou pouze obrázky ve formátu JPG, PNG nebo HEIC."),
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /odstranit fotku/i })).not.toBeInTheDocument()
  })
})
