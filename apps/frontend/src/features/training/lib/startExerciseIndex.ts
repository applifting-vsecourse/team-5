import type { TrainingDetail } from "@/features/training/api/trainingSchemas"

// Opens at the goal's current step when it belongs to this training; otherwise
// the first exercise of the opened training (#66 AC6).
export function startExerciseIndex(training: TrainingDetail): number {
  if (!training.currentStepId || training.exercises.length === 0) return 0
  const index = training.exercises.findIndex((exercise) => exercise.id === training.currentStepId)
  return index >= 0 ? index : 0
}
