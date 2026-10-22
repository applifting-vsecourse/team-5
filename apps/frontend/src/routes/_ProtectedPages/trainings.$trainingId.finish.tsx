import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_ProtectedPages/trainings/$trainingId/finish")({
  component: TrainingFinishStub,
})

function TrainingFinishStub() {
  return null
}
