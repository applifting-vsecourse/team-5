import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_ProtectedPages/dogs/$dogId/activities/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/history", search: { dogId: params.dogId }, replace: true })
  },
})
