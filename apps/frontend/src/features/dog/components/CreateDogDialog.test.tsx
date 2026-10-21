import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import type { Dog } from "@/features/dog/api/dogSchemas"

import { CreateDogDialog, getFirstUnusedColor } from "./CreateDogDialog"

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
    // Dog 1 exists, so Color 2 should be preselected
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
})
