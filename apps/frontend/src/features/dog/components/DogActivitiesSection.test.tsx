import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it } from "vitest"

import { dogActivitiesSchema } from "@/features/dog/api/dogSchemas"

import { DogActivitiesSection } from "./DogActivitiesSection"

it("keeps a trainer's messages readable as smazaný uživatel after data refresh", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const interaction = userEvent.setup()
  const original = [
    {
      id: "log",
      title: "Poslušnost",
      status: "COMPLETED",
      messages: [
        {
          id: "message",
          text: "Pokračujte v tréninku.",
          createdAt: "2026-10-22T10:00:00Z",
          author: { id: "trainer", name: "Trenér Jan" },
        },
      ],
    },
  ] as const
  const content = (data: unknown) => (
    <QueryClientProvider client={client}>
      <DogActivitiesSection
        dogName="Rex"
        activities={dogActivitiesSchema.parse(data)}
      />
    </QueryClientProvider>
  )
  const { rerender, unmount } = render(content(original))
  await interaction.click(
    screen.getByRole("button", { name: "Otevřít detail aktivity Poslušnost" }),
  )
  expect(screen.getByText("Trenér Jan")).toBeInTheDocument()
  rerender(
    content([
      {
        ...original[0],
        messages: [{ ...original[0].messages[0], author: { id: null, name: "smazaný uživatel" } }],
      },
    ]),
  )
  expect(screen.getByText("smazaný uživatel")).toBeInTheDocument()
  expect(screen.getByText("Pokračujte v tréninku.")).toBeInTheDocument()
  expect(screen.queryByText("Trenér Jan")).not.toBeInTheDocument()
  unmount()
  client.clear()
})
