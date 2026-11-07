import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { HistoryView } from "@/features/dog/components/HistoryView"

export const Route = createFileRoute("/_ProtectedPages/history")({ component: HistoryPage })
function HistoryPage() {
  return (
    <>
      <Seo title="Historie" />
      <HistoryView />
    </>
  )
}
