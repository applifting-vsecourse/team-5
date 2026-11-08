import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { InboxView } from "@/features/dog/components/InboxView"

export const Route = createFileRoute("/_ProtectedPages/messages")({
  component: MessagesPage,
})

function MessagesPage() {
  return (
    <>
      <Seo title="Zprávy" />
      <InboxView />
    </>
  )
}
