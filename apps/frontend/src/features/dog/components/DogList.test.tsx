import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as Router from "@tanstack/react-router"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { Dog } from "@/features/dog/api/dogSchemas"

import { DogCard } from "./DogCard"
import { DogList } from "./DogList"
import { PesAvatar } from "./PesAvatar"

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof Router>("@tanstack/react-router")
  return {
    ...actual,
    Link: ({
      to,
      params,
      children,
      ...props
    }: {
      to?: string
      params?: { dogId?: string }
      children?: React.ReactNode
      [key: string]: unknown
    }) => {
      const resolvedTo = typeof to === "string" ? to.replace("$dogId", params?.dogId ?? "") : "#"
      return (
        <a
          href={resolvedTo}
          {...props}
        >
          {children}
        </a>
      )
    },
  }
})

const aDog = (overrides: Partial<Dog> = {}): Dog => ({
  id: "dog-1",
  name: "Baryk",
  breed: "Zlatý retrívr",
  color: 1,
  ownerId: "u1",
  disciplines: [],
  createdAt: new Date("2026-01-01T10:00:00Z"),
  updatedAt: new Date("2026-01-01T10:00:00Z"),
  ...overrides,
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

describe("PesAvatar", () => {
  it("renders uppercase initial and correct dog color class", () => {
    render(
      <PesAvatar
        name="alík"
        color={2}
      />,
    )
    const avatar = screen.getByRole("img", { name: "Avatar psa alík" })
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveTextContent("A")
    expect(avatar).toHaveClass("bg-dog-2")
  })

  it("renders photo with ring color class when photoUrl is provided", () => {
    render(
      <PesAvatar
        name="Baryk"
        color={3}
        photoUrl="https://example.com/baryk.jpg"
      />,
    )
    const avatar = screen.getByRole("img", { name: "Avatar psa Baryk" })
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveClass("ring-dog-3")
    const img = screen.getByRole("img", { name: "Baryk" })
    expect(img).toHaveAttribute("src", "https://example.com/baryk.jpg")
    expect(img).toHaveClass("object-cover", "rounded-full")
  })

  it("falls back to uppercase initial on photo loading error", () => {
    render(
      <PesAvatar
        name="Baryk"
        color={1}
        photoUrl="https://example.com/broken.jpg"
      />,
    )
    const img = screen.getByRole("img", { name: "Baryk" })
    fireEvent.error(img)

    const avatar = screen.getByRole("img", { name: "Avatar psa Baryk" })
    expect(avatar).toHaveTextContent("B")
    expect(avatar).toHaveClass("bg-dog-1")
    expect(screen.queryByRole("img", { name: "Baryk" })).not.toBeInTheDocument()
  })
})

describe("DogCard", () => {
  it("renders dog name, breed and link", () => {
    const dog = aDog({ name: "Rex", breed: "Německý ovčák", color: 3 })
    render(<DogCard dog={dog} />, { wrapper: createWrapper() })

    expect(screen.getByText("Rex")).toBeInTheDocument()
    expect(screen.getByText("Německý ovčák")).toBeInTheDocument()
    const link = screen.getByRole("link", { name: /detail psa rex/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/dogs/dog-1")
  })
})

describe("DogList", () => {
  it("renders empty state when there are no dogs", () => {
    render(<DogList dogs={[]} />, { wrapper: createWrapper() })

    expect(screen.getByText("Přidejte prvního psa")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /přidat psa/i })).toBeInTheDocument()
  })

  it("renders list of dog cards when dogs are provided", () => {
    const dogs = [
      aDog({ id: "1", name: "Alík", color: 1 }),
      aDog({ id: "2", name: "Blesk", color: 2 }),
    ]
    render(<DogList dogs={dogs} />, { wrapper: createWrapper() })

    expect(screen.getByText("Alík")).toBeInTheDocument()
    expect(screen.getByText("Blesk")).toBeInTheDocument()
  })

  it("shows error state with working retry button", async () => {
    const user = userEvent.setup()
    const onReload = vi.fn()
    render(
      <DogList
        dogs={[]}
        error={new Error("Chyba spojení")}
        onReload={onReload}
      />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByText("Chyba při načítání psů")).toBeInTheDocument()
    expect(screen.getByText("Chyba spojení")).toBeInTheDocument()

    const retryBtn = screen.getByRole("button", { name: /zkusit znovu/i })
    await user.click(retryBtn)
    expect(onReload).toHaveBeenCalledOnce()
  })
})
