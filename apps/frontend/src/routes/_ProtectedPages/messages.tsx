import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_ProtectedPages/messages")({
  beforeLoad: () => {
    throw redirect({ to: "/history", replace: true })
  },
})
